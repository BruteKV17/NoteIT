import { BaseProvider, extractJsonObject } from './AIProvider';

export class OpenRouterProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'google/gemini-2.5-flash');
  }

  getAvailableModels(): string[] {
    return [
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o-mini'
    ];
  }

  async validateKey(): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://noteit.ai',
        'X-Title': 'NoteIT AI'
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://noteit.ai',
        'X-Title': 'NoteIT AI'
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'user', content: `${prompt}\n\nYou MUST return the response strictly matching this JSON schema: ${JSON.stringify(schema)}` }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const cleaned = extractJsonObject(text);
    return JSON.parse(cleaned);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    throw new Error('OpenRouter does not support audio transcription natively. Please switch your AI Provider to Google Gemini, Groq, or OpenAI to transcribe audio.');
  }
}
