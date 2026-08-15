import { BaseProvider } from './AIProvider';
import { GeminiAdapter } from './ValidationAdapters';

function sanitizeGeminiModel(model?: string): string {
  return 'gemini-3.6-flash';
}

export async function fetchGeminiApi(apiKey: string, requestedModel: string, bodyObj: any): Promise<Response> {
  const model = 'gemini-3.6-flash';
  for (const ver of ['v1beta', 'v1']) {
    const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj)
      });

      if (response.ok) {
        return response;
      }

      const errText = await response.text();
      if (response.status !== 404) {
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
      }
    } catch (err: any) {
      if (err.message && err.message.startsWith('Gemini API error:')) {
        throw err;
      }
    }
  }

  const finalUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(finalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }
  return response;
}

export class GeminiProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'gemini-3.6-flash');
  }

  getAvailableModels(): string[] {
    return ['gemini-3.6-flash'];
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
