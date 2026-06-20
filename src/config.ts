/**
 * Centralized API configuration.
 * Uses VITE_API_URL from environment variables.
 */

const isProd = import.meta.env.PROD;
const apiEnvUrl = import.meta.env.VITE_API_URL;

if (isProd && !apiEnvUrl) {
  const errMsg = "FATAL ERROR: VITE_API_URL environment variable is missing in production! Deployed frontend cannot access localhost. Please configure VITE_API_URL in your hosting dashboard.";
  console.error(errMsg);
  throw new Error(errMsg);
}

export const API_BASE_URL = apiEnvUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
