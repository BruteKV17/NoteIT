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

export const generateLectureContent = async (
  base64Audio: string, 
  mimeType: string = 'audio/webm',
  onBusy?: (isBusy: boolean) => void
): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in .env. Please configure VITE_GEMINI_API_KEY.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
    You are an expert academic tutor. Analyze the provided audio lecture and perform the following tasks:
    1. Generate a detailed, chronological transcript of the lecture. Format the transcript text by prepending bracketed timestamps (e.g. [00:00], [01:15]) at the beginning of each major statement or logical paragraph based on the audio timeline.
    2. Generate a structured academic summary of the lecture in clean Markdown format (covering main ideas, objectives, and any core formulas/definitions).
    3. Generate a list of key detailed notes from the lecture context. Each note must have a title and detailed content in Markdown. Inside the content, structure it with the following exact subsections:
       - 🧠 **Key Terms & Definitions**
       - 📝 **Detailed Explanations & Examples**
       - 💡 **Core Formula or Analogy** (if applicable)
       - 🎯 **Actionable Summary / Study Focus**
    4. Generate a list of 4 conceptual flashcards from the lecture. Each flashcard must have a question "q" and a detailed answer "a" in Markdown.
    5. Generate a quiz of 3-4 multiple-choice questions from the lecture. Each question must have a "question", a list of 4 "options", a "correctAnswer" index (0-based), and a detailed conceptual "explanation".
    6. Generate a list of 5-7 keyConcepts for a mind map representing the lecture. One concept MUST be the root concept with id "root", x: 50, y: 50, and group "center". Other concepts must have an id, label, parent (referencing the parent's id, e.g. "root"), x and y coordinates (numbers between 10 and 90 representing positions on a 2D canvas), and a group name (e.g. "math", "concepts", "applications").
    7. Generate a list of 1-2 weakTopics that this lecture covers, diagnosing typical student struggles. Each topic must have a "topicName", "subject", "aiDiagnosis", and a list of 3 "actionPlan" recommendations.

    Return the result STRICTLY as a JSON object matching the requested schema.
  `;

  let currentDelay = 2000;
  const maxRetries = 5;
  const retryStatusCodes = [429, 500, 502, 503, 504];

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Audio,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                transcript: { type: 'STRING' },
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
                      options: {
                        type: 'ARRAY',
                        items: { type: 'STRING' }
                      },
                      correctAnswer: { type: 'INTEGER' },
                      explanation: { type: 'STRING' }
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation']
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
                      group: { type: 'STRING' }
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
                      actionPlan: {
                        type: 'ARRAY',
                        items: { type: 'STRING' }
                      }
                    },
                    required: ['topicName', 'subject', 'aiDiagnosis', 'actionPlan']
                  }
                }
              },
              required: ['transcript', 'summary', 'notes', 'flashcards', 'quiz', 'keyConcepts', 'weakTopics']
            }
          },
        }),
      });

      if (!response.ok) {
        if (retryStatusCodes.includes(response.status) && attempt <= maxRetries) {
          console.warn(`Gemini API returned status ${response.status}. Retrying in ${currentDelay}ms (attempt ${attempt}/${maxRetries})...`);
          if (onBusy) {
            onBusy(true);
          }
          await delay(currentDelay);
          currentDelay *= 2;
          continue;
        }
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      if (onBusy) {
        onBusy(false);
      }

      const data = await response.json();
      console.log("Raw Gemini response object (data):", data);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log("Raw Gemini response text content (text):", text);

      try {
        const cleanedText = extractJsonObject(text);
        return JSON.parse(cleanedText);
      } catch (err) {
        console.error('Failed to parse Gemini response text as JSON:', data, err);
        throw new Error('Invalid JSON format returned from Gemini API.');
      }
    } catch (error: any) {
      if (onBusy) {
        onBusy(false);
      }
      throw error;
    }
  }
};

export const generateLectureContentFromText = async (
  extractedText: string,
  onBusy?: (isBusy: boolean) => void,
  mode: 'academic' | 'executive' | 'revision' = 'academic'
): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in .env. Please configure VITE_GEMINI_API_KEY.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let promptInstructions = '';

  if (mode === 'executive') {
    promptInstructions = `
    You are an expert executive summary assistant. Analyze the provided lecture text content and perform the following tasks:
    1. Generate a detailed, chronological transcript of the lecture based on the text. Since this is extracted text without timestamps, format the transcript text by prepending bracketed estimated timestamps (e.g. [00:00], [01:15], [02:30]) at the beginning of each major statement or logical paragraph to split the content logically.
    2. Generate a concise professional summary of the lecture in clean Markdown format, focused on major findings, key takeaways, and actionable insights. Keep it between 300 to 600 words.
    3. Generate a list of key detailed notes from the lecture context. Each note must be concise, professional, focused on strategic recommendations, and target a word count of 300-600 words in total. Each note must have a title and content in Markdown structured with the following exact subsections:
       - 📊 **Executive Overview & Major Findings**
       - 📈 **Key Metrics & Bullet Points**
       - 🎯 **Actionable Insights & Deliverables**
       - 🛑 **Strategic Takeaways**
    4. Generate a list of 4 conceptual flashcards from the lecture. Each flashcard must have a question "q" and a detailed answer "a" in Markdown, focused on high-level findings and professional/strategic decisions.
    5. Generate a quiz of 3-4 multiple-choice questions from the lecture. Each question must have a "question", a list of 4 "options", a "correctAnswer" index (0-based), and a detailed conceptual "explanation" targeting executive decision-making and major implications.
    6. Generate a list of 5-7 keyConcepts for a mind map representing the lecture. One concept MUST be the root concept with id "root", x: 50, y: 50, and group "center". Other concepts must have an id, label, parent (referencing the parent's id, e.g. "root"), x and y coordinates (numbers between 10 and 90 representing positions on a 2D canvas), and a group name (e.g. "strategy", "metrics", "findings").
    7. Generate a list of 1-2 weakTopics that this lecture covers, diagnosing typical student struggles. Each topic must have a "topicName", "subject", "aiDiagnosis", and a list of 3 "actionPlan" recommendations.
    `;
  } else if (mode === 'revision') {
    promptInstructions = `
    You are an expert exam revision tutor. Analyze the provided lecture text content and perform the following tasks:
    1. Generate a detailed, chronological transcript of the lecture based on the text. Since this is extracted text without timestamps, format the transcript text by prepending bracketed estimated timestamps (e.g. [00:00], [01:15], [02:30]) at the beginning of each major statement or logical paragraph to split the content logically.
    2. Generate an exam-oriented revision summary of the lecture in clean Markdown format, containing a quick formula sheet, key facts, and common mistakes. Keep it between 200 to 500 words.
    3. Generate a list of key detailed notes from the lecture context. Each note must be high-yield, exam-oriented, focused on memory recall, and target a word count of 200-500 words in total. Each note must have a title and content in Markdown structured with the following exact subsections:
       - 🔑 **Key Facts & Flash Recall Points**
       - 📝 **Exam-Oriented Explanations & Common Mistakes**
       - 💡 **Formula Sheet & Memory Tricks**
       - 🎯 **High-Yield Practice Questions / High-Intensity Review**
    4. Generate a list of 4 conceptual flashcards from the lecture. Each flashcard must have a question "q" and a detailed answer "a" in Markdown, focused on memory tricks, formulas, or high-yield facts.
    5. Generate a quiz of 3-4 multiple-choice questions from the lecture. Each question must have a "question", a list of 4 "options", a "correctAnswer" index (0-based), and a detailed conceptual "explanation" targeting common exam traps and mistakes.
    6. Generate a list of 5-7 keyConcepts for a mind map representing the lecture. One concept MUST be the root concept with id "root", x: 50, y: 50, and group "center". Other concepts must have an id, label, parent (referencing the parent's id, e.g. "root"), x and y coordinates (numbers between 10 and 90 representing positions on a 2D canvas), and a group name (e.g. "formulas", "facts", "recall").
    7. Generate a list of 1-2 weakTopics that this lecture covers, diagnosing typical student struggles. Each topic must have a "topicName", "subject", "aiDiagnosis", and a list of 3 "actionPlan" recommendations.
    `;
  } else {
    promptInstructions = `
    You are an expert academic tutor. Analyze the provided lecture text content and perform the following tasks:
    1. Generate a detailed, chronological transcript of the lecture based on the text. Since this is extracted text without timestamps, format the transcript text by prepending bracketed estimated timestamps (e.g. [00:00], [01:15], [02:30]) at the beginning of each major statement or logical paragraph to split the content logically.
    2. Generate a structured academic summary of the lecture in clean Markdown format (covering main ideas, objectives, examples, analogies, historical context, applications, and formula derivations). Keep it detailed and extensive, targeting 1500+ words in total.
    3. Generate a list of key detailed notes from the lecture context. Each note must be highly detailed, academic, and target a word count of 1500+ words in total across the notes. Each note must have a title and content in Markdown structured with the following exact subsections:
       - 🧠 **Key Terms & Definitions**
       - 📝 **Detailed Explanations & Examples**
       - 💡 **Core Formula or Analogy** (if applicable)
       - 🎯 **Actionable Summary / Study Focus**
    4. Generate a list of 4 conceptual flashcards from the lecture. Each flashcard must have a question "q" and a detailed answer "a" in Markdown, focused on deep understanding and definitions.
    5. Generate a quiz of 3-4 multiple-choice questions from the lecture. Each question must have a "question", a list of 4 "options", a "correctAnswer" index (0-based), and a detailed conceptual "explanation" testing deep concepts and formula derivations.
    6. Generate a list of 5-7 keyConcepts for a mind map representing the lecture. One concept MUST be the root concept with id "root", x: 50, y: 50, and group "center". Other concepts must have an id, label, parent (referencing the parent's id, e.g. "root"), x and y coordinates (numbers between 10 and 90 representing positions on a 2D canvas), and a group name (e.g. "math", "concepts", "applications").
    7. Generate a list of 1-2 weakTopics that this lecture covers, diagnosing typical student struggles. Each topic must have a "topicName", "subject", "aiDiagnosis", and a list of 3 "actionPlan" recommendations.
    `;
  }

  const prompt = `
    ${promptInstructions}

    Text content to analyze:
    ${extractedText}

    Return the result STRICTLY as a JSON object matching the requested schema.
  `;

  let currentDelay = 2000;
  const maxRetries = 5;
  const retryStatusCodes = [429, 500, 502, 503, 504];

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                transcript: { type: 'STRING' },
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
                      options: {
                        type: 'ARRAY',
                        items: { type: 'STRING' }
                      },
                      correctAnswer: { type: 'INTEGER' },
                      explanation: { type: 'STRING' }
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation']
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
                      group: { type: 'STRING' }
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
                      actionPlan: {
                        type: 'ARRAY',
                        items: { type: 'STRING' }
                      }
                    },
                    required: ['topicName', 'subject', 'aiDiagnosis', 'actionPlan']
                  }
                }
              },
              required: ['transcript', 'summary', 'notes', 'flashcards', 'quiz', 'keyConcepts', 'weakTopics']
            }
          },
        }),
      });

      if (!response.ok) {
        if (retryStatusCodes.includes(response.status) && attempt <= maxRetries) {
          console.warn(`Gemini API returned status ${response.status}. Retrying in ${currentDelay}ms (attempt ${attempt}/${maxRetries})...`);
          if (onBusy) {
            onBusy(true);
          }
          await delay(currentDelay);
          currentDelay *= 2;
          continue;
        }
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      if (onBusy) {
        onBusy(false);
      }

      const data = await response.json();
      console.log("Raw Gemini response object (data):", data);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log("Raw Gemini response text content (text):", text);

      try {
        const cleanedText = extractJsonObject(text);
        return JSON.parse(cleanedText);
      } catch (err) {
        console.error('Failed to parse Gemini response text as JSON:', data, err);
        throw new Error('Invalid JSON format returned from Gemini API.');
      }
    } catch (error: any) {
      if (onBusy) {
        onBusy(false);
      }
      throw error;
    }
  }
};

