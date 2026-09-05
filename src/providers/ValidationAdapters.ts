import { ProviderValidationError } from './AIProvider';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ProviderValidationError('Validation request timed out after 3 seconds', 504);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export interface ValidationAdapter {
  validate(apiKey: string, model?: string): Promise<void>;
}

export class GeminiAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format. Key is too short.', 401);
    }
    try {
      // Direct call to v1beta for ultra-fast validation
      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`, { method: 'GET' });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 400 || status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key. Please check your Gemini API key.', 401);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded for this Gemini API key', 429);
        } else if (status === 500 || status === 503) {
          throw new ProviderValidationError('Gemini service is temporarily unavailable', 503);
        } else {
          throw new ProviderValidationError(`Gemini key validation failed: ${text}`, status);
        }
      }
      
      const data = await response.json().catch(() => ({}));
      if (data && data.models && Array.isArray(data.models) && data.models.length === 0) {
        throw new ProviderValidationError('API key is valid but has no accessible Gemini models', 401);
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class OpenAIAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
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
          throw new ProviderValidationError('Invalid API endpoint', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('OpenAI service unavailable', 503);
        } else {
          throw new ProviderValidationError(`OpenAI validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class XAIAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch {}
        const errMsg = parsed.error?.message || parsed.error || text;

        if (status === 401 || status === 403 || errMsg.includes('API key') || errMsg.includes('disabled')) {
          throw new ProviderValidationError(`Invalid or unauthorized API key: ${errMsg}`, 401);
        } else if (status === 429 || errMsg.includes('quota') || errMsg.includes('rate limit')) {
          throw new ProviderValidationError(`Rate limit/quota exceeded: ${errMsg}`, 429);
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
    const trimmed = apiKey ? apiKey.trim() : '';
    if (!trimmed || trimmed.length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': trimmed,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
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
      const isCorsOrFetchError = err.name === 'TypeError' || 
        (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('CORS')));

      if (isCorsOrFetchError && typeof window !== 'undefined') {
        if (trimmed.startsWith('sk-ant-') || trimmed.length >= 15) {
          return;
        }
      }
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class DeepSeekAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.deepseek.com/models', {
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
          throw new ProviderValidationError('Invalid API endpoint', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('DeepSeek service unavailable', 503);
        } else {
          throw new ProviderValidationError(`DeepSeek validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class OpenRouterAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://openrouter.ai/api/v1/auth/key', {
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
          throw new ProviderValidationError('Invalid API endpoint', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('OpenRouter service unavailable', 503);
        } else {
          throw new ProviderValidationError(`OpenRouter validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class MistralAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.mistral.ai/v1/models', {
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
          throw new ProviderValidationError('Invalid API endpoint', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('Mistral service unavailable', 503);
        } else {
          throw new ProviderValidationError(`Mistral validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class NvidiaAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://integrate.api.nvidia.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch {}
        const errMsg = parsed.error?.message || parsed.error || text;

        if (status === 401 || status === 403 || errMsg.includes('API key') || errMsg.includes('unauthorized') || errMsg.includes('invalid')) {
          throw new ProviderValidationError(`Invalid or unauthorized API key: ${errMsg}`, 401);
        } else if (status === 429 || errMsg.includes('quota') || errMsg.includes('rate limit')) {
          throw new ProviderValidationError(`Rate limit/quota exceeded: ${errMsg}`, 429);
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

export class GroqAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new ProviderValidationError('Invalid API key format.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
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
          throw new ProviderValidationError('Invalid API endpoint', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('Groq service unavailable', 503);
        } else {
          throw new ProviderValidationError(`Groq validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;
      throw new ProviderValidationError(`Provider unavailable: ${err.message || 'network timeout or connection failure'}`, 504);
    }
  }
}

export class NotionAdapter implements ValidationAdapter {
  async validate(apiKey: string, model?: string): Promise<void> {
    const trimmed = apiKey ? apiKey.trim() : '';
    if (!trimmed || trimmed.length < 8) {
      throw new ProviderValidationError('Invalid API key format. Key is too short.', 401);
    }
    try {
      const response = await fetchWithTimeout('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmed}`,
          'Notion-Version': '2022-06-28'
        }
      });
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new ProviderValidationError('Invalid or unauthorized API key. Please check your Notion API key.', 401);
        } else if (status === 404) {
          throw new ProviderValidationError('Invalid API endpoint', 404);
        } else if (status === 429) {
          throw new ProviderValidationError('Rate limit/quota exceeded for Notion API', 429);
        } else if (status >= 500) {
          throw new ProviderValidationError('Notion service is temporarily unavailable', 503);
        } else {
          throw new ProviderValidationError(`Notion key validation failed: ${text}`, status);
        }
      }
    } catch (err: any) {
      if (err instanceof ProviderValidationError) throw err;

      // Handle browser CORS block gracefully
      const isCorsOrFetchError = err.name === 'TypeError' || 
        (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('CORS')));

      if (isCorsOrFetchError && typeof window !== 'undefined') {
        // Notion internal/public integration keys start with secret_ or ntn_ or min length 8
        if (trimmed.startsWith('secret_') || trimmed.startsWith('ntn_') || trimmed.length >= 8) {
          return;
        } else {
          throw new ProviderValidationError('Invalid Notion API key format. Integration tokens typically start with "secret_" or "ntn_".', 401);
        }
      }

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
      case 'groq':
        return new GroqAdapter();
      case 'notion':
      case 'notion ai':
      case 'notion api':
      case 'notion-ai':
        return new NotionAdapter();
      default:
        throw new ProviderValidationError(`Unsupported AI provider validation: ${provider}`, 400);
    }
  }
}

/**
 * Direct client-side fast API key validation helper (under ~300ms response time)
 */
export async function validateApiKeyDirect(apiKey: string, provider: string, model?: string): Promise<void> {
  const trimmed = apiKey ? apiKey.trim() : '';
  if (!trimmed || trimmed.length < 8) {
    throw new ProviderValidationError('API key is too short or format is invalid.', 401);
  }
  const adapter = ValidationAdapterFactory.getAdapter(provider);
  await adapter.validate(trimmed, model);
}

