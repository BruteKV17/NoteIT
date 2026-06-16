import { auth } from '../firebaseConfig';

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

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
  const response = await fetch(`${backendUrl}/api/images/search?query=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to search images: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.images || [];
};
