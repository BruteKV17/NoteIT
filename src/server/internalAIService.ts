import crypto from 'crypto';

export interface TimestampChunk {
  id: string;
  title: string;
  content: string;
  startTime: number;
  endTime: number;
  topics: string[];
}

export interface StructuredLectureAnalysis {
  analysisVersion: number;
  model: string;
  createdAt: string;
  updatedAt: string;
  transcriptHash: string;
  lectureId?: string;
  subject?: string;
  cleanSummary?: string;
  sections: Array<{
    title: string;
    startTime?: number;
    endTime?: number;
    topics: string[];
  }>;
  concepts: Array<{
    name: string;
    description: string;
  }>;
  definitions: Array<{
    term: string;
    definition: string;
  }>;
  formulas: Array<{
    formula: string;
    description: string;
  }>;
  examples: Array<{
    topic: string;
    description: string;
  }>;
  questions: Array<{
    question: string;
    context?: string;
  }>;
  keywords: string[];
  importantSegments: Array<{
    title: string;
    text: string;
  }>;
  transcriptChunks: TimestampChunk[];
  metrics?: {
    openRouterInputTokens?: number;
    openRouterOutputTokens?: number;
    processingDurationMs?: number;
    estimatedTokenSavings?: number;
  };
}

// In-memory request lock to prevent duplicate concurrent OpenRouter calls for the same lecture
const activeProcessingLocks = new Map<string, Promise<StructuredLectureAnalysis | null>>();

/**
 * Calculates a SHA-256 hash of transcript text to detect content changes.
 */
export function computeTranscriptHash(transcriptText: string): string {
  return crypto.createHash('sha256').update(transcriptText.trim()).digest('hex');
}

/**
 * Extracts a valid JSON object string from AI response text.
 */
function extractJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

/**
 * Calls OpenRouter to generate a lightweight, batched structured lecture analysis.
 */
async function callOpenRouterForAnalysis(
  transcriptText: string,
  modelName: string,
  apiKey: string
): Promise<{ rawJson: any; inputTokens?: number; outputTokens?: number }> {
  const prompt = `You are an elite academic AI preprocessor. Your task is to clean, structure, and extract detailed context from the following raw lecture transcript without losing any important information.

CRITICAL INSTRUCTIONS - DO NOT DESTROY INFORMATION:
- Preserve all important definitions, formulas, equations, concrete examples, terminology, questions asked, code snippets, numerical values, and lecturer explanations.
- Do NOT aggressively summarize or remove core details. If uncertain about a fact or definition, retain it.
- Structure the content into logical sections, concepts, definitions, formulas, examples, questions, keywords, important segments, and timestamp-aware chunks.

Return a JSON object matching this schema strictly:
{
  "cleanSummary": "Concise high-level academic summary of the lecture",
  "sections": [
    {
      "title": "Section Title",
      "startTime": 0,
      "endTime": 300,
      "topics": ["topic 1", "topic 2"]
    }
  ],
  "concepts": [
    {
      "name": "Concept Name",
      "description": "Detailed clear explanation of concept"
    }
  ],
  "definitions": [
    {
      "term": "Term Name",
      "definition": "Exact definition"
    }
  ],
  "formulas": [
    {
      "formula": "Equation or Formula (write with unicode superscripts like x², not carets)",
      "description": "Explanation of formula variables and application"
    }
  ],
  "examples": [
    {
      "topic": "Related Topic",
      "description": "Concrete real-world or mathematical example detail"
    }
  ],
  "questions": [
    {
      "question": "Question asked in lecture or likely exam question",
      "context": "Context or topic"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "importantSegments": [
    {
      "title": "Segment Topic",
      "text": "Crucial text snippet, quote, or key statement"
    }
  ],
  "transcriptChunks": [
    {
      "id": "chunk_1",
      "title": "Subtopic Title",
      "content": "Text content for retrieval",
      "startTime": 0,
      "endTime": 300,
      "topics": ["topic1"]
    }
  ]
}

Raw Transcript:
${transcriptText}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://noteit.ai',
      'X-Title': 'NoteIT Internal AI'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenRouter API call failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content || '';
  const cleaned = extractJsonObject(textContent);
  const parsed = JSON.parse(cleaned);

  return {
    rawJson: parsed,
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens
  };
}

/**
 * Validates and normalizes the parsed OpenRouter response object into a StructuredLectureAnalysis.
 */
function normalizeAnalysisResponse(
  parsed: any,
  transcriptHash: string,
  modelName: string,
  durationMs: number,
  inputTokens?: number,
  outputTokens?: number
): StructuredLectureAnalysis {
  const sections = Array.isArray(parsed.sections) ? parsed.sections.map((s: any) => ({
    title: String(s.title || 'Untitled Section'),
    startTime: typeof s.startTime === 'number' ? s.startTime : 0,
    endTime: typeof s.endTime === 'number' ? s.endTime : 0,
    topics: Array.isArray(s.topics) ? s.topics.map(String) : []
  })) : [];

  const concepts = Array.isArray(parsed.concepts) ? parsed.concepts.map((c: any) => ({
    name: String(c.name || 'Core Concept'),
    description: String(c.description || '')
  })) : [];

  const definitions = Array.isArray(parsed.definitions) ? parsed.definitions.map((d: any) => ({
    term: String(d.term || ''),
    definition: String(d.definition || '')
  })) : [];

  const formulas = Array.isArray(parsed.formulas) ? parsed.formulas.map((f: any) => ({
    formula: String(f.formula || ''),
    description: String(f.description || '')
  })) : [];

  const examples = Array.isArray(parsed.examples) ? parsed.examples.map((e: any) => ({
    topic: String(e.topic || 'General'),
    description: String(e.description || '')
  })) : [];

  const questions = Array.isArray(parsed.questions) ? parsed.questions.map((q: any) => ({
    question: String(q.question || ''),
    context: String(q.context || '')
  })) : [];

  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [];

  const importantSegments = Array.isArray(parsed.importantSegments) ? parsed.importantSegments.map((s: any) => ({
    title: String(s.title || 'Key Segment'),
    text: String(s.text || '')
  })) : [];

  const transcriptChunks: TimestampChunk[] = Array.isArray(parsed.transcriptChunks) ? parsed.transcriptChunks.map((c: any, idx: number) => ({
    id: String(c.id || `chunk_${idx + 1}`),
    title: String(c.title || `Chunk ${idx + 1}`),
    content: String(c.content || ''),
    startTime: typeof c.startTime === 'number' ? c.startTime : 0,
    endTime: typeof c.endTime === 'number' ? c.endTime : 0,
    topics: Array.isArray(c.topics) ? c.topics.map(String) : []
  })) : [];

  const now = new Date().toISOString();

  // Estimate token savings: Sending structured analysis instead of entire transcript repeatedly saves ~40-60% input tokens per downstream request
  const estimatedTokenSavings = Math.max(0, Math.round((inputTokens || 3000) * 0.45));

  return {
    analysisVersion: 1,
    model: modelName,
    createdAt: now,
    updatedAt: now,
    transcriptHash,
    cleanSummary: String(parsed.cleanSummary || ''),
    sections,
    concepts,
    definitions,
    formulas,
    examples,
    questions,
    keywords,
    importantSegments,
    transcriptChunks,
    metrics: {
      openRouterInputTokens: inputTokens,
      openRouterOutputTokens: outputTokens,
      processingDurationMs: durationMs,
      estimatedTokenSavings
    }
  };
}

export class InternalAIService {
  /**
   * Main entry point to get existing cached analysis or execute OpenRouter preprocessing.
   * If OpenRouter is unconfigured or fails, returns null safely to allow seamless fallback to raw transcript.
   */
  static async getOrAnalyzeLectureTranscript(
    uid: string,
    lectureId: string,
    transcriptText: string,
    adminDb?: any
  ): Promise<StructuredLectureAnalysis | null> {
    if (!transcriptText || transcriptText.trim().length === 0) {
      return null;
    }

    const transcriptHash = computeTranscriptHash(transcriptText);
    const lockKey = `${uid}_${lectureId}`;

    // 1. Check if analysis is already in progress for this lecture (Request Deduplication)
    if (activeProcessingLocks.has(lockKey)) {
      console.log(`[InternalAI] Active preprocessing in progress for lecture ${lectureId}, joining lock...`);
      return activeProcessingLocks.get(lockKey)!;
    }

    // 2. Check Firestore cache if adminDb is available
    if (adminDb) {
      try {
        const lectureRef = adminDb.collection('users').doc(uid).collection('lectures').doc(lectureId);
        const docSnap = await lectureRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data?.aiAnalysis && data.aiAnalysis.transcriptHash === transcriptHash && data.aiAnalysis.analysisVersion === 1) {
            console.log(`[InternalAI] Reusing cached OpenRouter analysis from Firestore for lecture ${lectureId}`);
            return data.aiAnalysis as StructuredLectureAnalysis;
          } else if (data?.aiAnalysis) {
            console.log(`[InternalAI] Stale analysis detected (hash mismatch or version change), re-analyzing...`);
          }
        }
      } catch (cacheErr) {
        console.warn(`[InternalAI] Firestore cache lookup error:`, cacheErr);
      }
    }

    // 3. Verify OpenRouter API key configuration
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      console.warn(`[InternalAI] OPENROUTER_API_KEY not configured. Falling back to original transcript pipeline.`);
      return null;
    }

    const modelName = process.env.OPENROUTER_MODEL || 'google/gemini-3.6-flash';

    // 4. Create in-flight processing promise
    const processingPromise = (async (): Promise<StructuredLectureAnalysis | null> => {
      const startTime = Date.now();
      try {
        console.log(`[InternalAI] Starting OpenRouter lecture preprocessing for ${lectureId} (Model: ${modelName})...`);
        const { rawJson, inputTokens, outputTokens } = await callOpenRouterForAnalysis(transcriptText, modelName, apiKey);
        const durationMs = Date.now() - startTime;

        const analysis = normalizeAnalysisResponse(
          rawJson,
          transcriptHash,
          modelName,
          durationMs,
          inputTokens,
          outputTokens
        );
        analysis.lectureId = lectureId;

        console.log(`[InternalAI] OpenRouter preprocessing completed in ${durationMs}ms. Sections: ${analysis.sections.length}, Concepts: ${analysis.concepts.length}, Definitions: ${analysis.definitions.length}`);

        // Cache in Firestore if adminDb is provided
        if (adminDb) {
          try {
            const lectureRef = adminDb.collection('users').doc(uid).collection('lectures').doc(lectureId);
            await lectureRef.set({
              aiAnalysis: analysis,
              updatedAt: new Date()
            }, { merge: true });
            console.log(`[InternalAI] Cached structured analysis to Firestore for lecture ${lectureId}`);
          } catch (saveErr) {
            console.warn(`[InternalAI] Failed to save aiAnalysis to Firestore:`, saveErr);
          }
        }

        return analysis;
      } catch (err: any) {
        console.warn(`[InternalAI] OpenRouter preprocessing failed or skipped: ${err?.message || err}. Falling back cleanly to original transcript.`);
        return null;
      } finally {
        activeProcessingLocks.delete(lockKey);
      }
    })();

    activeProcessingLocks.set(lockKey, processingPromise);
    return processingPromise;
  }
}

/**
 * Builds a selective, optimized context prompt string for Gemini based on resource type.
 * Ensures Gemini receives only relevant structured context instead of full raw transcript + full analysis.
 */
export function buildOptimizedContextForResource(
  analysis: StructuredLectureAnalysis,
  resourceType?: string
): string {
  let context = `LECTURE OVERVIEW: ${analysis.cleanSummary || ''}\n\n`;

  if (!resourceType || resourceType === 'all' || resourceType === 'notes' || resourceType === 'academic') {
    context += `SECTIONS:\n${analysis.sections.map(s => `- ${s.title}: ${s.topics.join(', ')}`).join('\n')}\n\n`;
    context += `KEY CONCEPTS:\n${analysis.concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\n`;
    context += `DEFINITIONS:\n${analysis.definitions.map(d => `- ${d.term}: ${d.definition}`).join('\n')}\n\n`;
    if (analysis.formulas.length) {
      context += `FORMULAS & EQUATIONS:\n${analysis.formulas.map(f => `- ${f.formula}: ${f.description}`).join('\n')}\n\n`;
    }
    if (analysis.examples.length) {
      context += `EXAMPLES:\n${analysis.examples.map(e => `- [${e.topic}] ${e.description}`).join('\n')}\n\n`;
    }
    if (analysis.importantSegments.length) {
      context += `IMPORTANT SEGMENTS:\n${analysis.importantSegments.map(s => `- ${s.title}: ${s.text}`).join('\n')}\n\n`;
    }
  } else if (resourceType === 'flashcards') {
    context += `KEY CONCEPTS:\n${analysis.concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\n`;
    context += `DEFINITIONS:\n${analysis.definitions.map(d => `- ${d.term}: ${d.definition}`).join('\n')}\n\n`;
    if (analysis.keywords.length) {
      context += `KEY TERMINOLOGY:\n${analysis.keywords.join(', ')}\n\n`;
    }
    if (analysis.transcriptChunks.length) {
      context += `TOP CHUNKS:\n${analysis.transcriptChunks.slice(0, 5).map(c => `[${c.title} (${c.startTime}s-${c.endTime}s)]: ${c.content}`).join('\n')}\n\n`;
    }
  } else if (resourceType === 'quiz') {
    context += `CONCEPTS:\n${analysis.concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\n`;
    context += `DEFINITIONS:\n${analysis.definitions.map(d => `- ${d.term}: ${d.definition}`).join('\n')}\n\n`;
    if (analysis.questions.length) {
      context += `LECTURE QUESTIONS:\n${analysis.questions.map(q => `- Question: ${q.question} (Context: ${q.context || 'General'})`).join('\n')}\n\n`;
    }
    if (analysis.importantSegments.length) {
      context += `IMPORTANT SEGMENTS:\n${analysis.importantSegments.map(s => `- ${s.title}: ${s.text}`).join('\n')}\n\n`;
    }
    if (analysis.examples.length) {
      context += `APPLICATION EXAMPLES:\n${analysis.examples.map(e => `- ${e.topic}: ${e.description}`).join('\n')}\n\n`;
    }
  } else if (resourceType === 'slides') {
    context += `SECTIONS STRUCTURE:\n${analysis.sections.map(s => `- Section: ${s.title} (Topics: ${s.topics.join(', ')})`).join('\n')}\n\n`;
    context += `KEY CONCEPTS:\n${analysis.concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\n`;
    if (analysis.examples.length) {
      context += `EXAMPLES:\n${analysis.examples.map(e => `- ${e.topic}: ${e.description}`).join('\n')}\n\n`;
    }
  } else if (resourceType === 'mindmap') {
    context += `SECTIONS:\n${analysis.sections.map(s => `- Section: ${s.title}`).join('\n')}\n\n`;
    context += `CONCEPTS:\n${analysis.concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\n`;
    context += `DEFINITIONS:\n${analysis.definitions.map(d => `- ${d.term}: ${d.definition}`).join('\n')}\n\n`;
    if (analysis.formulas.length) {
      context += `FORMULAS:\n${analysis.formulas.map(f => `- ${f.formula}`).join('\n')}\n\n`;
    }
  }

  return context.trim();
}

