/**
 * Bhai Lang Contextual Explanation Service
 * Converts selected academic text into intuitive, natural Hinglish explanations ("Bhai simple bolu toh...").
 */

import { API_BASE_URL } from '../config';
import { formatUserFriendlyErrorMessage } from '../utils/errorSanitizer';

// In-memory cache for repeated explanations during a session
const explanationCache = new Map<string, string>();

export async function explainInBhaiLang(text: string, subjectName?: string): Promise<string> {
  if (!text || !text.trim()) return "Please select a valid paragraph or text snippet.";
  
  const trimmed = text.trim();
  const cacheKey = `${subjectName || 'gen'}:${trimmed.slice(0, 100)}`;
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/explain-bhailang`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: trimmed, subjectName })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.explanation) {
        explanationCache.set(cacheKey, data.explanation);
        return data.explanation;
      }
    }
  } catch (e) {
    console.warn('[BhaiLangService] Backend endpoint call skipped/failed, using local fallback prompt:', e);
  }

  // Client-side direct fallback
  try {
    const { fetchGeminiApi } = await import('../providers/GeminiProvider');
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
    if (apiKey) {
      const prompt = `Explain the following text in natural, intuitive Indian student Hinglish (Bhai Lang style). Start with "Bhai simple bolu toh:". Keep technical terms accurate and give a quick relatable analogy:\n\n"${trimmed.slice(0, 1200)}"`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      const response = await fetchGeminiApi(apiKey, 'gemini-3.6-flash', body);
      if (response && response.ok) {
        const json = await response.json();
        const outputText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          explanationCache.set(cacheKey, outputText);
          return outputText;
        }
      }
    }
  } catch (err: any) {
    console.error('[BhaiLangService] Fallback failed:', err);
  }

  // Pure rule-based intuitive explanation fallback
  return `Bhai simple bolu toh: "${trimmed.slice(0, 150)}..." refers to a core concept in ${subjectName || 'this subject'}. Make sure you remember the key definitions and formulas for the exam!`;
}
