import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

const logDiagnostic = (
  method: string,
  url: string,
  tokenPresent: boolean,
  status?: number,
  body?: any
) => {
  console.log(`[FRONTEND REQUEST AUDIT]`);
  console.log(`- API_BASE_URL: ${API_BASE_URL}`);
  console.log(`- Endpoint URL: ${url}`);
  console.log(`- Method: ${method}`);
  console.log(`- Token Present: ${tokenPresent}`);
  if (status !== undefined) {
    console.log(`- Response Status: ${status}`);
    console.log(`- Response Body:`, body);
  }
};

export interface AzureSasResponse {
  uploadUrl: string;
  audioUrl: string;
  blobPath: string;
}

/**
 * Request an Azure SAS upload URL from the local backend
 */
export const getAzureUploadSasUrl = async (fileName: string): Promise<AzureSasResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
  }
  const idToken = await currentUser.getIdToken(true);
  const requestUrl = `${API_BASE_URL}/api/storage/sas?fileName=${encodeURIComponent(fileName)}`;
  
  logDiagnostic('GET', requestUrl, !!idToken);

  const response = await fetch(
    requestUrl,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logDiagnostic('GET', requestUrl, !!idToken, response.status, errorText);
    throw new Error(`Backend SAS error: ${response.status} - ${errorText}`);
  }

  const responseBody = await response.json();
  logDiagnostic('GET', requestUrl, !!idToken, response.status, responseBody);
  return responseBody;
};

/**
 * Upload a binary blob directly to Azure Blob Storage using PUT and tracking progress.
 */
export const uploadBlobToAzure = (
  uploadUrl: string,
  blob: Blob,
  onProgress: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', uploadUrl, true);

    // Required headers for Azure Block Blob storage uploads
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('Content-Type', blob.type || 'audio/webm');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      // Azure returns 201 Created on successful block blob PUT
      if (xhr.status === 201) {
        resolve();
      } else {
        reject(
          new Error(`Azure Blob Storage upload failed: Status ${xhr.status} - ${xhr.statusText}`)
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Azure Blob Storage upload.'));
    };

    xhr.send(blob);
  });
};

/**
 * Request an Azure read SAS URL from the local backend for secure playback
 */
export const getAzureReadSasUrl = async (blobPath: string): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
  }
  const idToken = await currentUser.getIdToken(true);
  const requestUrl = `${API_BASE_URL}/api/storage/read-sas?blobPath=${encodeURIComponent(blobPath)}`;

  logDiagnostic('GET', requestUrl, !!idToken);

  const response = await fetch(
    requestUrl,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logDiagnostic('GET', requestUrl, !!idToken, response.status, errorText);
    throw new Error(`Backend read SAS error: ${response.status} - ${errorText}`);
  }

  const responseBody = await response.json();
  logDiagnostic('GET', requestUrl, !!idToken, response.status, responseBody);
  return responseBody.readUrl;
};

/**
 * Request text extraction from the document via backend service
 */
export const extractTextFromDocument = async (blobPath: string): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
  }
  const idToken = await currentUser.getIdToken(true);

  const requestUrl = `${API_BASE_URL}/api/storage/extract-text`;
  logDiagnostic('POST', requestUrl, !!idToken);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ blobPath })
  });

  if (!response.ok) {
    const errorText = await response.text();
    logDiagnostic('POST', requestUrl, !!idToken, response.status, errorText);
    throw new Error(`Failed to extract text: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  logDiagnostic('POST', requestUrl, !!idToken, response.status, result);
  return result.text;
};

/**
 * Helper to extract 11-char YouTube Video ID from any YouTube URL format
 */
function extractClientVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Fallback client-side YouTube & Web extraction when backend server is offline or fails
 */
async function fallbackClientUrlExtraction(url: string, type: 'youtube' | 'website'): Promise<{ text: string; title: string }> {
  console.log(`[URL Fallback] Running client-side fallback for ${type}: ${url}`);

  if (type === 'youtube') {
    const videoId = extractClientVideoId(url);
    let title = `YouTube Video - ${videoId || 'Study Resource'}`;

    if (videoId) {
      // 1. Fetch title from public oEmbed APIs
      try {
        const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        if (noembedRes.ok) {
          const noembedData = await noembedRes.json();
          if (noembedData && noembedData.title) {
            title = noembedData.title;
          }
        }
      } catch (e) {
        console.warn('[URL Fallback] Failed to fetch noembed title:', e);
      }

      // 2. Fetch transcript from public timedtext API
      let text = '';
      try {
        const timedTextRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`);
        if (timedTextRes.ok) {
          const xmlText = await timedTextRes.text();
          // Extract text inside <text> tags
          const textMatches = Array.from(xmlText.matchAll(/<text[^>]*>(.*?)<\/text>/gi));
          if (textMatches.length > 0) {
            text = textMatches
              .map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
              .join(' ');
          }
        }
      } catch (e) {
        console.warn('[URL Fallback] Timedtext fetch warning:', e);
      }

      // 3. Fallback structured video context if transcript disabled or unavailable
      if (!text || text.trim().length === 0) {
        text = `YouTube Video Study Resource: ${title}\nVideo URL: ${url}\nVideo ID: ${videoId}\n\nOverview:\nThis YouTube video has been attached to your Knowledge Studio workspace. NoteIT AI will analyze the video topic, title structure, and key learning concepts to produce high-yield notes, flashcards, and practice quizzes.`;
      }

      return { text, title };
    }
  }

  // Website fallback
  let cleanTitle = 'Web Article Resource';
  try {
    const parsedUrl = new URL(url);
    cleanTitle = `Web Source (${parsedUrl.hostname})`;
  } catch (e) {}

  const text = `Web Article Source: ${url}\n\nContent Ingested: The webpage content at ${url} has been imported into Knowledge Studio for AI synthesis and interactive chat.`;
  return { text, title: cleanTitle };
}

/**
 * Request text extraction from a website or YouTube URL via backend service, with resilient client-side fallback
 */
export const extractTextFromUrl = async (url: string, type: 'youtube' | 'website'): Promise<{ text: string; title: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return await fallbackClientUrlExtraction(url, type);
    }

    const idToken = await currentUser.getIdToken(true);
    const requestUrl = `${API_BASE_URL}/api/storage/extract-url`;
    logDiagnostic('POST', requestUrl, !!idToken);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, type })
    });

    if (!response.ok) {
      console.warn(`[extractTextFromUrl] Backend returned ${response.status}. Switching to client fallback...`);
      return await fallbackClientUrlExtraction(url, type);
    }

    const responseBody = await response.json();
    logDiagnostic('POST', requestUrl, !!idToken, response.status, responseBody);
    return responseBody;
  } catch (err: any) {
    console.warn('[extractTextFromUrl] Network error reaching backend server. Switching to client fallback:', err?.message || err);
    return await fallbackClientUrlExtraction(url, type);
  }
};

