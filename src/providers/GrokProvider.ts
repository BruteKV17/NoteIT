import { BaseProvider, extractJsonObject } from './AIProvider';
import { XAIAdapter } from './ValidationAdapters';

export class GrokProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'grok-2');
  }

  getAvailableModels(): string[] {
    return ['grok-2', 'grok-2-latest', 'grok-beta'];
  }

  async validateKey(): Promise<boolean> {
    try {
      const adapter = new XAIAdapter();
      await adapter.validate(this.apiKey, this.defaultModel);
      return true;
    } catch (err) {
      console.error('[GrokProvider] Key validation failed:', err);
      return false;
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const activeModel = model || this.defaultModel;
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
      throw new Error(`Grok API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
      throw new Error(`Grok API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const cleaned = extractJsonObject(text);
    return JSON.parse(cleaned);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    throw new Error('Grok does not support audio transcription natively. Please switch your AI Provider to Google Gemini, Groq, or OpenAI to transcribe audio.');
  }
}
