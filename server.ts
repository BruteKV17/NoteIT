import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
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

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up local uploads fallback
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Initialize Firebase Admin SDK
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'noteit-ai-fd7eb';
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

try {
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath);
    console.log(`Initializing Firebase Admin with Service Account from: ${resolvedPath}`);
    initializeApp({
      credential: cert(resolvedPath),
      projectId: firebaseProjectId
    });
  } else {
    console.log('Initializing Firebase Admin with default credentials or project ID...');
    initializeApp({
      projectId: firebaseProjectId
    });
  }
  console.log('Firebase Admin initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Authentication middleware
const authenticateFirebaseUser = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.body.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    res.status(403).json({ error: 'Forbidden: Invalid authentication token.' });
    return;
  }
};

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
  } catch (error) {
    console.error('Failed to initialize Azure Blob Service Client:', error);
  }
} else {
  console.warn('Azure storage credentials missing. SAS generation will be unavailable.');
}

// Endpoint to generate Upload SAS URL
app.get('/api/storage/sas', authenticateFirebaseUser, async (req, res) => {
  const fileName = req.query.fileName as string;
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

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running locally on port ${PORT}`);
});
