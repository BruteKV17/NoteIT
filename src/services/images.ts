import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

/**
 * Searches stock photos by querying the backend API proxy.
 * Uses Firebase Auth token for security.
 */
export const searchImages = async (query: string): Promise<string[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
  }
  const idToken = await currentUser.getIdToken(true);

  const requestUrl = `${API_BASE_URL}/api/images/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(`[API Diagnostic] Base: ${API_BASE_URL}, Endpoint: ${requestUrl}, Status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to search images: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.images || [];
};
