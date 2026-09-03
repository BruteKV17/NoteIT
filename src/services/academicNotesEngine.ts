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

export interface AttachmentInputPayload {
  name: string;
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
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
Analyze the attached multi-page study materials (PDFs, PPTs, slides, notes) across ALL pages from Page 1 to the final page.

CRITICAL MANDATORY INSTRUCTIONS:

1. STRICT ADMINISTRATIVE NOISE FILTER (MUST REMOVE):
   Completely IGNORE and DO NOT INCLUDE any syllabus administrative overhead, such as:
   - Faculty names, professor titles, department names, email IDs, office hours
   - CO-PO (Course Outcome & Program Outcome) mapping tables, Bloom Taxonomy matrices
   - Course codes, credit weightage, grading rules, attendance criteria, prerequisites
   - Slide numbers, copyright notices, logo headers, welcome slides, table of contents

2. COMPLETE MULTI-PAGE ACADEMIC COVERAGE:
   - Read EVERY single page/slide in the document from Page 1 to the end (e.g. Page 14+).
   - Extract 100% core academic concepts, definitions, algorithms, formulas, step-by-step procedures, and technical principles.
   - Do NOT stop at Page 3! Cover all chapters and topics present in the document.

3. TEACHER FOCUS HIGHLIGHTS:
   Incorporate these teacher focus topics if provided: ${teacherTopics.length > 0 ? teacherTopics.join(', ') : 'None'}.

4. FORMAT OUTPUT AS STRICT JSON matching this schema:
{
  "subjectName": "${subjectName}",
  "conceptCards": [
    {
      "title": "Topic Title",
      "bloomLevel": "Understand",
      "conceptExplanation": "Detailed, highly scannable academic explanation with clear definitions, key formulas, and bold technical terms.",
      "keyExamPoints": [
        "Essential scoring point 1 to write in 5-mark and 10-mark answers",
        "Essential scoring point 2"
      ],
      "commonPitfalls": [
        "Common exam error or trap mistake students make on this topic"
      ],
      "comparisonTable": {
        "title": "Comparison Matrix Title",
        "headers": ["Category", "Type A", "Type B"],
        "rows": [
          ["Feature 1", "Detail A", "Detail B"]
        ]
      },
      "diagramSpec": {
        "title": "Architecture or Execution Flowchart",
        "type": "pipeline",
        "nodes": [
          {"label": "Input Stage", "subtext": "Specification"},
          {"label": "Processing Core", "subtext": "Transformation"},
          {"label": "Output Result", "subtext": "Validated State"}
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

  // Attach text content from files or web links
  const combinedText = attachments
    .map(att => att.textContent)
    .filter(t => t && t.trim().length > 10)
    .join('\n\n--- DOCUMENT END / NEXT SECTION ---\n\n');

  if (combinedText.trim().length > 0) {
    parts.push({
      text: `ADDITIONAL EXTRACTED DOCUMENT TEXT (ALL PAGES):\n\n${combinedText.slice(0, 100000)}`
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
        const parsed = JSON.parse(text);
        return parsed as GeneratedAcademicNotes;
      }
    }
  } catch (e) {
    console.warn('[AcademicNotesEngine] Gemini multimodal generation error:', e);
  }

  return null;
}
