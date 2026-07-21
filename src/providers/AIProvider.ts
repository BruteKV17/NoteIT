export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export class ProviderValidationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ProviderValidationError';
    this.status = status;
  }
}

export interface AIProvider {
  validateKey(): Promise<boolean>;
  generateText(prompt: string, model?: string): Promise<string>;
  generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any>;
  generatePresentation(prompt: string, model?: string): Promise<any>;
  generateQuiz(prompt: string, model?: string): Promise<any>;
  transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string>;
  generateMindMap(prompt: string, model?: string): Promise<any>;
  generateFlashcards(prompt: string, model?: string): Promise<any>;
  generateNotes(prompt: string, model?: string): Promise<string>;
  getAvailableModels(): string[];
  estimateTokenUsage(prompt: string, responseText: string): TokenUsage;
}

export const extractJsonObject = (rawText: string): string => {
  let cleaned = rawText.trim();
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(jsonBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
};

export abstract class BaseProvider implements AIProvider {
  protected apiKey: string;
  protected defaultModel: string;

  constructor(apiKey: string, defaultModel: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  abstract validateKey(): Promise<boolean>;
  abstract generateText(prompt: string, model?: string): Promise<string>;
  abstract generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any>;
  abstract transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string>;
  abstract getAvailableModels(): string[];

  async generatePresentation(prompt: string, model?: string): Promise<any> {
    const schema = {
      type: 'OBJECT',
      properties: {
        slides: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              slideType: { type: 'STRING' },
              title: { type: 'STRING' },
              objective: { type: 'STRING' },
              keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
              layoutRecommendation: { type: 'STRING' },
              visualAssetPrompt: { type: 'STRING' },
              designNotes: { type: 'STRING' }
            },
            required: ['slideType', 'title', 'objective', 'keyPoints']
          }
        }
      },
      required: ['slides']
    };
    return this.generateStructuredOutput(prompt, schema, model);
  }

  async generateQuiz(prompt: string, model?: string): Promise<any> {
    const schema = {
      type: 'OBJECT',
      properties: {
        quiz: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: { type: 'ARRAY', items: { type: 'STRING' } },
              correctAnswer: { type: 'INTEGER' },
              explanation: { type: 'STRING' },
              sourceCitation: { type: 'STRING' },
              difficulty: { type: 'STRING' }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation', 'sourceCitation', 'difficulty']
          }
        }
      },
      required: ['quiz']
    };
    return this.generateStructuredOutput(prompt, schema, model);
  }

  async generateMindMap(prompt: string, model?: string): Promise<any> {
    const schema = {
      type: 'OBJECT',
      properties: {
        keyConcepts: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              label: { type: 'STRING' },
              desc: { type: 'STRING' },
              parent: { type: 'STRING' },
              x: { type: 'INTEGER' },
              y: { type: 'INTEGER' },
              group: { type: 'STRING' },
              examples: { type: 'STRING' },
              formula: { type: 'STRING' },
              applications: { type: 'STRING' },
              examImportance: { type: 'STRING' }
            },
            required: ['id', 'label', 'desc', 'x', 'y', 'group']
          }
        }
      },
      required: ['keyConcepts']
    };
    return this.generateStructuredOutput(prompt, schema, model);
  }

  async generateFlashcards(prompt: string, model?: string): Promise<any> {
    const schema = {
      type: 'OBJECT',
      properties: {
        flashcards: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              q: { type: 'STRING' },
              a: { type: 'STRING' },
              category: { type: 'STRING' }
            },
            required: ['q', 'a', 'category']
          }
        }
      },
      required: ['flashcards']
    };
    return this.generateStructuredOutput(prompt, schema, model);
  }

  async generateNotes(prompt: string, model?: string): Promise<string> {
    return this.generateText(prompt, model);
  }

  estimateTokenUsage(prompt: string, responseText: string): TokenUsage {
    const estimateTokens = (text: string): number => {
      if (!text) return 0;
      const charCount = text.length;
      const wordCount = text.split(/\s+/).length;
      return Math.max(Math.ceil(charCount / 4), Math.ceil(wordCount * 1.3));
    };
    const promptTokens = estimateTokens(prompt);
    const completionTokens = estimateTokens(responseText);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }
}
