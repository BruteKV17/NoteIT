import { BaseProvider } from './AIProvider';
import { GeminiAdapter } from './ValidationAdapters';

function sanitizeGeminiModel(model?: string): string {
  const validModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp'];
  if (model && validModels.includes(model)) return model;
  if (!model || model.startsWith('gemini-') || model.startsWith('google/gemini-')) return 'gemini-1.5-flash';
  return model;
}

export async function fetchGeminiApi(apiKey: string, requestedModel: string, bodyObj: any): Promise<Response> {
  const versions = ['v1', 'v1beta'];
  const candidates = Array.from(new Set([
    requestedModel,
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp'
  ]));

  let lastStatus = 404;
  let lastErrText = '';

  for (const ver of versions) {
    for (const m of candidates) {
      const url = `https://generativelanguage.googleapis.com/${ver}/models/${m}:generateContent?key=${apiKey}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });

        if (response.ok) {
          return response;
        }

        lastStatus = response.status;
        lastErrText = await response.text();

        // If failure is auth (401/403) or rate limit (429), stop looping and throw immediately
        if (response.status !== 404) {
          throw new Error(`Gemini API error: ${response.status} - ${lastErrText}`);
        }
      } catch (err: any) {
        if (err.message && err.message.startsWith('Gemini API error:')) {
          throw err;
        }
      }
    }
  }

  throw new Error(`Gemini API error: ${lastStatus} - ${lastErrText || 'No accessible Gemini models found on v1 or v1beta endpoints.'}`);
}

export class GeminiProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'gemini-1.5-flash');
  }

  getAvailableModels(): string[] {
    return ['gemini-1.5-flash', 'gemini-1.5-pro'];
  }

  async validateKey(): Promise<boolean> {
    try {
      const adapter = new GeminiAdapter();
      await adapter.validate(this.apiKey, this.defaultModel);
      return true;
    } catch (err) {
      console.error('[GeminiProvider] Key validation failed:', err);
      return false;
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const activeModel = sanitizeGeminiModel(model || this.defaultModel);
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    const response = await fetchGeminiApi(this.apiKey, activeModel, body);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = sanitizeGeminiModel(model || this.defaultModel);
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    };
    const response = await fetchGeminiApi(this.apiKey, activeModel, body);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(text);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    const activeModel = sanitizeGeminiModel(model || this.defaultModel);
    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: 'You are an expert transcriber. Transcribe the provided audio lecture word-for-word. Format the transcript text by prepending bracketed timestamps (e.g. [00:00], [01:15]) at the beginning of each major statement or logical paragraph based on the audio timeline.' }
        ]
      }]
    };
    const response = await fetchGeminiApi(this.apiKey, activeModel, body);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
