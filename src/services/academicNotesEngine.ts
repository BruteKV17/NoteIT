/**
 * Gemini Academic Notes Generator Engine
 * Transforms raw multi-page document text (PDFs, PPTs, Word, Web links) into highly structured,
 * exam-tailored, multi-topic revision modules using gemini-3.6-flash.
 * Strictly filters out syllabus meta-noise (Faculty Intros, CO-PO mappings, office hours).
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
    type: 'pipeline' | 'tree' | 'state_machine' | 'grid';
    nodes: { label: string; subtext?: string; color?: string }[];
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

export async function generateAcademicNotesFromDocument(
  rawDocumentText: string,
  subjectName: string,
  teacherTopics: string[] = []
): Promise<GeneratedAcademicNotes | null> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  if (!apiKey || !rawDocumentText || rawDocumentText.trim().length < 20) {
    return null;
  }

  const prompt = `You are a distinguished university professor and exam paper setter for ${subjectName}.
Analyze the provided multi-page study document across ALL pages.

STRICT INSTRUCTIONS:
1. NOISE FILTER (MANDATORY): Completely IGNORE and EXCLUDE all administrative syllabus meta-noise such as:
   - Faculty names, instructor titles, office hours, email IDs
   - CO-PO (Course Outcome & Program Outcome) mapping tables
   - Course codes, grading weightage, attendance policies, prerequisites
   - Slide numbers, copyright footers, university headers

2. FULL DOCUMENT COVERAGE: Extract 100% core academic concepts, definitions, formulas, and technical principles covering EVERY unit/chapter present across all pages of the document (from Page 1 to the final page).

3. TEACHER HIGHLIGHTS: Incorporate these teacher focus topics if applicable: ${teacherTopics.join(', ')}.

4. FORMAT OUTPUT AS STRICT JSON matching this schema:
{
  "subjectName": "${subjectName}",
  "conceptCards": [
    {
      "title": "Topic Name",
      "bloomLevel": "Understand",
      "conceptExplanation": "Clear, scannable academic explanation with precise definitions and bold key terms.",
      "keyExamPoints": ["Key point 1 for 5/10 mark answers", "Key point 2"],
      "commonPitfalls": ["Common mistake students make in exam"],
      "comparisonTable": {
        "title": "Comparison Matrix",
        "headers": ["Category", "Approach A", "Approach B"],
        "rows": [["Feature 1", "Val A", "Val B"]]
      },
      "diagramSpec": {
        "title": "Architecture Pipeline",
        "type": "pipeline",
        "nodes": [
          {"label": "Input Stage", "subtext": "Raw Data"},
          {"label": "Processing Stage", "subtext": "Transformation"},
          {"label": "Output Stage", "subtext": "Result"}
        ]
      }
    }
  ],
  "subjectiveQuestions": [
    {
      "marks": "2 Marks",
      "question": "Clear 2-mark definition question from document",
      "blueprintAnswer": "Exact scoring keywords for answer"
    },
    {
      "marks": "5 Marks",
      "question": "Analytical 5-mark question",
      "blueprintAnswer": "Step-by-step scoring answer"
    },
    {
      "marks": "10 Marks",
      "question": "Comprehensive 10-mark architectural/procedural question",
      "blueprintAnswer": "Detailed structural answer blueprint"
    }
  ],
  "memoryBlocks": [
    {"title": "Core Formula/Theorem", "text":"Must-remember rule for exam"}
  ],
  "preExamCheatSheet": [
    "Scannable 5-minute pre-exam cheat point 1",
    "Scannable pre-exam cheat point 2"
  ]
}

DOCUMENT TEXT TO PROCESS (ALL PAGES):
"${rawDocumentText.slice(0, 120000)}"`;

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const response = await fetchGeminiApi(apiKey, 'gemini-3.6-flash', body);
    if (response && response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return parsed as GeneratedAcademicNotes;
      }
    }
  } catch (e) {
    console.warn('[AcademicNotesEngine] Gemini generation error:', e);
  }

  return null;
}
