import { BaseProvider, extractJsonObject } from './AIProvider';

export class GroqProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'llama-3.3-70b-versatile');
  }

  getAvailableModels(): string[] {
    return ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  }

  async validateKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const activeModel = model || this.defaultModel;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'user', content: `${prompt}\n\nYou MUST return the response strictly matching this JSON schema: ${JSON.stringify(schema)}` }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const cleaned = extractJsonObject(text);
    return JSON.parse(cleaned);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const fileBlob = new Blob([bytes], { type: mimeType });

    const formData = new FormData();
    formData.append('file', fileBlob, `audio.${mimeType.split('/')[1] || 'webm'}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('prompt', 'Transcribe the audio word-for-word, including timestamps like [00:00] at the start of major statements.');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Whisper error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.text || '';
  }
}
