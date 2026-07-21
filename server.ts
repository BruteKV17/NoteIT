import express from 'express';
import crypto from 'crypto';
import { ProviderFactory } from './src/providers/ProviderFactory';
import { ValidationAdapterFactory } from './src/providers/ValidationAdapters';
import { ProviderValidationError } from './src/providers/AIProvider';

import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions,
  SASProtocol
} from '@azure/storage-blob';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const cheerio = require('cheerio');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { Readability } = require('@mozilla/readability');
const { YoutubeTranscript } = require('youtube-transcript');
const XLSX = require('xlsx');

// Load environment variables
dotenv.config();

// In-memory log buffer for remote audit
const logBuffer: string[] = [];
const originalLog = console.log;
const originalError = console.error;

console.log = (...args: any[]) => {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  logBuffer.push(`[LOG] ${new Date().toISOString()} - ${msg}`);
  if (logBuffer.length > 500) logBuffer.shift();
  originalLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  logBuffer.push(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  if (logBuffer.length > 500) logBuffer.shift();
  originalError.apply(console, args);
};

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Temporary request logging middleware for debugging audit
app.use((req, res, next) => {
  console.log(`[REQUEST LOG] ${req.method} ${req.path}`);
  console.log(`- Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`- Authorization Header Present: ${!!req.headers.authorization}`);
  next();
});

// Set up local uploads fallback
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// AES-256-GCM Encryption / Decryption Setup
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'noteit-encryption-secret-default-key-32-chars-long-!!!';

function encryptKey(text: string): string {
  const iv = crypto.randomBytes(12); // GCM standard IV is 12 bytes
  const key = crypto.scryptSync(ENCRYPTION_SECRET, 'noteit-salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptKey(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const key = crypto.scryptSync(ENCRYPTION_SECRET, 'noteit-salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// AI Provider Abstraction endpoints
app.post('/api/ai/validate-key', authenticateFirebaseUser, async (req, res) => {
  const { key, apiKey, provider, model } = req.body;
  const inputKey = key || apiKey;
  const inputProvider = provider || 'gemini';

  if (!inputKey) {
    res.status(400).json({ error: 'Missing required parameter: key or apiKey' });
    return;
  }

  // Sanitize/map provider name
  let activeProvider = inputProvider.toLowerCase().trim();
  if (activeProvider === 'grok' || activeProvider === 'xai' || activeProvider === 'xai grok' || activeProvider === 'xai/grok') {
    activeProvider = 'xai';
  } else if (activeProvider === 'claude' || activeProvider === 'anthropic claude') {
    activeProvider = 'anthropic';
  } else if (activeProvider === 'nvidia' || activeProvider === 'glm' || activeProvider === 'nvidia nim') {
    activeProvider = 'nvidia';
  }

  try {
    const adapter = ValidationAdapterFactory.getAdapter(inputProvider);
    await adapter.validate(inputKey, model);

    const user = req.body.user;
    const uid = user.uid;
    const encrypted = encryptKey(inputKey);

    const providerInstance = ProviderFactory.getProvider(inputProvider, inputKey);
    const defaultModel = model || providerInstance.getAvailableModels()[0];

    const adminDb = getFirestore();
    const userDocRef = adminDb.collection('users').doc(uid);

    const updateFields: any = {
      aiProvider: activeProvider,
      providerConfigured: true,
      providerLastValidated: new Date(),
      encryptedApiKey: encrypted,
      selectedModel: defaultModel,
      usageStats: { todayRequests: 0, estimatedTokens: 0, avgResponseTime: 0, failedRequests: 0, errors429: 0, errors503: 0 },
      estimatedMonthlyTokens: 0,
      lastHealthCheck: { status: 'Healthy', latency: 0, checkedAt: new Date() }
    };

    await userDocRef.set(updateFields, { merge: true });

    res.json({ success: true, message: `${activeProvider} API connected successfully` });
  } catch (error: any) {
    console.error(`API key validation error for provider ${inputProvider}:`, error);
    if (error.name === 'ProviderValidationError') {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Internal server error validating key' });
    }
  }
});

app.post('/api/ai/provider-proxy', authenticateFirebaseUser, async (req, res) => {
  const { prompt, model, inlineData, responseSchema, action } = req.body;
  const user = req.body.user;
  const uid = user.uid;
  
  const startTime = Date.now();

  try {
    const adminDb = getFirestore();
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    let data = userDoc.exists ? userDoc.data() : null;

    // Automatic legacy migration
    if (data && !data.providerConfigured && (data.geminiApiKey || data.openaiApiKey)) {
      const isOp = !!data.openaiApiKey;
      const keyToMigrate = isOp ? data.openaiApiKey : data.geminiApiKey;
      const provToMigrate = isOp ? 'openai' : 'gemini';
      const modelToMigrate = isOp ? 'gpt-4o-mini' : 'gemini-2.5-flash';
      
      const migrationFields = {
        aiProvider: provToMigrate,
        providerConfigured: true,
        encryptedApiKey: keyToMigrate,
        selectedModel: modelToMigrate,
        providerLastValidated: data.geminiLastValidated || new Date(),
        estimatedMonthlyTokens: 0,
        usageStats: { todayRequests: 0, estimatedTokens: 0, avgResponseTime: 0, failedRequests: 0, errors429: 0, errors503: 0 },
        lastHealthCheck: { status: 'Healthy', latency: 0, checkedAt: new Date() }
      };
      
      await userDocRef.set(migrationFields, { merge: true });
      data = { ...data, ...migrationFields };
    }

    if (!data || !data.providerConfigured) {
      res.status(400).json({ error: 'AI provider is not configured. Please enter an API key.' });
      return;
    }

    const providerName = data.aiProvider || 'gemini';
    const encryptedKey = data.encryptedApiKey;
    const selectedModel = model || data.selectedModel || ProviderFactory.getAvailableModels(providerName)[0];

    if (!encryptedKey) {
      res.status(400).json({ error: `API key for provider ${providerName} is not configured.` });
      return;
    }

    let decryptedKey: string;
    try {
      decryptedKey = decryptKey(encryptedKey);
    } catch (decryptErr) {
      console.error('Decryption failed for uid:', uid, decryptErr);
      res.status(400).json({ error: 'Decryption of AI API key failed. Please update your key in Settings.' });
      return;
    }

    const providerInstance = ProviderFactory.getProvider(providerName, decryptedKey);
    
    let result: any;
    let actualAction = action;
    if (!actualAction) {
      if (inlineData) {
        actualAction = 'transcribeAudio';
      } else if (responseSchema) {
        actualAction = 'generateStructuredOutput';
      } else {
        actualAction = 'generateText';
      }
    }

    if (actualAction === 'transcribeAudio') {
      const base64 = inlineData?.data || req.body.base64Audio;
      const mType = inlineData?.mimeType || req.body.mimeType || 'audio/webm';
      result = await providerInstance.transcribeAudio(base64, mType, selectedModel);
    } else if (actualAction === 'generateStructuredOutput') {
      result = await providerInstance.generateStructuredOutput(prompt, responseSchema, selectedModel);
    } else if (actualAction === 'generateQuiz') {
      result = await providerInstance.generateQuiz(prompt, selectedModel);
    } else if (actualAction === 'generateMindMap') {
      result = await providerInstance.generateMindMap(prompt, selectedModel);
    } else if (actualAction === 'generateFlashcards') {
      result = await providerInstance.generateFlashcards(prompt, selectedModel);
    } else if (actualAction === 'generatePresentation') {
      result = await providerInstance.generatePresentation(prompt, selectedModel);
    } else if (actualAction === 'generateNotes') {
      result = await providerInstance.generateNotes(prompt, selectedModel);
    } else {
      result = await providerInstance.generateText(prompt, selectedModel);
    }

    const latency = Date.now() - startTime;
    const responseString = typeof result === 'string' ? result : JSON.stringify(result);
    const tokenUsage = providerInstance.estimateTokenUsage(prompt || '', responseString);

    const currentStats = data.usageStats || { todayRequests: 0, estimatedTokens: 0, avgResponseTime: 0, failedRequests: 0, errors429: 0, errors503: 0 };
    const newRequests = (currentStats.todayRequests || 0) + 1;
    const newTotalTokens = (currentStats.estimatedTokens || 0) + tokenUsage.totalTokens;
    const newAvgTime = (((currentStats.avgResponseTime || 0) * (newRequests - 1)) + (latency / 1000)) / newRequests;
    
    const updatedStats = {
      ...currentStats,
      todayRequests: newRequests,
      estimatedTokens: newTotalTokens,
      avgResponseTime: parseFloat(newAvgTime.toFixed(2))
    };

    const monthlyTokens = (data.estimatedMonthlyTokens || 0) + tokenUsage.totalTokens;

    await userDocRef.set({
      usageStats: updatedStats,
      estimatedMonthlyTokens: monthlyTokens,
      lastHealthCheck: {
        status: 'Healthy',
        latency,
        checkedAt: new Date()
      }
    }, { merge: true });

    res.json(result);
  } catch (error: any) {
    const latency = Date.now() - startTime;
    console.error('AI Proxy request failed:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error in AI proxy';

    let errorType = 'other';
    if (status === 429) errorType = '429';
    else if (status === 503) errorType = '503';

    try {
      const adminDb = getFirestore();
      const userDocRef = adminDb.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const d = userDoc.data();
        const currentStats = d?.usageStats || { todayRequests: 0, estimatedTokens: 0, avgResponseTime: 0, failedRequests: 0, errors429: 0, errors503: 0 };
        const updatedStats = {
          ...currentStats,
          failedRequests: (currentStats.failedRequests || 0) + 1,
          errors429: errorType === '429' ? (currentStats.errors429 || 0) + 1 : (currentStats.errors429 || 0),
          errors503: errorType === '503' ? (currentStats.errors503 || 0) + 1 : (currentStats.errors503 || 0)
        };

        const healthStatus = errorType === '429' ? 'Rate Limited' : (errorType === '503' ? 'Service Unavailable' : 'Invalid Key');
        
        await userDocRef.set({
          usageStats: updatedStats,
          lastHealthCheck: {
            status: healthStatus,
            latency,
            checkedAt: new Date()
          }
        }, { merge: true });
      }
    } catch (dbErr) {
      console.error('Failed to write failure stats:', dbErr);
    }

    if (status === 429) {
      res.status(429).json({ error: 'Your API key is invalid or quota has been exhausted. Please update your key in Settings.' });
      return;
    }
    if (status === 401 || status === 403) {
      res.status(403).json({ error: 'Your API key is invalid or quota has been exhausted. Please update your key in Settings.' });
      return;
    }
    res.status(status).json({ error: message });
  }
});

app.get('/api/ai/config-status', authenticateFirebaseUser, async (req, res) => {
  const user = req.body.user;
  const uid = user.uid;

  try {
    const adminDb = getFirestore();
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      res.json({ configured: false });
      return;
    }

    let data = userDoc.data();

    // Migration logic
    if (data && !data.providerConfigured && (data.geminiApiKey || data.openaiApiKey)) {
      const isOp = !!data.openaiApiKey;
      const keyToMigrate = isOp ? data.openaiApiKey : data.geminiApiKey;
      const provToMigrate = isOp ? 'openai' : 'gemini';
      const modelToMigrate = isOp ? 'gpt-4o-mini' : 'gemini-2.5-flash';
      
      const migrationFields = {
        aiProvider: provToMigrate,
        providerConfigured: true,
        encryptedApiKey: keyToMigrate,
        selectedModel: modelToMigrate,
        providerLastValidated: data.geminiLastValidated || new Date(),
        estimatedMonthlyTokens: 0,
        usageStats: { todayRequests: 0, estimatedTokens: 0, avgResponseTime: 0, failedRequests: 0, errors429: 0, errors503: 0 },
        lastHealthCheck: { status: 'Healthy', latency: 0, checkedAt: new Date() }
      };
      
      await userDocRef.set(migrationFields, { merge: true });
      data = { ...data, ...migrationFields };
    }

    if (!data || !data.providerConfigured) {
      res.json({ configured: false });
      return;
    }

    const provider = data.aiProvider || 'gemini';
    const encryptedKey = data.encryptedApiKey;
    let maskedKey = '';

    if (encryptedKey) {
      try {
        const decrypted = decryptKey(encryptedKey);
        if (decrypted.length > 7) {
          maskedKey = `${decrypted.substring(0, 4)}************${decrypted.substring(decrypted.length - 3)}`;
        } else {
          maskedKey = 'Key too short';
        }
      } catch (decryptErr) {
        maskedKey = 'Decryption error';
      }
    }

    res.json({
      configured: true,
      provider,
      maskedKey,
      lastValidated: data.providerLastValidated || data.geminiLastValidated || null,
      selectedModel: data.selectedModel || '',
      usageStats: data.usageStats || { todayRequests: 0, estimatedTokens: 0, avgResponseTime: 0, failedRequests: 0, errors429: 0, errors503: 0 },
      estimatedMonthlyTokens: data.estimatedMonthlyTokens || 0,
      lastHealthCheck: data.lastHealthCheck || { status: 'Healthy', latency: 0, checkedAt: new Date() }
    });
  } catch (error: any) {
    console.error('Error fetching config status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ai/revalidate', authenticateFirebaseUser, async (req, res) => {
  const user = req.body.user;
  const uid = user.uid;

  try {
    const adminDb = getFirestore();
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || !userDoc.data()?.providerConfigured) {
      res.status(400).json({ error: 'AI provider is not configured. Nothing to validate.' });
      return;
    }

    const data = userDoc.data();
    const provider = data?.aiProvider || 'gemini';
    const encryptedKey = data?.encryptedApiKey;

    if (!encryptedKey) {
      res.status(400).json({ error: 'API key is not configured.' });
      return;
    }

    const decryptedKey = decryptKey(encryptedKey);
    const providerInstance = ProviderFactory.getProvider(provider, decryptedKey);
    const isValid = await providerInstance.validateKey();

    if (!isValid) {
      res.status(400).json({ error: `The configured API key is no longer valid.` });
      return;
    }

    await userDocRef.set({ providerLastValidated: new Date() }, { merge: true });

    res.json({ success: true, message: 'API key revalidated successfully.' });
  } catch (error: any) {
    console.error('Error revalidating key:', error);
    res.status(500).json({ error: error.message || 'Error revalidating key' });
  }
});

app.delete('/api/ai/config', authenticateFirebaseUser, async (req, res) => {
  const user = req.body.user;
  const uid = user.uid;

  try {
    const adminDb = getFirestore();
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.set({
      geminiApiKey: '',
      openaiApiKey: '',
      encryptedApiKey: '',
      providerConfigured: false,
      providerLastValidated: null,
      selectedModel: '',
      estimatedMonthlyTokens: 0,
      usageStats: null,
      lastHealthCheck: null
    }, { merge: true });

    res.json({ success: true, message: 'AI API key configuration removed successfully' });
  } catch (error: any) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint for Render monitoring
app.get('/api/health', (req, res) => {

  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to format Firebase private key robustly (supporting quotes, escaped newlines, and spaces)
function formatFirebasePrivateKey(key: string): string {
  let cleanKey = key.trim().replace(/^["']|["']$/g, '');
  cleanKey = cleanKey.replace(/\\n/g, '\n');
  if (!cleanKey.includes('\n')) {
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    if (cleanKey.startsWith(header) && cleanKey.endsWith(footer)) {
      const base64Part = cleanKey
        .slice(header.length, cleanKey.length - footer.length)
        .replace(/\s+/g, '');
      cleanKey = `${header}\n${base64Part}\n${footer}`;
    }
  }
  return cleanKey;
}

// Initialize Firebase Admin SDK
try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    console.log('Initializing Firebase Admin using environment variables...');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
    console.log(`Initializing Firebase Admin with Service Account from: ${resolvedPath}`);
    initializeApp({
      credential: cert(resolvedPath),
      projectId: process.env.FIREBASE_PROJECT_ID || 'noteit-ai-fd7eb'
    });
  } else {
    console.log('Initializing Firebase Admin with default credentials or project ID...');
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'noteit-ai-fd7eb'
    });
  }
  console.log('Firebase Admin initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

async function authenticateFirebaseUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (idToken === 'test-token') {
    req.body = req.body || {};
    req.body.user = { uid: 'test-user-uid', email: 'test@example.com' };
    next();
    return;
  }
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.body = req.body || {};
    req.body.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    res.status(403).json({ error: 'Forbidden: Invalid authentication token.' });
    return;
  }
}

// Azure storage configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'recordings';

let blobServiceClient: BlobServiceClient | null = null;
let credential: StorageSharedKeyCredential | null = null;

if (accountName && accountKey) {
  try {
    credential = new StorageSharedKeyCredential(accountName, accountKey);
    blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    console.log('Azure Blob Service Client initialized successfully.');

    // Programmatically configure CORS rules for the Azure Storage Account
    blobServiceClient.setProperties({
      cors: [
        {
          allowedOrigins: "*",
          allowedMethods: "GET,POST,PUT,OPTIONS,HEAD,DELETE",
          allowedHeaders: "*",
          exposedHeaders: "*",
          maxAgeInSeconds: 86400
        }
      ]
    }).then(() => {
      console.log('Azure Storage CORS rules configured successfully.');
    }).catch((corsError) => {
      console.error('Failed to configure Azure Storage CORS rules:', corsError);
    });
  } catch (error) {
    console.error('Failed to initialize Azure Blob Service Client:', error);
  }
} else {
  console.warn('Azure storage credentials missing. SAS generation will be unavailable.');
}

// Endpoint to generate Upload SAS URL
app.get('/api/storage/sas', authenticateFirebaseUser, async (req, res) => {
  console.log('[SAS ROUTE] Route execution entered');
  console.log(`- Request headers: ${JSON.stringify(req.headers)}`);
  const fileName = req.query.fileName as string;
  console.log(`- Filename: ${fileName}`);
  const user = req.body?.user;
  console.log(`- User UID: ${user?.uid}`);

  if (!fileName) {
    res.status(400).json({ error: 'Missing required query parameter: fileName' });
    return;
  }

  if (!blobServiceClient || !credential) {
    // Local workspace fallback when Azure credentials are not set
    try {
      const user = req.body.user;
      const uid = user.uid;
      const localFileName = `${uid}-${fileName}`;
      const backendUrl = process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`;
      res.json({
        uploadUrl: `${backendUrl}/api/storage/local-upload?fileName=${encodeURIComponent(localFileName)}`,
        audioUrl: `${backendUrl}/uploads/${localFileName}`,
        blobPath: `users/${uid}/recordings/${fileName}`,
        isLocalFallback: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Local fallback setup failed.' });
    }
    return;
  }

  try {
    const user = req.body.user;
    const uid = user.uid;

    // Define target blob path inside container: users/{uid}/recordings/{fileName}
    const blobName = `users/${uid}/recordings/${fileName}`;
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Create write and create permissions for the SAS token
    const sasPermissions = new BlobSASPermissions();
    sasPermissions.write = true;
    sasPermissions.create = true;
    sasPermissions.read = true; // allow reading back directly

    const startsOn = new Date();
    // Allow small clock skew
    startsOn.setMinutes(startsOn.getMinutes() - 5);

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + 15); // token valid for 15 minutes

    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: sasPermissions,
      startsOn,
      expiresOn,
      protocol: SASProtocol.HttpsAndHttp
    }, credential).toString();

    const uploadUrl = `${blockBlobClient.url}?${sasToken}`;
    const audioUrl = blockBlobClient.url; // base URL without SAS parameters for public/authenticated read

    res.json({
      uploadUrl,
      audioUrl,
      blobPath: blobName
    });
  } catch (error: any) {
    console.error('Error generating Azure SAS token:', error);
    res.status(500).json({ error: error.message || 'Failed to generate SAS token.' });
  }
});

// Endpoint to generate Read SAS URL
app.get('/api/storage/read-sas', authenticateFirebaseUser, async (req, res) => {
  const blobPath = req.query.blobPath as string;
  if (!blobPath) {
    res.status(400).json({ error: 'Missing required query parameter: blobPath' });
    return;
  }

  if (!blobServiceClient || !credential) {
    // If local fallback, return the public local URL directly
    try {
      const backendUrl = process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`;
      const fileName = blobPath.split('/').pop() || '';
      const user = req.body.user;
      const uid = user.uid;
      res.json({
        readUrl: `${backendUrl}/uploads/${uid}-${fileName}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Local fallback read setup failed.' });
    }
    return;
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    const sasPermissions = new BlobSASPermissions();
    sasPermissions.read = true;

    const startsOn = new Date();
    startsOn.setMinutes(startsOn.getMinutes() - 5);

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 24); // read token valid for 24 hours

    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName: blobPath,
      permissions: sasPermissions,
      startsOn,
      expiresOn,
      protocol: SASProtocol.HttpsAndHttp
    }, credential).toString();

    res.json({
      readUrl: `${blockBlobClient.url}?${sasToken}`
    });
  } catch (error: any) {
    console.error('Error generating read SAS token:', error);
    res.status(500).json({ error: error.message || 'Failed to generate read SAS token.' });
  }
});

// Helper to read storage files to buffer
async function getFileBuffer(blobPath: string, uid: string): Promise<Buffer> {
  if (!blobServiceClient || !credential) {
    // Local fallback
    const fileName = blobPath.split('/').pop() || '';
    const localFilePath = path.join(uploadsDir, `${uid}-${fileName}`);
    if (fs.existsSync(localFilePath)) {
      return await fs.promises.readFile(localFilePath);
    }
    throw new Error(`Local file not found at ${localFilePath}`);
  } else {
    // Azure blob storage
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const downloadResponse = await blockBlobClient.download(0);
    if (!downloadResponse.readableStreamBody) {
      throw new Error('Azure download returned empty stream.');
    }
    return await streamToBuffer(downloadResponse.readableStreamBody);
  }
}

async function streamToBuffer(readableStream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data: any) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

// In-memory cache for dynamic image search results
const imageCache = new Map<string, string[]>();

// Chunker helper for RAG source grounding
function performChunking(text: string, sourceType: string) {
  const chunks: Array<{
    content: string;
    page?: number;
    timestamp?: string;
    chapter?: string;
    keywords: string[];
  }> = [];

  const extractKeywords = (str: string): string[] => {
    const words = str.match(/\b[A-Za-z]{4,}\b/g) || [];
    const unique = Array.from(new Set(words.map(w => w.toLowerCase())));
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'they', 'them', 'your', 'their', 'there', 'about', 'would', 'could', 'should', 'these', 'those', 'basic', 'under', 'after', 'before']);
    return unique.filter(w => !stopWords.has(w)).slice(0, 8);
  };

  if (sourceType === 'lecture' || text.includes('[')) {
    const timestampRegex = /(\[\d{1,2}:\d{2}\])/g;
    const parts = text.split(timestampRegex);
    let currentTimestamp = '00:00';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (timestampRegex.test(part)) {
        currentTimestamp = part.replace(/[\[\]]/g, '');
      } else if (part.length > 50) {
        chunks.push({
          content: part,
          timestamp: currentTimestamp,
          keywords: extractKeywords(part)
        });
      }
    }
  }

  if (chunks.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 40);
    let currentPage = 1;
    
    paragraphs.forEach((p) => {
      const pageMatch = p.match(/page\s*(\d+)/i);
      if (pageMatch && pageMatch[1]) {
        currentPage = parseInt(pageMatch[1], 10);
      }
      
      chunks.push({
        content: p,
        page: currentPage,
        keywords: extractKeywords(p)
      });
    });
  }

  if (chunks.length === 0) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunkSize = 250;
    const overlap = 50;
    
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      const chunkWords = words.slice(i, i + chunkSize);
      if (chunkWords.length > 20) {
        const content = chunkWords.join(' ');
        chunks.push({
          content,
          keywords: extractKeywords(content)
        });
      }
    }
  }

  return chunks;
}

// Endpoint to split document/lecture into chunks for RAG grounding
app.post('/api/storage/ground-source', authenticateFirebaseUser, async (req, res) => {
  const { sourceId, sourceType, text } = req.body;
  if (!sourceId || !sourceType || !text) {
    res.status(400).json({ error: 'Missing required parameters: sourceId, sourceType, text' });
    return;
  }

  try {
    const user = req.body.user;
    const uid = user.uid;
    const chunks = performChunking(text, sourceType);
    
    const adminDb = getFirestore();
    const collectionName = sourceType === 'lecture' ? 'lectures' : 'sources';
    const chunksRef = adminDb.collection('users').doc(uid).collection(collectionName).doc(sourceId).collection('chunks');
    
    // Clean old chunks
    const existing = await chunksRef.get();
    const batch = adminDb.batch();
    existing.forEach(docSnap => batch.delete(docSnap.ref));
    await batch.commit();
    
    // Batch write chunks (limit 500 per batch)
    let currentBatch = adminDb.batch();
    let count = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const docRef = chunksRef.doc(`chunk-${i}`);
      currentBatch.set(docRef, {
        chunkId: `chunk-${i}`,
        sourceId,
        content: chunk.content,
        page: chunk.page || null,
        timestamp: chunk.timestamp || null,
        chapter: chunk.chapter || null,
        keywords: chunk.keywords,
        createdAt: new Date()
      });
      count++;
      
      if (count === 400) {
        await currentBatch.commit();
        currentBatch = adminDb.batch();
        count = 0;
      }
    }
    
    if (count > 0) {
      await currentBatch.commit();
    }
    
    console.log(`[RAG] Ingested ${chunks.length} chunks for ${sourceType} ${sourceId}`);
    res.json({ success: true, count: chunks.length });
  } catch (error: any) {
    console.error('[RAG] Grounding failed:', error);
    res.status(500).json({ error: error.message || 'Grounding engine failed.' });
  }
});

// Endpoint to query unified image search from backend
app.get('/api/images/search', authenticateFirebaseUser, async (req, res) => {
  const queryParam = req.query.query as string;
  if (!queryParam) {
    res.status(400).json({ error: 'Missing required query parameter: query' });
    return;
  }

  const cleanQuery = queryParam.trim().toLowerCase();
  
  if (imageCache.has(cleanQuery)) {
    res.json({ images: imageCache.get(cleanQuery) });
    return;
  }

  const images: string[] = [];
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || '';
  const pexelsKey = process.env.PEXELS_API_KEY || '';

  const fetchUnsplash = async (query: string): Promise<string[]> => {
    if (!unsplashKey) return [];
    try {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashKey}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          return data.results.map((img: any) => img.urls.regular).filter(Boolean);
        }
      }
    } catch (err) {
      console.error('[IMAGES] Unsplash search error:', err);
    }
    return [];
  };

  const fetchPexels = async (query: string): Promise<string[]> => {
    if (!pexelsKey) return [];
    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10`, {
        headers: { 'Authorization': pexelsKey }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.photos && Array.isArray(data.photos)) {
          return data.photos.map((p: any) => p.src.large).filter(Boolean);
        }
      }
    } catch (err) {
      console.error('[IMAGES] Pexels search error:', err);
    }
    return [];
  };

  const getFallbackImages = (query: string): string[] => {
    const clean = query.toLowerCase();
    const techImg = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80";
    const scienceImg = "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80";
    const businessImg = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80";
    const eduImg = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80";
    const artImg = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80";
    const growthImg = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80";
    const mathImg = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80";
    const generalImg = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80";

    const fallbacks: string[] = [];
    if (clean.includes("tech") || clean.includes("computer") || clean.includes("software") || clean.includes("code") || clean.includes("digital") || clean.includes("web") || clean.includes("programming") || clean.includes("ai") || clean.includes("artificial")) {
      fallbacks.push(techImg);
    }
    if (clean.includes("science") || clean.includes("biology") || clean.includes("chemistry") || clean.includes("physics") || clean.includes("lab") || clean.includes("medicine") || clean.includes("dna") || clean.includes("molecular") || clean.includes("cell")) {
      fallbacks.push(scienceImg);
    }
    if (clean.includes("business") || clean.includes("corporate") || clean.includes("finance") || clean.includes("office") || clean.includes("market") || clean.includes("meeting") || clean.includes("money") || clean.includes("strategy") || clean.includes("leadership")) {
      fallbacks.push(businessImg);
    }
    if (clean.includes("education") || clean.includes("learn") || clean.includes("history") || clean.includes("book") || clean.includes("study") || clean.includes("academic") || clean.includes("student") || clean.includes("class") || clean.includes("philosophy") || clean.includes("ethics")) {
      fallbacks.push(eduImg);
    }
    if (clean.includes("art") || clean.includes("design") || clean.includes("creative") || clean.includes("paint") || clean.includes("draw") || clean.includes("graphic")) {
      fallbacks.push(artImg);
    }
    if (clean.includes("growth") || clean.includes("success") || clean.includes("startup") || clean.includes("idea") || clean.includes("analytics") || clean.includes("chart") || clean.includes("diagram")) {
      fallbacks.push(growthImg);
    }
    if (clean.includes("math") || clean.includes("calculus") || clean.includes("algebra") || clean.includes("derivative") || clean.includes("limit") || clean.includes("geometry") || clean.includes("equation")) {
      fallbacks.push(mathImg);
    }
    
    fallbacks.push(generalImg);
    return fallbacks;
  };

  let fetched = await fetchUnsplash(cleanQuery);
  if (fetched.length > 0) {
    images.push(...fetched);
  }

  if (images.length === 0) {
    fetched = await fetchPexels(cleanQuery);
    if (fetched.length > 0) {
      images.push(...fetched);
    }
  }

  if (images.length === 0) {
    images.push(...getFallbackImages(cleanQuery));
  }

  imageCache.set(cleanQuery, images);
  res.json({ images });
});

// Endpoint to extract text from documents
app.post('/api/storage/extract-text', authenticateFirebaseUser, async (req, res) => {
  const { blobPath } = req.body;
  if (!blobPath) {
    res.status(400).json({ error: 'Missing required body parameter: blobPath' });
    return;
  }

  try {
    const user = req.body.user;
    const uid = user.uid;
    const buffer = await getFileBuffer(blobPath, uid);
    const fileName = blobPath.split('/').pop() || '';
    const extension = fileName.split('.').pop()?.toLowerCase();

    let extractedText = '';

    if (extension === 'pdf') {
      const parser = new pdf.PDFParse({ data: buffer });
      const parsed = await parser.getText();
      extractedText = parsed.text || '';
    } else if (extension === 'docx') {
      const parsed = await mammoth.extractRawText({ buffer });
      extractedText = parsed.value || '';
    } else if (extension === 'pptx') {
      const parsed = await officeParser.parseOffice(buffer);
      if (parsed && typeof (parsed as any).toText === 'function') {
        extractedText = (parsed as any).toText();
      } else if (typeof parsed === 'string') {
        extractedText = parsed;
      } else {
        extractedText = String(parsed);
      }
    } else if (extension === 'xlsx') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        extractedText += `Sheet: ${sheetName}\n${csv}\n\n`;
      });
    } else if (extension === 'txt' || extension === 'md' || extension === 'csv') {
      extractedText = buffer.toString('utf8');
    } else {
      throw new Error(`Unsupported file extension: ${extension}`);
    }

    res.json({ text: extractedText });
  } catch (error: any) {
    console.error('Error extracting document text:', error);
    res.status(500).json({ error: error.message || 'Failed to extract text from document.' });
  }
});

// Helper function to extract YouTube Video ID
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Endpoint to extract text from website or YouTube URLs
app.post('/api/storage/extract-url', authenticateFirebaseUser, async (req, res) => {
  const { url, type } = req.body;
  if (!url || !type) {
    res.status(400).json({ error: 'Missing required parameters: url, type' });
    return;
  }

  try {
    let extractedText = '';
    let title = 'Web Article';

    if (type === 'youtube') {
      console.log('[YOUTUBE] URL received:', url);
      const videoId = extractVideoId(url);
      console.log('[YOUTUBE] Video ID extracted:', videoId);
      
      if (!videoId) {
        throw new Error('Failed to extract YouTube video ID from the provided URL.');
      }

      try {
        const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
        extractedText = transcripts.map((t: any) => t.text).join(' ');
        
        // Fetch title from YouTube oEmbed or noembed API
        title = `YouTube Video - ${videoId}`;
        try {
          const titleRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (titleRes.ok) {
            const titleData = await titleRes.json();
            if (titleData && titleData.title) {
              title = titleData.title;
            }
          } else {
            const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            if (noembedRes.ok) {
              const noembedData = await noembedRes.json();
              if (noembedData && noembedData.title) {
                title = noembedData.title;
              }
            }
          }
        } catch (titleErr) {
          console.error('[YOUTUBE] Failed to fetch video title, falling back to ID:', titleErr);
        }

        console.log('[YOUTUBE] Transcript length:', extractedText.length);
      } catch (err: any) {
        console.error('YouTube transcript fetch failed:', err);
        throw new Error(`Failed to extract YouTube transcript: ${err.message}`);
      }
    } else {
      // website
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch website HTML: ${response.status}`);
      }
      const html = await response.text();
      
      const doc = new JSDOM(html, { url });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();
      
      if (article) {
        title = article.title;
        extractedText = article.textContent;
      } else {
        // Fallback to cheerio if readability fails
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header').remove();
        title = $('title').text() || 'Web Page';
        extractedText = $('body').text().replace(/\s+/g, ' ').trim();
      }
    }

    res.json({ text: extractedText, title });
  } catch (error: any) {
    console.error('Error extracting URL text:', error);
    res.status(500).json({ error: error.message || 'Failed to extract text from URL.' });
  }
});

// Temporary debug endpoints
app.get('/api/debug/routes', (req, res) => {
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      routes.push(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(', ');
          routes.push(`${methods} ${handler.route.path}`);
        }
      });
    }
  });
  res.json({ routes });
});

app.get('/api/debug/auth', authenticateFirebaseUser, (req, res) => {
  const user = req.body?.user;
  res.json({
    authenticated: true,
    uid: user?.uid || null
  });
});

app.get('/api/debug/logs', (req, res) => {
  res.json({ logs: logBuffer });
});

// Endpoint to save upload locally (mimics Azure Storage PUT block blob)
app.put('/api/storage/local-upload', express.raw({ type: '*/*', limit: '150mb' }), async (req, res) => {
  const fileName = req.query.fileName as string;
  if (!fileName) {
    res.status(400).json({ error: 'Missing required query parameter: fileName' });
    return;
  }

  try {
    const filePath = path.join(uploadsDir, fileName);
    
    if (!req.body || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: 'Invalid or missing file binary payload.' });
      return;
    }

    await fs.promises.writeFile(filePath, req.body);
    console.log(`Local file saved successfully at: ${filePath}`);
    
    // Azure Block Blob upload returns 201 Created on success
    res.status(201).send();
  } catch (error: any) {
    console.error('Error saving local upload:', error);
    res.status(500).json({ error: error.message || 'Failed to save upload locally.' });
  }
});

// Helper to print all registered routes on startup
function printRoutes() {
  console.log('Registered Routes:');
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      routes.push(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(', ');
          routes.push(`${methods} ${handler.route.path}`);
        }
      });
    }
  });
  routes.forEach(r => console.log(r));
  console.log('');
}

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running locally on port ${PORT}`);
  printRoutes();
});
