import { AIProvider } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { MistralProvider } from './MistralProvider';
import { GrokProvider } from './GrokProvider';

export class ProviderFactory {
  static getProvider(provider: string, apiKey: string): AIProvider {
    switch (provider.toLowerCase()) {
      case 'gemini':
      case 'google gemini':
        return new GeminiProvider(apiKey);
      case 'groq':
        return new GroqProvider(apiKey);
      case 'openai':
        return new OpenAIProvider(apiKey);
      case 'claude':
      case 'anthropic claude':
        return new ClaudeProvider(apiKey);
      case 'deepseek':
        return new DeepSeekProvider(apiKey);
      case 'grok':
      case 'xai':
      case 'xai grok':
      case 'xai/grok':
        return new GrokProvider(apiKey);
      case 'openrouter':
        return new OpenRouterProvider(apiKey);
      case 'mistral':
        return new MistralProvider(apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static getAvailableModels(provider: string): string[] {
    try {
      const dummyProvider = this.getProvider(provider, 'dummy_key');
      return dummyProvider.getAvailableModels();
    } catch {
      return [];
    }
  }
}
