import { BaseProvider, extractJsonObject } from './AIProvider';

export class ClaudeProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'claude-3-5-sonnet-latest');
  }

  getAvailableModels(): string[] {
    return ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-20240229'];
  }

  async validateKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: activeModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const systemPrompt = `You are a helpful assistant. You must return responses STRICTLY in JSON format matching the schema: ${JSON.stringify(schema)}`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: activeModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const cleaned = extractJsonObject(text);
    return JSON.parse(cleaned);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    throw new Error('Claude does not support audio transcription natively. Please switch your AI Provider to Google Gemini, Groq, or OpenAI to transcribe audio.');
  }
}
