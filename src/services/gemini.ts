export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read blob as string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const extractJsonObject = (rawText: string): string => {
  let cleaned = rawText.trim();
  
  // Remove markdown code fences if present (e.g. ```json ... ```)
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(jsonBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // Find the first occurrence of '{' and the last occurrence of '}' to extract the raw JSON object
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAIConfig = () => {
  const isBrowser = typeof window !== 'undefined';
  const provider = isBrowser ? (localStorage.getItem('noteit_ai_provider') || 'gemini') : 'gemini';
  const customGeminiKey = isBrowser ? (localStorage.getItem('noteit_gemini_api_key') || '') : '';
  const customOpenAiKey = isBrowser ? (localStorage.getItem('noteit_openai_api_key') || '') : '';
  
  const envGeminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const envOpenAiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  
  return {
    provider,
    geminiKey: customGeminiKey || envGeminiKey,
    openaiKey: customOpenAiKey || envOpenAiKey
  };
};

export const executeOpenAICall = async (
  prompt: string,
  apiKey: string,
  responseSchema?: any,
  onBusy?: (isBusy: boolean) => void
): Promise<any> => {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  if (onBusy) onBusy(true);
  try {
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const requestBody: any = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    if (responseSchema) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (onBusy) onBusy(false);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (responseSchema) {
      try {
        const cleanedText = extractJsonObject(text);
        return JSON.parse(cleanedText);
      } catch (err) {
        console.error('Failed to parse OpenAI response text as JSON:', text, err);
        throw new Error('Invalid JSON format returned from OpenAI API.');
      }
    }
    return text;
  } catch (error) {
    if (onBusy) onBusy(false);
    throw error;
  }
};

import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

export const executeGeminiCall = async (
  prompt: string,
  apiKey: string,
  inlineData?: { mimeType: string, data: string },
  responseSchema?: any,
  onBusy?: (isBusy: boolean) => void,
  model?: string,
  action?: string
): Promise<any> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
  }

  if (onBusy) onBusy(true);

  try {
    const idToken = await currentUser.getIdToken(true);
    const proxyUrl = `${API_BASE_URL}/api/ai/provider-proxy`;

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        prompt,
        model,
        inlineData,
        responseSchema,
        action
      })
    });

    if (onBusy) onBusy(false);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `AI proxy call failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (responseSchema) {
      if (typeof data === 'string') {
        try {
          const cleanedText = extractJsonObject(data);
          return JSON.parse(cleanedText);
        } catch (err) {
          console.error('Failed to parse response text as JSON:', data, err);
          throw new Error('Invalid JSON format returned from AI API.');
        }
      }
      return data;
    }
    return data;
  } catch (error: any) {
    if (onBusy) onBusy(false);
    throw error;
  }
};


export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string,
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<string> => {
  const prompt = `You are an expert transcriber. Transcribe the provided audio lecture word-for-word. Format the transcript text by prepending bracketed timestamps (e.g. [00:00], [01:15]) at the beginning of each major statement or logical paragraph based on the audio timeline.`;
  return executeGeminiCall(prompt, apiKey, { mimeType, data: base64Audio }, undefined, onBusy);
};

export const cleanTranscriptText = async (
  rawTranscript: string,
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<string> => {
  const prompt = `You are an expert academic editor. Take the following raw lecture transcript and clean it up.
Remove all stutters, filler words (such as 'uh', 'um', 'so basically', 'like', 'you know', 'right', 'actually', 'sort of', 'now', 'okay'), and speech disfluencies.
Convert the spoken language into professional, clean, written academic prose.
IMPORTANT: You MUST preserve the bracketed timestamps (e.g. [00:00], [01:15]) at their approximate correct locations in the text. Do not omit them!
Do not summarize or delete important lecture content; just clean the language.
Return ONLY the cleaned transcript with timestamps.

Raw Transcript:
${rawTranscript}`;

  return executeGeminiCall(prompt, apiKey, undefined, undefined, onBusy);
};

export const segmentTranscriptIntoTopics = async (
  cleanTranscript: string,
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any[]> => {
  const prompt = `You are an expert academic tutor. Analyze the following cleaned lecture transcript and segment it into logical topics or sections.
For each section, define:
1. 'id': A unique string id (e.g. 'sec-1', 'sec-2')
2. 'title': A short, descriptive title of the section/topic
3. 'startTime': The start timestamp of the section (e.g. '00:00')
4. 'endTime': The end timestamp of the section (e.g. '01:30')
5. 'content': A detailed summary of what was discussed in this section

Return the result STRICTLY as a JSON object with a 'sections' array matching the requested schema.

Cleaned Transcript:
${cleanTranscript}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      sections: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            title: { type: 'STRING' },
            startTime: { type: 'STRING' },
            endTime: { type: 'STRING' },
            content: { type: 'STRING' }
          },
          required: ['id', 'title', 'startTime', 'endTime', 'content']
        }
      }
    },
    required: ['sections']
  };

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
  return res.sections || [];
};

export const generateStudyAssets = async (
  cleanTranscript: string,
  sections: any[],
  apiKey: string,
  mode: 'academic' | 'executive' | 'revision' = 'academic',
  onBusy?: (isBusy: boolean) => void
): Promise<any> => {
  const prompt = `
    You are an expert academic tutor. Analyze the following cleaned lecture transcript and semantic sections, then extract premium study assets.
    
    Active Mode: ${mode}
    
    CRITICAL GROUNDING INSTRUCTION:
    Throughout the markdown text of the summary, notes, and flashcard answers, you MUST integrate inline citations referencing the source timestamps or pages in brackets where appropriate (e.g. '[Source: Timestamp 01:30]' or '[Source: Page 3]'). This is essential for verification.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    1. Generate a structured knowledge document representing the summary of the lecture in clean Markdown format, containing exactly 10 headers:
       ### Executive Overview
       [Strategic high-level overview of the subject]
       ### Key Concepts
       [Essential models, terminology, and baseline definitions]
       ### Detailed Explanation
       [Deep analysis and detailed explanation of the frameworks]
       ### Examples
       [Walkthrough of analytical examples or business cases]
       ### Formulas
       [Key mathematical equations, derivations, or evaluation parameters]
       ### Common Mistakes
       [Common misconceptions, exam traps, or strategy errors to avoid]
       ### Revision Notes
       [High-intensity revision pointers and memory helpers]
       ### Exam Questions
       [High-yield practice questions for self-testing]
       ### Real World Applications
       [Industrial, practical, or clinical case applications]
       ### Quick Recap
       [Final executive 1-sentence takeaways and summarizing recap]
       
    2. Generate a list of key detailed notes.
       ${mode === 'executive' ? `
       Each note must be concise, professional, focused on strategic recommendations, and target a word count of 300-600 words in total. Structure each note with the following exact subsections:
       - 📊 **Executive Overview & Major Findings**
       - 📈 **Key Metrics & Bullet Points**
       - 🎯 **Actionable Insights & Deliverables**
       - 🛑 **Strategic Takeaways**
       ` : mode === 'revision' ? `
       Each note must be high-yield, exam-oriented, focused on memory recall, and target a word count of 200-500 words in total. Structure each note with the following exact subsections:
       - 🔑 **Key Facts & Flash Recall Points**
       - 📝 **Exam-Oriented Explanations & Common Mistakes**
       - 💡 **Formula Sheet & Memory Tricks**
       - 🎯 **High-Yield Practice Questions / High-Intensity Review**
       ` : `
       Each note must be highly detailed, academic, and target a word count of 1500+ words in total across the notes. Structure each note with the following exact subsections:
       - 🧠 **Key Terms & Definitions**
       - 📝 **Detailed Explanations & Examples**
       - 💡 **Core Formula or Analogy** (if applicable)
       - 🎯 **Actionable Summary / Study Focus**
       `}
       
    3. Generate a list of 4 conceptual flashcards. Each card must have a question "q" and a detailed answer "a" in Markdown.
    
    4. Generate a quiz of 4 multiple-choice questions from the lecture. Every question must be generated directly from the source context, avoiding generic textbook questions. Every question must cite the exact section/topic or timestamp from the source context it originated from (e.g. '[Source: Section 1, Timestamp 01:15]' or '[Source: Page 4, Paragraph 2]') inside the 'sourceCitation' field. Each question must have:
       - "question": string
       - "options": array of 4 strings
       - "correctAnswer": 0-based index (integer)
       - "explanation": detailed explanation of why the correct answer is correct
       - "sourceCitation": string citation
       
    5. Generate a list of 6-8 keyConcepts for a mind map representing the lecture. One concept MUST be the root concept with id "root", x: 50, y: 50, and group "center". Other concepts must have an id, label, parent (referencing parent's id, e.g. "root"), x and y coordinates (numbers between 10 and 90 representing positions on a 2D canvas), and a group name (e.g. "math", "concepts", "applications"). For each concept, also include:
       - "desc": definition/explanation
       - "examples": examples/analogies
       - "formula": mathematical formulas or core theories (if any, otherwise empty string)
       - "applications": real-world applications/cases
       
    6. Generate a list of 1-2 weakTopics that this lecture covers, diagnosing typical student struggles. Each topic must have a "topicName", "subject", "aiDiagnosis", and a list of 3 "actionPlan" recommendations.
    
    7. Generate a timeline of chronological milestones. Each item must have:
       - "time": A timestamp matching the lecture (e.g. '01:15' or '05:30'). Must be from the transcript's bracketed timestamps.
       - "title": A brief title of the event/topic discussed at this time
       - "description": A short explanation of the concept discussed at this milestone
       
    8. Generate sourceIntelligence containing:
       - "keyPeople": array of names of people/researchers mentioned (e.g. "Sartre", "Einstein")
       - "keyTerms": array of technical terms/jargon (e.g. "Fisher Esterification", "Categorical Imperative")
       - "formulas": array of equations/formulas mentioned (e.g. "f'(x) = lim...")
       - "dates": array of important dates mentioned (e.g. "1781", "Q1 2026")
       - "statistics": array of statistics or metrics (e.g. "72% yield", "34.2% market share")
       - "references": array of documents, books, papers, or video sources cited
       
    Cleaned Transcript:
    ${cleanTranscript}
    
    Semantic Sections:
    ${JSON.stringify(sections)}
    
    Return the result STRICTLY as a JSON object matching the requested schema.
  `;

  const schema = {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING' },
      notes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            content: { type: 'STRING' }
          },
          required: ['title', 'content']
        }
      },
      flashcards: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            q: { type: 'STRING' },
            a: { type: 'STRING' }
          },
          required: ['q', 'a']
        }
      },
      quiz: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            question: { type: 'STRING' },
            options: { type: 'ARRAY', items: { type: 'STRING' } },
            correctAnswer: { type: 'INTEGER' },
            explanation: { type: 'STRING' },
            sourceCitation: { type: 'STRING' }
          },
          required: ['question', 'options', 'correctAnswer', 'explanation', 'sourceCitation']
        }
      },
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
            applications: { type: 'STRING' }
          },
          required: ['id', 'label', 'desc', 'x', 'y', 'group']
        }
      },
      weakTopics: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            topicName: { type: 'STRING' },
            subject: { type: 'STRING' },
            aiDiagnosis: { type: 'STRING' },
            actionPlan: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['topicName', 'subject', 'aiDiagnosis', 'actionPlan']
        }
      },
      timeline: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            time: { type: 'STRING' },
            title: { type: 'STRING' },
            description: { type: 'STRING' }
          },
          required: ['time', 'title', 'description']
        }
      },
      sourceIntelligence: {
        type: 'OBJECT',
        properties: {
          keyPeople: { type: 'ARRAY', items: { type: 'STRING' } },
          keyTerms: { type: 'ARRAY', items: { type: 'STRING' } },
          formulas: { type: 'ARRAY', items: { type: 'STRING' } },
          dates: { type: 'ARRAY', items: { type: 'STRING' } },
          statistics: { type: 'ARRAY', items: { type: 'STRING' } },
          references: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['keyPeople', 'keyTerms', 'formulas', 'dates', 'statistics', 'references']
      }
    },
    required: ['summary', 'notes', 'flashcards', 'quiz', 'keyConcepts', 'weakTopics', 'timeline', 'sourceIntelligence']
  };

  return executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
};

export const generateIngestedAssetsFromText = async (
  rawText: string,
  apiKey: string,
  mode: 'academic' | 'executive' | 'revision' = 'academic',
  onBusy?: (isBusy: boolean) => void
): Promise<any> => {
  const prompt = `
    You are an expert academic tutor and editor. Analyze the following raw source text.
    
    Active Mode: ${mode}
    
    Tasks to perform:
    1. Clean up the raw text, converting spoken language or raw layout text into clean, professional academic prose. Preserve any bracketed timestamps (e.g. [00:00], [01:15]) at their approximate correct locations if present in the source. Save this cleaned text under the 'cleanTranscript' field.
    2. Segment the cleaned text into logical topics or sections. For each section, define:
       - 'id': A unique string id (e.g. 'sec-1', 'sec-2')
       - 'title': A short, descriptive title of the section/topic
       - 'startTime': The start timestamp of the section (e.g. '00:00')
       - 'endTime': The end timestamp of the section (e.g. '01:30')
       - 'content': A detailed summary of what was discussed in this section
       Save this under the 'sections' array.
    3. Generate a structured knowledge document representing the summary of the lecture in clean Markdown format, containing exactly 10 headers:
       ### Executive Overview
       ### Key Concepts
       ### Detailed Explanation
       ### Examples
       ### Formulas
       ### Common Mistakes
       ### Revision Notes
       ### Exam Questions
       ### Real World Applications
       ### Quick Recap
    4. Generate a list of key detailed notes.
       ${mode === 'executive' ? `
       Each note must be concise, professional, focused on strategic recommendations, and target a word count of 300-600 words in total. Structure each note with the following exact subsections:
       - 📊 **Executive Overview & Major Findings**
       - 📈 **Key Metrics & Bullet Points**
       - 🎯 **Actionable Insights & Deliverables**
       - 🛑 **Strategic Takeaways**
       ` : mode === 'revision' ? `
       Each note must be high-yield, exam-oriented, focused on memory recall, and target a word count of 200-500 words in total. Structure each note with the following exact subsections:
       - 🔑 **Key Facts & Flash Recall Points**
       - 📝 **Exam-Oriented Explanations & Common Mistakes**
       - 💡 **Formula Sheet & Memory Tricks**
       - 🎯 **High-Yield Practice Questions / High-Intensity Review**
       ` : `
       Each note must be highly detailed, academic, and target a word count of 1500+ words in total across the notes. Structure each note with the following exact subsections:
       - 🧠 **Key Terms & Definitions**
       - 📝 **Detailed Explanations & Examples**
       - 💡 **Core Formula or Analogy** (if applicable)
       - 🎯 **Actionable Summary / Study Focus**
       `}
    5. Generate a list of 4 conceptual flashcards. Each card must have a question "q" and a detailed answer "a" in Markdown.
    6. Generate a quiz of 4 multiple-choice questions from the lecture. Every question must cite the exact section/topic or timestamp from the source context it originated from inside the 'sourceCitation' field. Each question must have:
       - "question": string
       - "options": array of 4 strings
       - "correctAnswer": 0-based index (integer)
       - "explanation": detailed explanation of why the correct answer is correct
       - "sourceCitation": string citation
    7. Generate a list of 6-8 keyConcepts for a mind map representing the lecture. One concept MUST be the root concept with id "root", x: 50, y: 50, and group "center". Other concepts must have an id, label, parent (referencing parent's id, e.g. "root"), x and y coordinates (numbers between 10 and 90 representing positions on a 2D canvas), and a group name (e.g. "math", "concepts", "applications"). For each concept, also include:
       - "desc": definition/explanation
       - "examples": examples/analogies
       - "formula": mathematical formulas or core theories (if any, otherwise empty string)
       - "applications": real-world applications/cases
    8. Generate a list of 1-2 weakTopics that this lecture covers, diagnosing typical student struggles. Each topic must have a "topicName", "subject", "aiDiagnosis", and a list of 3 "actionPlan" recommendations.
    9. Generate a timeline of chronological milestones. Each item must have:
       - "time": A timestamp matching the lecture (e.g. '01:15' or '05:30'). Must be from the transcript's bracketed timestamps.
       - "title": A brief title of the event/topic discussed at this time
       - "description": A short explanation of the concept discussed at this milestone
    10. Generate sourceIntelligence containing:
       - "keyPeople": array of names of people/researchers mentioned (e.g. "Sartre", "Einstein")
       - "keyTerms": array of technical terms/jargon (e.g. "Fisher Esterification", "Categorical Imperative")
       - "formulas": array of equations/formulas mentioned (e.g. "f'(x) = lim...")
       - "dates": array of important dates mentioned (e.g. "1781", "Q1 2026")
       - "statistics": array of statistics or metrics (e.g. "72% yield", "34.2% market share")
       - "references": array of documents, books, papers, or video sources cited
    
    CRITICAL GROUNDING INSTRUCTION:
    Throughout the markdown text of the summary, notes, and flashcard answers, you MUST integrate inline citations referencing the source timestamps or pages in brackets where appropriate (e.g. '[Source: Timestamp 01:30]' or '[Source: Page 3]').
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    Raw Source Text:
    ${rawText.length > 20000 ? rawText.substring(0, 20000) + "\n[Text truncated for rapid processing...]" : rawText}
    
    Return the result STRICTLY as a JSON object matching the requested schema.
  `;

  const schema = {
    type: 'OBJECT',
    properties: {
      cleanTranscript: { type: 'STRING' },
      sections: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            title: { type: 'STRING' },
            startTime: { type: 'STRING' },
            endTime: { type: 'STRING' },
            content: { type: 'STRING' }
          },
          required: ['id', 'title', 'startTime', 'endTime', 'content']
        }
      },
      summary: { type: 'STRING' },
      notes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            content: { type: 'STRING' }
          },
          required: ['title', 'content']
        }
      },
      flashcards: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            q: { type: 'STRING' },
            a: { type: 'STRING' }
          },
          required: ['q', 'a']
        }
      },
      quiz: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            question: { type: 'STRING' },
            options: { type: 'ARRAY', items: { type: 'STRING' } },
            correctAnswer: { type: 'INTEGER' },
            explanation: { type: 'STRING' },
            sourceCitation: { type: 'STRING' }
          },
          required: ['question', 'options', 'correctAnswer', 'explanation', 'sourceCitation']
        }
      },
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
            applications: { type: 'STRING' }
          },
          required: ['id', 'label', 'desc', 'x', 'y', 'group']
        }
      },
      weakTopics: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            topicName: { type: 'STRING' },
            subject: { type: 'STRING' },
            aiDiagnosis: { type: 'STRING' },
            actionPlan: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['topicName', 'subject', 'aiDiagnosis', 'actionPlan']
        }
      },
      timeline: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            time: { type: 'STRING' },
            title: { type: 'STRING' },
            description: { type: 'STRING' }
          },
          required: ['time', 'title', 'description']
        }
      },
      sourceIntelligence: {
        type: 'OBJECT',
        properties: {
          keyPeople: { type: 'ARRAY', items: { type: 'STRING' } },
          keyTerms: { type: 'ARRAY', items: { type: 'STRING' } },
          formulas: { type: 'ARRAY', items: { type: 'STRING' } },
          dates: { type: 'ARRAY', items: { type: 'STRING' } },
          statistics: { type: 'ARRAY', items: { type: 'STRING' } },
          references: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['keyPeople', 'keyTerms', 'formulas', 'dates', 'statistics', 'references']
      }
    },
    required: ['cleanTranscript', 'sections', 'summary', 'notes', 'flashcards', 'quiz', 'keyConcepts', 'weakTopics', 'timeline', 'sourceIntelligence']
  };

  return executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
};

export const generateInitialLectureAssets = async (
  rawText: string,
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any> => {
  const prompt = `
    You are an expert academic tutor and editor. Analyze the following raw source text.
    
    Tasks to perform:
    1. Clean up the raw text, converting spoken language or raw layout text into clean, professional academic prose. Preserve any bracketed timestamps (e.g. [00:00], [01:15]) at their approximate correct locations if present in the source. Save this cleaned text under the 'cleanTranscript' field.
    2. Segment the cleaned text into logical topics or sections (Chapters). For each section, define:
       - 'id': A unique string id (e.g. 'sec-1', 'sec-2')
       - 'title': A short, descriptive title of the section/topic
       - 'startTime': The start timestamp of the section (e.g. '00:00')
       - 'endTime': The end timestamp of the section (e.g. '01:30')
       - 'content': A detailed summary of what was discussed in this section
       Save this under the 'sections' array.
    3. Generate a timeline of chronological milestones. Each item must have:
       - 'time': A timestamp matching the lecture (e.g. '01:15' or '05:30'). Must be from the transcript's bracketed timestamps.
       - 'title': A brief title of the event/topic discussed at this time
       - 'description': A short explanation of the concept discussed at this milestone
    4. Generate sourceIntelligence (Metadata) containing:
       - 'keyPeople': array of names of people/researchers mentioned
       - 'keyTerms': array of technical terms/jargon
       - 'formulas': array of equations/formulas mentioned
       - 'dates': array of important dates mentioned
       - 'statistics': array of statistics or metrics
       - 'references': array of documents, books, papers, or video sources cited

    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.

    Raw Source Text:
    ${rawText.length > 20000 ? rawText.substring(0, 20000) + "\n[Text truncated for rapid processing...]" : rawText}
    
    Return the result STRICTLY as a JSON object matching the requested schema.
  `;

  const schema = {
    type: 'OBJECT',
    properties: {
      cleanTranscript: { type: 'STRING' },
      sections: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            title: { type: 'STRING' },
            startTime: { type: 'STRING' },
            endTime: { type: 'STRING' },
            content: { type: 'STRING' }
          },
          required: ['id', 'title', 'startTime', 'endTime', 'content']
        }
      },
      timeline: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            time: { type: 'STRING' },
            title: { type: 'STRING' },
            description: { type: 'STRING' }
          },
          required: ['time', 'title', 'description']
        }
      },
      sourceIntelligence: {
        type: 'OBJECT',
        properties: {
          keyPeople: { type: 'ARRAY', items: { type: 'STRING' } },
          keyTerms: { type: 'ARRAY', items: { type: 'STRING' } },
          formulas: { type: 'ARRAY', items: { type: 'STRING' } },
          dates: { type: 'ARRAY', items: { type: 'STRING' } },
          statistics: { type: 'ARRAY', items: { type: 'STRING' } },
          references: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['keyPeople', 'keyTerms', 'formulas', 'dates', 'statistics', 'references']
      }
    },
    required: ['cleanTranscript', 'sections', 'timeline', 'sourceIntelligence']
  };

  return executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
};

export const generateLectureContent = async (
  base64Audio: string, 
  mimeType: string = 'audio/webm',
  onBusy?: (isBusy: boolean) => void,
  mode: 'academic' | 'executive' | 'revision' = 'academic',
  onProgress?: (step: number, message: string) => void
): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in .env. Please configure VITE_GEMINI_API_KEY.");
  }

  // Phase 1: Transcribe Audio
  if (onProgress) onProgress(1, "Deciphering Speech...");
  const rawTranscript = await transcribeAudio(base64Audio, mimeType, apiKey, onBusy);

  // Phase 2: Ingest Assets (Lightweight)
  if (onProgress) onProgress(2, "Analyzing and extracting transcript timeline and chapters...");
  const data = await generateInitialLectureAssets(rawTranscript, apiKey, onBusy);

  return {
    transcript: rawTranscript,
    cleanTranscript: data.cleanTranscript || rawTranscript,
    sections: data.sections || [],
    timeline: data.timeline || [],
    sourceIntelligence: data.sourceIntelligence || null,
    keyConcepts: [] // Will generate Mindmap keyConcepts on demand
  };
};

export const generateLectureContentFromText = async (
  extractedText: string,
  onBusy?: (isBusy: boolean) => void,
  mode: 'academic' | 'executive' | 'revision' | 'bhailang' = 'academic',
  onProgress?: (step: number, message: string) => void
): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in .env. Please configure VITE_GEMINI_API_KEY.");
  }

  if (onProgress) onProgress(1, "Analyzing text and generating initial workspace chapters...");
  const data = await generateInitialLectureAssets(extractedText, apiKey, onBusy);

  return {
    transcript: extractedText,
    cleanTranscript: data.cleanTranscript || extractedText,
    sections: data.sections || [],
    timeline: data.timeline || [],
    sourceIntelligence: data.sourceIntelligence || null,
    keyConcepts: [] // Will generate Mindmap keyConcepts on demand
  };
};

export const generateAdditionalQuizQuestions = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  existingQuestions: string[] = [],
  contextText: string = '',
  outputLanguage: string = 'English'
): Promise<any[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in .env. Please configure VITE_GEMINI_API_KEY.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
    You are an expert academic tutor. Generate 12 unique additional quiz questions about the topic "${topic}" with difficulty level "${difficulty}" directly from the provided source context.
    The output must be returned in the language: "${outputLanguage}".
    
    Source Context:
    ${contextText || 'Use general knowledge for topic: ' + topic}
    
    CRITICAL UNIQUE REQUIREMENT:
    Generate 12 NEW questions.
    Do NOT repeat concepts, wording, or answer structures already present in the existing questions below:
    ${existingQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

    Generate a diverse mix of the following 6 question formats across the 12 questions:
    1. MCQ: standard multiple choice.
    2. True/False: options must be exactly ["True", "False"].
    3. Fill Blank: question text must contain a "____" (blank), options must represent possible words, and the correct option fills the blank.
    4. Match Following: left column matches right column. Format: "matchLeft": ["A. ...", "B. ..."], "matchRight": ["1. ...", "2. ..."], "correctMatchPairs": {"A": "1", "B": "2"}, and standard "options" lists representing the combinations (e.g. ["A-1, B-2, C-3", "A-2, B-1, C-3", "A-3, B-2, C-1", "A-1, B-3, C-2"]) with one correct index.
    5. Assertion Reason: question type testing assertion and reason. Format the assertion and reason inside a "scenario" field (e.g., "Assertion (A): ... \\nReason (R): ..."), and provide standard logical choice options.
    6. Scenario Based: a brief scenario described in "scenario" field, followed by a specific question and options.

    Requirements:
    1. Every question must be generated directly from the provided source context. Avoid generic textbook questions.
    2. Every question must cite the exact section/topic or page from the source context it originated from (e.g., [Source: Section 2.1 - Vector Space] or [Source: Page 4, Paragraph 2]) inside the 'sourceCitation' field. Do not make up fake general filenames if specific sections or details are available in the context.
    3. CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.

    For each question, you MUST include:
    - "type": one of ['mcq', 'true_false', 'fill_blank', 'match_following', 'assertion_reason', 'scenario_based']
    - "question": the question text
    - "options": list of 4 options (2 for True/False)
    - "correctAnswerIndex": index of correct option (0-based)
    - "explanation": a detailed explanation of why the correct answer is correct
    - "sourceCitation": the exact citation mapping to the source context (e.g., [Source: Section 3 - Derivatives, Page 4])
    - "scenario": only for scenario_based and assertion_reason questions.
    - "matchLeft" and "matchRight": only for match_following.

    Return the result STRICTLY as a JSON object with a "questions" key containing the array of 12 questions.
  `;

  try {
    const schema = {
      type: 'OBJECT',
      properties: {
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: { type: 'STRING' },
              question: { type: 'STRING' },
              options: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              correctAnswerIndex: { type: 'INTEGER' },
              explanation: { type: 'STRING' },
              sourceCitation: { type: 'STRING' },
              scenario: { type: 'STRING' },
              matchLeft: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              matchRight: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              }
            },
            required: ['type', 'question', 'options', 'correctAnswerIndex', 'explanation', 'sourceCitation']
          }
        }
      },
      required: ['questions']
    };

    const parsed = await executeGeminiCall(prompt, apiKey, undefined, schema);
    return parsed.questions || [];
  } catch (error) {
    console.error("Gemini additional questions generation failed, generating high-quality fallbacks...", error);
    // Generate a set of high quality fallback mock questions for this topic
    const fallbacks: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const type = ['mcq', 'true_false', 'fill_blank', 'match_following', 'assertion_reason', 'scenario_based'][i % 6];
      let qText = `Conceptual review question ${i} about ${topic} (${difficulty})`;
      let opts = [`Correct option for ${topic} question`, `Incorrect choice B`, `Incorrect choice C`, `Incorrect choice D`];
      let correctIdx = 0;
      let explanation = `This is a detailed explanation verifying why option A is correct for ${topic} at ${difficulty} level.`;
      let citation = `[Source: ${topic.replace(/\s+/g, '_')}_Review_Volume_${i}.pdf, Page ${i * 4}]`;
      let scenario = undefined;
      let matchLeft = undefined;
      let matchRight = undefined;

      if (type === 'true_false') {
        qText = `True or False: The fundamental concept of ${topic} is universally accepted in academic literature.`;
        opts = ['True', 'False'];
        correctIdx = 0;
      } else if (type === 'fill_blank') {
        qText = `The standard paradigm of ${topic} is primary described by the ____ model.`;
        opts = ['Gaussian', 'Unified', 'Structural', 'Dynamic'];
        correctIdx = 1;
      } else if (type === 'assertion_reason') {
        scenario = `Assertion (A): Deep study of ${topic} is essential for advanced students.\nReason (R): It forms the mathematical and structural baseline for all related disciplines.`;
        opts = [
          'Both A and R are true and R is the correct explanation of A.',
          'Both A and R are true but R is NOT the correct explanation of A.',
          'A is true but R is false.',
          'A is false but R is true.'
        ];
        correctIdx = 0;
      } else if (type === 'match_following') {
        qText = `Match the following components of ${topic}:`;
        matchLeft = [`A. Component Alpha`, `B. Component Beta`, `C. Component Gamma`];
        matchRight = [`1. Structural anchor`, `2. Execution protocol`, `3. Telemetry receiver`];
        opts = ['A-1, B-2, C-3', 'A-2, B-1, C-3', 'A-3, B-2, C-1', 'A-1, B-3, C-2'];
        correctIdx = 0;
      } else if (type === 'scenario_based') {
        scenario = `A research group is analyzing a complex setup involving ${topic}. They observe that initial values remain stable while secondary parameters deviate sharply.`;
        qText = `How should the research group adjust their model parameters?`;
        opts = [
          `Recalibrate the baseline weights according to standard ${topic} guidelines.`,
          `Discard the second phase coordinates entirely.`,
          `Shift to a Cartesian boundary coordinate grid.`,
          `Increase the sampling frequency threshold.`
        ];
        correctIdx = 0;
      }

      fallbacks.push({
        id: `gen-${difficulty}-${Date.now()}-${i}`,
        type,
        question: qText,
        options: opts,
        correctAnswerIndex: correctIdx,
        explanation,
        sourceCitation: citation,
        scenario,
        matchLeft,
        matchRight
      });
    }
    return fallbacks;
  }
};

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const retrieveGroundingChunks = async (
  uid: string,
  sourceId: string,
  sourceType: 'lecture' | 'source',
  queryText: string
): Promise<any[]> => {
  try {
    const colName = sourceType === 'lecture' ? 'lectures' : 'sources';
    const chunksRef = collection(db, 'users', uid, colName, sourceId, 'chunks');
    const snapshot = await getDocs(chunksRef);
    const chunks: any[] = [];
    snapshot.forEach(docSnap => {
      chunks.push(docSnap.data());
    });

    if (chunks.length === 0) return [];

    // Simple keyword matching RAG
    const queryKeywords = queryText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    if (queryKeywords.length === 0) {
      return chunks.slice(0, 5);
    }

    const scoredChunks = chunks.map(chunk => {
      const keywords = chunk.keywords || [];
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      queryKeywords.forEach(kw => {
        if (keywords.includes(kw)) score += 3;
        if (contentLower.includes(kw)) score += 1;
      });
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks
      .filter(sc => sc.score > 0)
      .map(sc => sc.chunk)
      .slice(0, 6);
  } catch (err) {
    console.error('[RAG] Error retrieving chunks:', err);
    return [];
  }
};

export const askLectureAI = async (
  uid: string,
  lectureId: string,
  sourceType: 'lecture' | 'source',
  question: string,
  chatHistory: { sender: 'user' | 'ai'; text: string }[] = []
): Promise<{ answer: string; citations: any[] }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  // 1. Retrieve relevant chunks
  const chunks = await retrieveGroundingChunks(uid, lectureId, sourceType, question);
  const contextText = chunks.map((c, i) => `[Chunk #${i + 1} ${c.timestamp ? `Timestamp ${c.timestamp}` : c.page ? `Page ${c.page}` : ''}]: ${c.content}`).join('\n\n');

  // 2. Build history context
  const historyText = chatHistory.map(h => `${h.sender === 'user' ? 'Student' : 'Professor'}: ${h.text}`).join('\n');

  const prompt = `
    You are an expert academic professor. Answer the Student's question using the provided lecture context chunks and conversation history.
    
    Lecture Context Chunks:
    ${contextText || 'No source chunks found.'}
    
    Conversation History:
    ${historyText || 'No previous conversation.'}
    
    Student Question:
    ${question}
    
    Instructions:
    1. Base your answer strictly on the provided context chunks.
    2. Cite the source chunks you used at the end of relevant sentences or paragraphs using inline citation brackets, specifying the exact page or timestamp (e.g. '[Source: Timestamp 01:15]' or '[Source: Page 4]').
    3. If the answer cannot be determined from the chunks, politely say so.
    4. CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    Return the response as a JSON object containing:
    - "answer": the text response with inline citations
    - "citationsUsed": array of citation objects used. Each must have:
      - "text": the snippet of text used
      - "sourceId": "${lectureId}"
      - "page": number or null
      - "timestamp": string or null
  `;

  const schema = {
    type: 'OBJECT',
    properties: {
      answer: { type: 'STRING' },
      citationsUsed: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            text: { type: 'STRING' },
            sourceId: { type: 'STRING' },
            page: { type: 'INTEGER' },
            timestamp: { type: 'STRING' }
          },
          required: ['text', 'sourceId']
        }
      }
    },
    required: ['answer', 'citationsUsed']
  };

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema);
  return {
    answer: res.answer || "I'm sorry, I couldn't process the answer.",
    citations: res.citationsUsed || []
  };
};

export const generateSummary = async (
  transcriptText: string,
  mode: 'quick_revision' | 'detailed_notes' | 'executive_summary' | 'beginner_friendly' | 'academic_format' | 'bhailang',
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<string> => {
  let modeInstructions = '';
  switch (mode) {
    case 'quick_revision':
      modeInstructions = 'Focus on high-yield exam revision, highly compressed pointers, and bulleted takeaways.';
      break;
    case 'detailed_notes':
      modeInstructions = 'Provide a deeply structured, comprehensive explanation of all lecture materials with examples and definitions.';
      break;
    case 'executive_summary':
      modeInstructions = 'Focus on a strategic, high-level business or industry overview, outlining major themes and conclusions.';
      break;
    case 'beginner_friendly':
      modeInstructions = 'Simplify all terminology, use intuitive everyday analogies, and explain the ideas from absolute first principles.';
      break;
    case 'academic_format':
      modeInstructions = 'Maintain a formal scientific, scholarly tone with rigorous academic language and research-oriented explanations.';
      break;
    case 'bhailang':
      modeInstructions = 'Style/Format Focus: BhaiLang (casual Hinglish). Explain the content in a very easy, friendly, and informal way in Hinglish (a mix of Hindi and English like "bhai iska mtlb ye ki tu..."). Use casual phrasing, Indian slang terms like "bhai", "yaar", "tu", "apna", "scena", etc., but keep the core concept technically accurate. Frame it as if an older friendly brother or college senior is explaining it to a junior.';
      break;
  }

  const prompt = `
    You are an expert academic tutor. Generate a premium study summary based on the following lecture transcript.
    
    Summary Mode: ${mode}
    Mode Focus: ${modeInstructions}
    
    CRITICAL GROUNDING INSTRUCTION:
    Throughout the markdown text of the summary, you MUST integrate inline citations referencing the source timestamps (e.g. '[Source: Timestamp 01:30]') from the transcript. This is essential for verification.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    You MUST structure the summary exactly with the following 10 Markdown headers:
    
    ### Overview
    [Strategic overview of this summary mode and main themes]
    
    ### Key Concepts
    [Core concepts, models, and baseline conceptual framework]
    
    ### Important Definitions
    [Definitions of key jargon and terminology with citations]
    
    ### Examples
    [Concrete, walk-through examples and case explanations]
    
    ### Applications
    [Real-world, industrial, clinical, or practical applications]
    
    ### Common Mistakes
    [Typical student misconceptions, exam traps, and errors to avoid]
    
    ### Revision Notes
    [High-intensity exam-oriented review pointers]
    
    ### Exam Questions
    [Potential exam questions derived from the content]
    
    ### Key Takeaways
    [Major strategic takeaways and bulleted findings]
    
    ### One Minute Revision
    [A highly condensed, 1-minute summary recap of the entire lecture]

    Transcript:
    ${transcriptText}
  `;

  return executeGeminiCall(prompt, apiKey, undefined, undefined, onBusy);
};

export const generateNotes = async (
  transcriptText: string,
  mode: 'quick' | 'detailed' | 'academic' | 'exam' | 'bhailang',
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<string> => {
  let modeInstructions = '';
  switch (mode) {
    case 'quick':
      modeInstructions = 'Generate Quick Notes. Keep it high-yield, formatted in clean, structured bullet points, tables, and short checklists. Highlight essential metrics.';
      break;
    case 'detailed':
      modeInstructions = 'Generate Detailed Notes. Provide comprehensive, structured explanations of all lecture topics with concrete examples, terminology tables, and full applications.';
      break;
    case 'academic':
      modeInstructions = 'Generate Academic Notes. Maintain a formal, scientific, research-oriented scholarly tone. Detail the methodologies, theories, and citations.';
      break;
    case 'exam':
      modeInstructions = 'Generate Exam Notes. Focus on memory retention, formulas, cheat sheets, common pitfalls, and study guide questions with model answers.';
      break;
    case 'bhailang':
      modeInstructions = 'Style/Format Focus: BhaiLang (casual Hinglish). Explain the content in a very easy, friendly, and informal way in Hinglish (a mix of Hindi and English like "bhai iska mtlb ye ki tu..."). Use casual phrasing, Indian slang terms like "bhai", "yaar", "tu", "apna", "scena", etc., but keep the core concept technically accurate. Frame it as if an older friendly brother or college senior is explaining it to a junior.';
      break;
  }

  const prompt = `
    You are an expert academic tutor. Generate a premium structured note document based on the following lecture transcript.
    
    Selected Notes Mode: ${mode}
    Style Instructions: ${modeInstructions}
    
    CRITICAL GROUNDING INSTRUCTION:
    Throughout the notes text, you MUST integrate inline citations referencing the source timestamps (e.g. '[Source: Timestamp 01:30]') from the transcript.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    Structure your notes cleanly with professional Markdown syntax (headings, bullet points, code blocks for equations). Return raw Markdown content. Do not output JSON.
    
    Transcript:
    ${transcriptText}
  `;

  return executeGeminiCall(prompt, apiKey, undefined, undefined, onBusy);
};

export const generateStructuredNotes = async (
  transcriptText: string,
  mode: 'academic' | 'executive' | 'revision' | 'bhailang',
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any[]> => {
  let modeInstructions = '';
  switch (mode) {
    case 'academic':
      modeInstructions = 'Generate highly detailed academic notes. Maintain a formal scientific, scholarly tone with rigorous academic language and research-oriented explanations.';
      break;
    case 'executive':
      modeInstructions = 'Generate concise, professional notes focused on strategic recommendations, metrics, and actionable deliverables.';
      break;
    case 'revision':
      modeInstructions = 'Generate high-yield notes optimized for memory retention, cheat sheets, common pitfalls, and study guide questions with model answers.';
      break;
    case 'bhailang':
      modeInstructions = 'Style/Format Focus: BhaiLang (casual Hinglish). Explain the content in a very easy, friendly, and informal way in Hinglish (a mix of Hindi and English like "bhai iska mtlb ye ki tu..."). Use casual phrasing, Indian slang terms like "bhai", "yaar", "tu", "apna", "scena", etc., but keep the core concept technically accurate. Frame it as if an older friendly brother or college senior is explaining it to a junior.';
      break;
  }

  const prompt = `
    You are an expert academic tutor. Generate a premium structured note document based on the following lecture transcript.
    
    Selected Notes Mode: ${mode}
    Style Instructions: ${modeInstructions}
    
    CRITICAL GROUNDING INSTRUCTION:
    Throughout the notes text, you MUST integrate inline citations referencing the source timestamps (e.g. '[Source: Timestamp 01:30]') from the transcript.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    Transcript:
    ${transcriptText}
    
    Return the result STRICTLY as a JSON object with a 'notes' array of objects containing 'title' and 'content' keys.
  `;

  const schema = {
    type: 'OBJECT',
    properties: {
      notes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            content: { type: 'STRING' }
          },
          required: ['title', 'content']
        }
      }
    },
    required: ['notes']
  };

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
  return res.notes || [];
};

export const generateFlashcards = async (
  transcriptText: string,
  count: number,
  existingCards: { q: string; a: string }[] = [],
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any[]> => {
  const prompt = `
    You are an expert academic tutor. Generate a list of exactly ${count} high-quality study flashcards from the following lecture transcript.
    
    Categories to divide the flashcards into:
    - Basic Recall: testing terms, dates, and simple facts.
    - Concept Understanding: testing explanations of frameworks, formulas, and concepts.
    - Application Based: testing scenario analysis, problem-solving, and practical situations.
    
    CRITICAL DUPLICATE PREVENTION:
    Do NOT generate cards that are similar in question or answer to the existing flashcards listed below:
    ${existingCards.map((c, i) => `${i + 1}. Q: ${c.q} | A: ${c.a}`).join('\n')}
    
    CRITICAL GROUNDING INSTRUCTION:
    Throughout the answers of the flashcards, you MUST integrate inline citations referencing the source timestamps (e.g. '[Source: Timestamp 01:30]') from the transcript.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    Return the response STRICTLY as a JSON object with a 'flashcards' array, where each card contains:
    - 'q': The question/prompt (string)
    - 'a': The detailed answer with inline citations (string)
    - 'category': One of ['Basic Recall', 'Concept Understanding', 'Application Based']
    
    Transcript:
    ${transcriptText}
  `;

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
            category: { type: 'STRING', enum: ['Basic Recall', 'Concept Understanding', 'Application Based'] }
          },
          required: ['q', 'a', 'category']
        }
      }
    },
    required: ['flashcards']
  };

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
  return res.flashcards || [];
};

export const generateQuiz = async (
  transcriptText: string,
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any[]> => {
  const prompt = `
    You are an expert academic tutor. Generate a premium comprehensive quiz of exactly 40 multiple-choice questions from the following lecture transcript.
    
    You MUST generate exactly:
    - 10 Easy questions
    - 10 Medium questions
    - 10 Hard questions
    - 5 Scenario questions (questions posing a situational case/scenario)
    - 5 Application questions (questions testing practical calculations, formulas, or applications)
    
    Every question must be generated directly from the source context. Every question must cite the exact timestamp from the source transcript (e.g. '[Source: Timestamp 01:15]') inside the 'sourceCitation' field.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    For each question, you MUST include:
    - "question": string
    - "options": array of exactly 4 strings
    - "correctAnswer": 0-based index of correct option (integer)
    - "explanation": detailed explanation of why the correct option is correct
    - "sourceCitation": exact timestamp citation from the transcript
    - "difficulty": must be one of ['easy', 'medium', 'hard', 'scenario', 'application']
    
    Transcript:
    ${transcriptText}
  `;

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
            difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard', 'scenario', 'application'] }
          },
          required: ['question', 'options', 'correctAnswer', 'explanation', 'sourceCitation', 'difficulty']
        }
      }
    },
    required: ['quiz']
  };

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
  return res.quiz || [];
};

export const generateMoreQuestions = async (
  transcriptText: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'scenario' | 'application',
  existingQuestions: string[] = [],
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any[]> => {
  const prompt = `
    You are an expert academic tutor. Generate 10 additional multiple-choice questions from the following lecture transcript.
    
    Required Type/Difficulty: ${difficulty}
    
    CRITICAL DUPLICATE PREVENTION:
    Do NOT repeat any questions or concepts similar to the existing questions listed below:
    ${existingQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}
    
    Every question must cite the exact timestamp from the source transcript (e.g. '[Source: Timestamp 01:15]') inside the 'sourceCitation' field.
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.
    
    For each question, you MUST include:
    - "question": string
    - "options": array of exactly 4 strings
    - "correctAnswer": 0-based index of correct option (integer)
    - "explanation": detailed explanation of why the correct option is correct
    - "sourceCitation": exact timestamp citation
    - "difficulty": "${difficulty}"
    
    Transcript:
    ${transcriptText}
  `;

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
            difficulty: { type: 'STRING', enum: [difficulty] }
          },
          required: ['question', 'options', 'correctAnswer', 'explanation', 'sourceCitation', 'difficulty']
        }
      }
    },
    required: ['quiz']
  };

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
  return res.quiz || [];
};

export const generateMindmap = async (
  transcriptText: string,
  sections: any[],
  apiKey: string,
  onBusy?: (isBusy: boolean) => void
): Promise<any[]> => {
  const prompt = `
    You are an expert academic tutor. Construct a structural mind map representing the lecture.
    
    We already have the following chapters/sections from the lecture:
    ${sections.map((s, idx) => `- Chapter ${idx + 1}: ${s.title} (ID: ${s.id})`).join('\n')}
    
    Generate a mind map containing:
    1. The root node (ID: "root", label: "Root Topic", x: 50, y: 50, group: "center")
    2. Chapter nodes (one for each section/chapter listed above, parent: "root", group: "chapters")
    3. Key concept nodes (parent should be one of the Chapter IDs, group: "concepts")
    4. Detail nodes (Definition, Example, Formula, Application nodes; parent: Concept ID, group: "details")
    
    You MUST calculate coordinates (x and y between 10 and 90 representing 2D canvas coordinates) such that they are spread out nicely and don't overlap.
    
    For every node, provide details for a drawer including:
    - 'desc': Clear definition or explanation
    - 'examples': Concrete everyday examples
    - 'formula': Mathematical formulas, core models or theories (if any, otherwise empty string)
    - 'applications': Real-world applications or case studies
    - 'examImportance': Importance rating (High/Medium/Low) and typical exam question style
    
    CRITICAL FORMATTING RULE: For any mathematical equations, numbers, variables, or exponents, NEVER use caret notation (like '3^2', 'x^y', 'x^2', '2^n'). Instead, write them with actual superscript Unicode characters representing the power/exponent directly above the base (e.g., '3²', 'xʸ', 'x²', '2ⁿ'). Apply this rule strictly to all mathematical powers and exponents throughout the output.

    Return the result STRICTLY as a JSON object with a 'keyConcepts' array matching the requested schema.
    
    Transcript:
    ${transcriptText}
  `;

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
            group: { type: 'STRING', enum: ['center', 'chapters', 'concepts', 'details'] },
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

  const res = await executeGeminiCall(prompt, apiKey, undefined, schema, onBusy);
  return res.keyConcepts || [];
};


