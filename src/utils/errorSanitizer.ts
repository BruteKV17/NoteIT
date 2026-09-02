/**
 * Sanitizes technical, raw developer, or network error messages into clean, simple, user-friendly natural language statements.
 */
export function formatUserFriendlyErrorMessage(error: any, actionPrefix?: string): string {
  if (!error) {
    const base = "An unexpected issue occurred. Please try again.";
    return actionPrefix ? `${actionPrefix}: ${base}` : base;
  }

  let rawMessage = '';
  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message || String(error);
  } else if (typeof error === 'object') {
    rawMessage = error.message || error.error || error.statusText || JSON.stringify(error);
  } else {
    rawMessage = String(error);
  }

  const msgLower = rawMessage.toLowerCase();
  let friendlyMessage = '';

  // 1. API Limit / Rate Limit / Quota Exhausted
  if (
    msgLower.includes('429') ||
    msgLower.includes('resource_exhausted') ||
    msgLower.includes('quota') ||
    msgLower.includes('rate limit') ||
    msgLower.includes('api limit') ||
    msgLower.includes('too many requests') ||
    msgLower.includes('exceeded your current quota') ||
    msgLower.includes('insufficient_quota')
  ) {
    friendlyMessage = "Your API limit has been exhausted or rate limited. Please wait a moment or use another API key/provider in Settings.";
  }
  // 2. Network / Server Connection Failures
  else if (
    msgLower.includes('failed to fetch') ||
    msgLower.includes('networkerror') ||
    msgLower.includes('network error') ||
    msgLower.includes('err_connection_refused') ||
    msgLower.includes('fetch failed') ||
    msgLower.includes('network request failed') ||
    msgLower.includes('failed to connect') ||
    msgLower.includes('timeout') ||
    msgLower.includes('timed out')
  ) {
    friendlyMessage = "Unable to reach the server. Please check your internet connection or try again shortly.";
  }
  // 3. Invalid API Key / Unauthorized / Authentication Failures
  else if (
    msgLower.includes('401') ||
    msgLower.includes('403') ||
    msgLower.includes('invalid_key') ||
    msgLower.includes('invalid api key') ||
    msgLower.includes('api_key_invalid') ||
    msgLower.includes('unauthorized') ||
    msgLower.includes('permission denied') ||
    msgLower.includes('authentication failed') ||
    msgLower.includes('bad_api_key')
  ) {
    friendlyMessage = "Your API key is invalid or unauthorized. Please verify your API key in Settings.";
  }
  // 4. Service Overloaded / Temporarily Unavailable
  else if (
    msgLower.includes('503') ||
    msgLower.includes('500') ||
    msgLower.includes('service unavailable') ||
    msgLower.includes('internal server error') ||
    msgLower.includes('overloaded') ||
    msgLower.includes('model is overloaded') ||
    msgLower.includes('temporarily unavailable')
  ) {
    friendlyMessage = "The AI service is temporarily busy or unavailable. Please try again in a few seconds.";
  }
  // 5. Missing API Key
  else if (
    msgLower.includes('api key is not configured') ||
    msgLower.includes('api key missing') ||
    msgLower.includes('no api key') ||
    msgLower.includes('configure an api key')
  ) {
    friendlyMessage = "No API key configured. Please add your API key in Settings to continue.";
  }
  // 6. Missing Transcript or Source Content
  else if (
    msgLower.includes('transcript is not available') ||
    msgLower.includes('no transcript') ||
    msgLower.includes('transcript is required')
  ) {
    friendlyMessage = "Transcript is missing or empty. Please record or transcribe the lecture first.";
  }
  // 7. Generic technical / stack trace / raw JSON strings
  else if (
    msgLower.includes('json') ||
    msgLower.includes('syntaxerror') ||
    msgLower.includes('typeerror') ||
    msgLower.includes('[object object]') ||
    msgLower.includes('unexpected token')
  ) {
    friendlyMessage = "An unexpected issue occurred while processing request. Please try again.";
  }
  // 8. Clean readable prose fallback
  else {
    friendlyMessage = rawMessage;
  }

  if (actionPrefix) {
    return `${actionPrefix}: ${friendlyMessage}`;
  }
  return friendlyMessage;
}
