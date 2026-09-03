/**
 * Gemini Academic Notes Generator Engine
 * Multimodal document ingestion engine powered by gemini-3.6-flash.
 * Natively parses binary PDFs, PPTs, Images, and Web links across ALL pages (Page 1 to 14+).
 * Strictly filters out administrative syllabus meta-noise (Faculty Intros, CO-PO mappings, office hours).
 */

import { fetchGeminiApi } from '../providers/GeminiProvider';

export interface AcademicConceptCard {
  title: string;
  bloomLevel: 'Understand' | 'Remember' | 'Apply' | 'Analyze';
  conceptExplanation: string;
  keyExamPoints: string[];
  commonPitfalls: string[];
  comparisonTable?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  diagramSpec?: {
    title: string;
    type: 'concentric' | 'layered' | 'pipeline' | 'tree' | 'state_machine';
    centerLabel?: string;
    layers?: { name: string; items: string[]; color?: string }[];
    nodes?: { label: string; subtext?: string; color?: string }[];
  };
}

export interface AcademicSubjectiveQuestion {
  marks: '2 Marks' | '5 Marks' | '10 Marks';
  question: string;
  blueprintAnswer: string;
}

export interface GeneratedAcademicNotes {
  subjectName: string;
  conceptCards: AcademicConceptCard[];
  subjectiveQuestions: AcademicSubjectiveQuestion[];
  memoryBlocks: { title: string; text: string }[];
  preExamCheatSheet: string[];
}

export interface AttachmentInputPayload {
  name: string;
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
}

/**
 * JS Pre-Sanitizer: Strips out syllabus meta-noise before passing text to Gemini
 */
export function sanitizeDocumentText(rawText: string): string {
  if (!rawText) return '';
  const lines = rawText.split('\n');
  const noiseRegex = /co-po|course outcome|program outcome|\bco[1-6]\b|\bpo[1-6]\b|table of content|\bindex\b|syllabus overview|faculty|instructor|office hour|email:|credit hour|prerequisite|evaluation scheme|attendance policy/i;
  
  const cleanLines = lines.filter(line => !noiseRegex.test(line.trim()));
  return cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * JS Post-Filter: Filters out any noise concept cards that bypassed LLM prompt rules
 */
export function filterNoiseConceptCards(cards: AcademicConceptCard[]): AcademicConceptCard[] {
  if (!cards || !Array.isArray(cards)) return [];
  const noiseRegex = /co-po|course outcome|program outcome|\bco[1-6]\b|\bpo[1-6]\b|table of content|\bindex\b|syllabus|faculty|office hour|prerequisites/i;
  return cards.filter(card => {
    if (noiseRegex.test(card.title || '')) return false;
    if (noiseRegex.test(card.conceptExplanation || '')) return false;
    return true;
  });
}

export async function generateAcademicNotesFromDocument(
  attachments: AttachmentInputPayload[],
  subjectName: string,
  teacherTopics: string[] = []
): Promise<GeneratedAcademicNotes | null> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  if (!apiKey || !attachments || attachments.length === 0) {
    return null;
  }

  const prompt = `You are an elite university professor and chief exam paper setter for ${subjectName}.
Analyze the provided multi-page study document across ALL pages (Page 1 to the final page).

CRITICAL MANDATORY INSTRUCTIONS:

1. ABSOLUTE ADMINISTRATIVE NOISE FILTER (MUST REMOVE 100%):
   Completely IGNORE, STRIP OUT, and DO NOT INCLUDE any syllabus administrative overhead:
   - NEVER create cards for "Course Outcomes", "CO-PO Mapping", "Program Outcomes", or "Bloom Taxonomy"
   - NEVER create cards for "Subject Name Header", "Table of Contents", "Index of Topics", "Course Code"
   - NEVER create cards for "Faculty Name", "Instructor Profile", "Office Hours", "Grading Criteria", "Prerequisites"
   - START GENERATING NOTES ONLY FROM REAL ACADEMIC CONCEPT SLIDES/PAGES!

2. DEEP & THOROUGH EXPLANATIONS (NO SHORT OR BRIEF SUMMARIES):
   - For every topic, write a DEEP, COMPREHENSIVE academic explanation (minimum 250-400 words per card).
   - Include complete technical definitions, mathematical or algorithmic steps, structural mechanisms, edge case handling, and real-world engineering applications.
   - Do NOT write brief 2-sentence summaries. Students need complete, detailed study notes!

3. MANDATORY ARCHITECTURE & SYSTEM DIAGRAM SPECS:
   - For every topic involving system architecture, operating system layers, interface components, or multi-tier structures (e.g. Operating System between Hardware and Applications), YOU MUST generate a \`diagramSpec\` with \`type: 'concentric'\` or \`type: 'layered'\`.
   - Provide concentric \`layers\` array: Inner Core (Hardware), Middle Layer (OS Kernel & System Software), Outer Layer (Application Software like Games, Browsers, Databases).

4. COMPLETE MULTI-PAGE COVERAGE:
   - Cover EVERY single chapter and unit present across all pages (from Page 1 to Page 14+).
   - Incorporate teacher focus topics if provided: ${teacherTopics.length > 0 ? teacherTopics.join(', ') : 'None'}.

5. FORMAT OUTPUT AS STRICT JSON matching this schema:
{
  "subjectName": "${subjectName}",
  "conceptCards": [
    {
      "title": "Core Technical Topic Name",
      "bloomLevel": "Understand",
      "conceptExplanation": "In-depth 300+ word academic explanation with complete definitions, mathematical rules, bold key terms, and step-by-step mechanisms.",
      "keyExamPoints": [
        "Essential scoring point 1 to write in 5-mark and 10-mark answers",
        "Essential scoring point 2",
        "Essential scoring point 3"
      ],
      "commonPitfalls": [
        "Common exam error or trap mistake students make on this topic"
      ],
      "comparisonTable": {
        "title": "Comparison Matrix Title",
        "headers": ["Category", "Approach A", "Approach B"],
        "rows": [
          ["Feature 1", "Detail A", "Detail B"]
        ]
      },
      "diagramSpec": {
        "title": "Operating System Architecture & User Interface Layers",
        "type": "concentric",
        "centerLabel": "Hardware (CPU, Memory, I/O)",
        "layers": [
          { "name": "Hardware Core", "color": "#F87171", "items": ["CPU", "RAM", "Hard Disk"] },
          { "name": "Operating System Kernel", "color": "#8F1D2C", "items": ["Utilities", "System Software", "OS Kernel"] },
          { "name": "Application & User Software", "color": "#FBBF24", "items": ["Internet Browsers", "Databases", "Computer Games"] }
        ]
      }
    }
  ],
  "subjectiveQuestions": [
    {
      "marks": "2 Marks",
      "question": "Clear 2-mark definition/short-answer question from document",
      "blueprintAnswer": "Exact scoring keywords for answer"
    },
    {
      "marks": "5 Marks",
      "question": "Analytical 5-mark question covering core mechanisms",
      "blueprintAnswer": "Step-by-step scoring answer blueprint"
    },
    {
      "marks": "10 Marks",
      "question": "Comprehensive 10-mark architectural/procedural question",
      "blueprintAnswer": "Detailed structural answer blueprint"
    }
  ],
  "memoryBlocks": [
    {"title": "Core Theorem / Formula", "text": "Must-remember rule for exam hall recall"}
  ],
  "preExamCheatSheet": [
    "Scannable 5-minute pre-exam trigger 1",
    "Scannable 5-minute pre-exam trigger 2"
  ]
}`;

  // Build multimodal parts payload for Gemini 3.6 Flash
  const parts: any[] = [];

  // Attach binary files (PDFs, PPTs, Images) as inlineData
  attachments.forEach(att => {
    if (att.base64Data && att.mimeType) {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.base64Data
        }
      });
    }
  });

  // Attach pre-sanitized text content from files or web links
  const sanitizedText = attachments
    .map(att => sanitizeDocumentText(att.textContent || ''))
    .filter(t => t && t.trim().length > 10)
    .join('\n\n--- NEXT SECTION ---\n\n');

  if (sanitizedText.trim().length > 0) {
    parts.push({
      text: `SANITIZED ACADEMIC DOCUMENT TEXT (SYLLABUS NOISE REMOVED):\n\n${sanitizedText.slice(0, 100000)}`
    });
  }

  // Final Prompt text part
  parts.push({ text: prompt });

  try {
    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const response = await fetchGeminiApi(apiKey, 'gemini-3.6-flash', body);
    if (response && response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed: GeneratedAcademicNotes = JSON.parse(text);
        if (parsed && Array.isArray(parsed.conceptCards)) {
          // JS Post-Filter to remove any noise cards that bypassed LLM rules
          parsed.conceptCards = filterNoiseConceptCards(parsed.conceptCards);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[AcademicNotesEngine] Gemini multimodal generation error:', e);
  }

  return null;
}
