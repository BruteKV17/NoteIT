import { ProviderValidationError } from './AIProvider';

export interface ValidationAdapter {
  validate(apiKey: string, model?: string): Promise<void>;
}

export class GeminiAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET'
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 400 || status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key', 401);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status === 500 || status === 503) {
          throw new ProviderValidationError('Gemini service unavailable', 503);
        } else {
          throw new ProviderValidationError(`Gemini key validation failed: ${text}`, status);
        }
      }
      
      if (model) {
        const data = await response.json();
        const modelsList = data.models || [];
        const normalizedModel = model.toLowerCase().replace('models/', '');
        const exists = modelsList.some((m: any) => m.name?.toLowerCase().replace('models/', '') === normalizedModel);
        if (!exists) {
          throw new ProviderValidationError(`Selected model '${model}' is not available or valid for your Gemini key`, 404);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError('Provider unavailable due to network timeout or connection failure', 504);
    }
  }
}

export class OpenAIAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key', 401);
        } else if (status === 404) {
          throw new ProviderValidationError('Invalid API endpoint or model', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('OpenAI service unavailable', 503);
        } else {
          throw new ProviderValidationError(`OpenAI validation failed: ${text}`, status);
        }
      }
      if (model) {
        const data = await response.json();
        const modelsList = data.data || [];
        const exists = modelsList.some((m: any) => m.id?.toLowerCase() === model.toLowerCase());
        if (!exists) {
          throw new ProviderValidationError(`Selected model '${model}' is not valid or available for your OpenAI key`, 404);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError('Provider unavailable due to network timeout or connection failure', 504);
    }
  }
}

export class XAIAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    const selectedModel = model || 'grok-2';
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1
        })
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        let parsed: any = {};
        try {
          parsed = JSON.parse(text);
        } catch {}

        const errMsg = parsed.error?.message || parsed.error || text;

        if (status === 401 || status === 403 || errMsg.includes('API key') || errMsg.includes('disabled')) {
          throw new ProviderValidationError(`Invalid or unauthorized API key: ${errMsg}`, 401);
        } else if (status === 404 || errMsg.includes('Model not found') || errMsg.includes('model_not_found') || errMsg.includes('invalid-argument')) {
          throw new ProviderValidationError(`The selected xAI model is currently unavailable. Please select another supported model.`, 404);
        } else if (status === 429 || errMsg.includes('quota') || errMsg.includes('rate limit')) {
          throw new ProviderValidationError(`Rate limit/quota exceeded: ${errMsg}`, 429);
        } else if (status === 400) {
          throw new ProviderValidationError(`Bad request/configuration error: ${errMsg}`, 400);
        } else if (status >= 500) {
          throw new ProviderValidationError(`xAI service unavailable: ${errMsg}`, 503);
        } else {
          throw new ProviderValidationError(`xAI validation failed: ${errMsg}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class ClaudeAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-latest',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key', 401);
        } else if (status === 404) {
          throw new ProviderValidationError('Invalid API endpoint or model', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('Anthropic Claude service unavailable', 503);
        } else {
          throw new ProviderValidationError(`Claude validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError('Provider unavailable due to network timeout or connection failure', 504);
    }
  }
}

export class DeepSeekAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    try {
      const response = await fetch('https://api.deepseek.com/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key', 401);
        } else if (status === 404) {
          throw new ProviderValidationError('Invalid API endpoint or model', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('DeepSeek service unavailable', 503);
        } else {
          throw new ProviderValidationError(`DeepSeek validation failed: ${text}`, status);
        }
      }
      if (model) {
        const data = await response.json();
        const modelsList = data.data || [];
        const exists = modelsList.some((m: any) => m.id?.toLowerCase() === model.toLowerCase());
        if (!exists) {
          throw new ProviderValidationError(`Selected model '${model}' is not valid or available for your DeepSeek key`, 404);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError('Provider unavailable due to network timeout or connection failure', 504);
    }
  }
}

export class OpenRouterAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key', 401);
        } else if (status === 404) {
          throw new ProviderValidationError('Invalid API endpoint or model', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('OpenRouter service unavailable', 503);
        } else {
          throw new ProviderValidationError(`OpenRouter validation failed: ${text}`, status);
        }
      }
      if (model) {
        const data = await response.json();
        const modelsList = data.data || [];
        const exists = modelsList.some((m: any) => m.id?.toLowerCase() === model.toLowerCase());
        if (!exists) {
          throw new ProviderValidationError(`Selected model '${model}' is not valid or available on OpenRouter`, 404);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError('Provider unavailable due to network timeout or connection failure', 504);
    }
  }
}

export class MistralAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key', 401);
        } else if (status === 404) {
          throw new ProviderValidationError('Invalid API endpoint or model', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('Mistral service unavailable', 503);
        } else {
          throw new ProviderValidationError(`Mistral validation failed: ${text}`, status);
        }
      }
      if (model) {
        const data = await response.json();
        const modelsList = data.data || [];
        const exists = modelsList.some((m: any) => m.id?.toLowerCase() === model.toLowerCase());
        if (!exists) {
          throw new ProviderValidationError(`Selected model '${model}' is not valid or available for your Mistral key`, 404);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError('Provider unavailable due to network timeout or connection failure', 504);
    }
  }
}

export class NvidiaAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    const selectedModel = model || 'z-ai/glm-5.2';
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1
        })
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        let parsed: any = {};
        try {
          parsed = JSON.parse(text);
        } catch {}

        const errMsg = parsed.error?.message || parsed.error || text;

        if (status === 401 || status === 403 || errMsg.includes('API key') || errMsg.includes('unauthorized') || errMsg.includes('invalid')) {
          throw new ProviderValidationError(`Invalid or unauthorized API key: ${errMsg}`, 401);
        } else if (status === 404 || errMsg.includes('Model not found') || errMsg.includes('model_not_found') || errMsg.includes('invalid-argument')) {
          throw new ProviderValidationError(`The selected GLM model is currently unavailable. Please select another supported model.`, 404);
        } else if (status === 429 || errMsg.includes('quota') || errMsg.includes('rate limit')) {
          throw new ProviderValidationError(`Rate limit/quota exceeded: ${errMsg}`, 429);
        } else if (status === 400) {
          throw new ProviderValidationError(`Bad request/configuration error: ${errMsg}`, 400);
        } else if (status >= 500) {
          throw new ProviderValidationError(`NVIDIA GLM service unavailable: ${errMsg}`, 503);
        } else {
          throw new ProviderValidationError(`NVIDIA GLM validation failed: ${errMsg}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class ValidationAdapterFactory {
  static getAdapter(provider: string): ValidationAdapter {
    switch (provider.toLowerCase()) {
      case 'gemini':
      case 'google gemini':
        return new GeminiAdapter();
      case 'openai':
        return new OpenAIAdapter();
      case 'grok':
      case 'xai':
      case 'xai grok':
      case 'xai/grok':
        return new XAIAdapter();
      case 'claude':
      case 'anthropic':
      case 'anthropic claude':
        return new ClaudeAdapter();
      case 'deepseek':
        return new DeepSeekAdapter();
      case 'openrouter':
        return new OpenRouterAdapter();
      case 'mistral':
        return new MistralAdapter();
      case 'nvidia':
      case 'glm':
      case 'nvidia nim':
        return new NvidiaAdapter();
      default:
        throw new ProviderValidationError(`Unsupported AI provider validation: ${provider}`, 400);
    }
  }
}
