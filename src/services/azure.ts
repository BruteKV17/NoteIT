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
 * Request text extraction from a website or YouTube URL via backend service
 */
export const extractTextFromUrl = async (url: string, type: 'youtube' | 'website'): Promise<{ text: string; title: string }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
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
    const errorText = await response.text();
    logDiagnostic('POST', requestUrl, !!idToken, response.status, errorText);
    throw new Error(`Failed to extract text from URL: ${response.status} - ${errorText}`);
  }

  const responseBody = await response.json();
  logDiagnostic('POST', requestUrl, !!idToken, response.status, responseBody);
  return responseBody;
};

