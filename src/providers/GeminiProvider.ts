import { BaseProvider } from './AIProvider';

export class GeminiProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'gemini-2.5-flash');
  }

  getAvailableModels(): string[] {
    return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  }

  async validateKey(): Promise<boolean> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const activeModel = model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(text);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    const activeModel = model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64Audio } },
            { text: 'You are an expert transcriber. Transcribe the provided audio lecture word-for-word. Format the transcript text by prepending bracketed timestamps (e.g. [00:00], [01:15]) at the beginning of each major statement or logical paragraph based on the audio timeline.' }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
