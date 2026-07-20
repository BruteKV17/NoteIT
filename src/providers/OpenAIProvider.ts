import { BaseProvider, extractJsonObject } from './AIProvider';

export class OpenAIProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'gpt-4o-mini');
  }

  getAvailableModels(): string[] {
    return ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'o3-mini', 'o1-mini'];
  }

  async validateKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
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
    formData.append('model', 'whisper-1');
    formData.append('prompt', 'Transcribe the audio word-for-word, including timestamps like [00:00] at the start of major statements.');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Whisper error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.text || '';
  }
}
