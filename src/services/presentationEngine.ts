import pptxgen from 'pptxgenjs';
import { SlideBlueprint } from '../types';
import { auth } from '../firebaseConfig';
import { executeGeminiCall } from './gemini';

export interface QualityReport {
  score: number;
  narrativeFlow: number;
  visualDensity: number;
  imageRelevance: number;
  completeness: number;
  redundancy: number;
  citations: number;
}

export const THEME_STYLES: Record<string, {
  bg: string;
  text: string;
  primary: string;
  accent: string;
  cardBg: string;
  fontTitle: string;
  fontBody: string;
}> = {
  academic: { bg: "FDFBF7", text: "1E293B", primary: "64748B", accent: "B5885C", cardBg: "FAF6F0", fontTitle: "Georgia", fontBody: "Arial" },
  corporate: { bg: "FFFFFF", text: "0F172A", primary: "3B82F6", accent: "1D4ED8", cardBg: "F8FAFC", fontTitle: "Arial", fontBody: "Arial" },
  startup: { bg: "09090B", text: "F4F4F5", primary: "A78BFA", accent: "8B5CF6", cardBg: "18181B", fontTitle: "Helvetica", fontBody: "Helvetica" },
  minimal: { bg: "FAFAFA", text: "111111", primary: "737373", accent: "000000", cardBg: "FFFFFF", fontTitle: "Helvetica", fontBody: "Helvetica" },
  glass: { bg: "0B0F19", text: "F3F4F6", primary: "A5F3FC", accent: "06B6D4", cardBg: "1E293B", fontTitle: "Segoe UI", fontBody: "Segoe UI" },
  cyber: { bg: "020204", text: "FFFFFF", primary: "39FF14", accent: "FF007F", cardBg: "0D0E12", fontTitle: "Courier New", fontBody: "Courier New" },
  notebooklm: { bg: "FAF7F2", text: "202020", primary: "606060", accent: "4F46E5", cardBg: "F4EEDF", fontTitle: "Georgia", fontBody: "Arial" },
  gamma: { bg: "0F172A", text: "FFFFFF", primary: "CBD5E1", accent: "F43F5E", cardBg: "1E293B", fontTitle: "Segoe UI", fontBody: "Segoe UI" }
};

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

// Programmatic Slide Diversity Engine (Stage 3)
export function enforceSlideDiversity(slides: SlideBlueprint[]): SlideBlueprint[] {
  const allowedLayouts: SlideBlueprint['slideType'][] = [
    'title', 'hero', 'timeline', 'process', 'comparison', 'architecture', 'hierarchy', 'metrics', 'quote', 'case_study', 'diagram', 'mindmap', 'conclusion'
  ];
  
  const balanced = [...slides];
  let consecutiveCount = 1;
  let prevType = balanced[0]?.slideType;
  
  for (let i = 1; i < balanced.length; i++) {
    if (balanced[i].slideType === prevType) {
      consecutiveCount++;
      if (consecutiveCount > 2) {
        const available = allowedLayouts.filter(l => l !== prevType);
        const fallbackIndex = i % available.length;
        balanced[i].slideType = available[fallbackIndex];
        consecutiveCount = 1;
      }
    } else {
      consecutiveCount = 1;
      prevType = balanced[i].slideType;
    }
  }
  return balanced;
}

// Programmatic Text Overflow Prevention (Stage 4)
export function preventSlideOverflow(slide: SlideBlueprint): SlideBlueprint {
  const titleWords = slide.title.split(/\s+/).filter(Boolean);
  let title = slide.title;
  if (titleWords.length > 20) {
    title = titleWords.slice(0, 20).join(' ') + '...';
  }
  
  let keyPoints = [...slide.keyPoints];
  const totalBodyWords = keyPoints.reduce((acc, kp) => acc + kp.split(/\s+/).filter(Boolean).length, 0);
  
  if (totalBodyWords > 40) {
    const budgetPerPoint = Math.floor(40 / Math.max(1, keyPoints.length));
    keyPoints = keyPoints.map(kp => {
      const kpWords = kp.split(/\s+/).filter(Boolean);
      if (kpWords.length > budgetPerPoint) {
        return kpWords.slice(0, budgetPerPoint).join(' ') + '...';
      }
      return kp;
    });
  }
  
  return {
    ...slide,
    title,
    keyPoints
  };
}

export function getDynamicFontSize(text: string, type: 'title' | 'body'): number {
  const charCount = text.length;
  if (type === 'title') {
    if (charCount > 80) return 18;
    if (charCount > 50) return 24;
    return 30;
  } else {
    if (charCount > 250) return 9.5;
    if (charCount > 150) return 11;
    return 13;
  }
}

// execute call helper inside service
const executeLlmCall = async (
  prompt: string,
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro',
  apiKey: string,
  responseSchema?: any
): Promise<any> => {
  return executeGeminiCall(prompt, apiKey, undefined, responseSchema, undefined, model);
};

// Stage 1 & 2 & 11 presentation blueprint planner with AI Critic pass
export const generatePresentationBlueprint = async (
  transcriptOrNotes: string,
  theme: string,
  length: number,
  purpose: string,
  level: 'quick' | 'balanced' | 'premium',
  apiKey: string
): Promise<SlideBlueprint[]> => {
  const model = level === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

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
            imageQuery: { type: 'STRING' },
            layoutPriority: { type: 'INTEGER' },
            visualImportance: { type: 'STRING' },
            wordLimit: { type: 'INTEGER' },
            designNotes: { type: 'STRING' }
          },
          required: ['slideType', 'title', 'objective', 'keyPoints', 'imageQuery', 'layoutPriority', 'visualImportance', 'wordLimit', 'designNotes']
        }
      }
    },
    required: ['slides']
  };

  const plannerPrompt = `You are Gamma AI and Gemini Presentations.
Your task is NOT to generate slides.
Your task is to design the perfect presentation structure.

Return JSON only.
For each slide provide:
{
  slideType,
  title,
  objective,
  keyPoints,
  imageQuery,
  layoutPriority,
  visualImportance,
  wordLimit,
  designNotes
}

Rules:
- Maximum 30-40 words per slide total in keyPoints body.
- No repeated layouts consecutively (never allow the same slideType more than twice consecutively).
- Supported layouts: 'title', 'hero', 'timeline', 'process', 'comparison', 'architecture', 'hierarchy', 'metrics', 'quote', 'case_study', 'diagram', 'mindmap', 'conclusion'.
- No repeated concepts.
- Strong narrative flow matching the presentation purpose.
- Consulting-grade presentation quality.
- Visual-first slides. Use diagrams when possible, timelines when possible, comparisons when possible, metrics when possible.
- Educational storytelling: slides must teach, explain definitions, core concepts, revision parameters, or startup pitches based on the selected purpose.

Presentation Purpose: ${purpose}
Theme / Design style: ${theme}
Desired Slide Count: ${length} slides

Source Notes / Transcript material:
${transcriptOrNotes.substring(0, 15000)}
`;

  // Pass 1: Planner
  let result = await executeLlmCall(plannerPrompt, model, apiKey, schema);
  let slides: SlideBlueprint[] = result.slides || [];

  // Pass 2: AI Presentation Critic (Mod 3)
  if (level !== 'quick' && slides.length > 0) {
    const criticPrompt = `You are a presentation design expert.
Review this draft presentation blueprint and critique it.
Analyze:
- Repetitive slideTypes (layouts) (never allow the same slideType to appear more than twice consecutively)
- Narrative flow (logical progress)
- Excessive text (keep bullet points extremely concise, max 40 words total)
- Image query specificity (ensure imageQuery is descriptive and unique, e.g. 'isometric database architecture diagram' or 'vintage telescope night sky')
- Missing visual diagrams/timeline opportunities

Return an improved presentation blueprint JSON with the exact same format and keys. Keep the count of slides at exactly ${length}.

Original Draft Blueprint:
${JSON.stringify({ slides })}
`;
    try {
      const criticResult = await executeLlmCall(criticPrompt, model, apiKey, schema);
      if (criticResult.slides && criticResult.slides.length > 0) {
        slides = criticResult.slides;
      }
    } catch (criticErr) {
      console.warn("AI Critic pass failed, using V1 draft blueprint...", criticErr);
    }
  }

  // Programmatic balance & overflow correction
  slides = enforceSlideDiversity(slides);
  slides = slides.map(preventSlideOverflow);

  return slides;
};

// Smart Image Selection (Stage 6)
export const resolveImagesForBlueprint = async (
  slides: SlideBlueprint[],
  searchImagesFunc: (query: string) => Promise<string[]>
): Promise<SlideBlueprint[]> => {
  const usedImageSet = new Set<string>();
  const finalSlides = [...slides];

  for (let i = 0; i < finalSlides.length; i++) {
    const s = finalSlides[i];
    const query = s.imageQuery || s.title || "academic abstract";
    
    // Default fallback based on query context
    const clean = query.toLowerCase();
    let fallbackUrl = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"; // study
    if (clean.includes("tech") || clean.includes("network") || clean.includes("comput") || clean.includes("ai")) {
      fallbackUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80";
    } else if (clean.includes("business") || clean.includes("corporate") || clean.includes("meeting")) {
      fallbackUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80";
    } else if (clean.includes("science") || clean.includes("dna") || clean.includes("microscope")) {
      fallbackUrl = "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80";
    }

    try {
      const urls = await searchImagesFunc(query);
      if (urls && urls.length > 0) {
        let chosen = urls[0];
        // Deduplication pass
        for (const u of urls) {
          if (!usedImageSet.has(u)) {
            chosen = u;
            break;
          }
        }
        usedImageSet.add(chosen);
        s.imageUrl = chosen;
      } else {
        // Fallback checks
        let count = 0;
        let altUrl = fallbackUrl;
        while (usedImageSet.has(altUrl) && count < 5) {
          altUrl = `${fallbackUrl}&sig=${Math.floor(Math.random() * 1000)}`;
          count++;
        }
        usedImageSet.add(altUrl);
        s.imageUrl = altUrl;
      }
    } catch (err) {
      console.error(`Smart image retrieval failed for query "${query}":`, err);
      s.imageUrl = fallbackUrl;
    }
  }

  return finalSlides;
};

// Quality Auditor (Stage 8)
export const calculateQualityScore = (slides: SlideBlueprint[]): QualityReport => {
  if (!slides || slides.length === 0) {
    return { score: 0, narrativeFlow: 0, visualDensity: 0, imageRelevance: 0, completeness: 0, redundancy: 0, citations: 0 };
  }

  // 1. Layout Diversity
  const uniqueLayouts = new Set(slides.map(s => s.slideType));
  const diversityRatio = uniqueLayouts.size / slides.length;
  const narrativeFlow = Math.round(Math.min(100, (diversityRatio * 60) + 40));

  // 2. Visual Density (limit to 40 words)
  let densityViolations = 0;
  slides.forEach(s => {
    const totalWords = s.keyPoints.reduce((acc, kp) => acc + kp.split(/\s+/).filter(Boolean).length, 0);
    if (totalWords > 40) densityViolations++;
  });
  const visualDensity = Math.round(100 - (densityViolations / slides.length) * 80);

  // 3. Image Relevance
  let imageCount = 0;
  slides.forEach(s => {
    if (s.imageQuery && s.imageQuery.length > 5) imageCount++;
  });
  const imageRelevance = Math.round((imageCount / slides.length) * 100);

  // 4. Completeness
  const completeness = Math.min(100, slides.length * 8.5 + 20);

  // 5. Redundancy (layout repetition)
  let repeatCount = 0;
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].slideType === slides[i - 1].slideType) repeatCount++;
  }
  const redundancy = Math.round(100 - (repeatCount / slides.length) * 120);

  // 6. Citations/Objectives
  let objCount = 0;
  slides.forEach(s => {
    if (s.objective && s.objective.length > 10) objCount++;
  });
  const citations = Math.round((objCount / slides.length) * 100);

  const score = Math.round((narrativeFlow + visualDensity + imageRelevance + completeness + redundancy + citations) / 6);

  return {
    score: Math.max(10, Math.min(100, score)),
    narrativeFlow: Math.max(10, Math.min(100, narrativeFlow)),
    visualDensity: Math.max(10, Math.min(100, visualDensity)),
    imageRelevance: Math.max(10, Math.min(100, imageRelevance)),
    completeness: Math.max(10, Math.min(100, completeness)),
    redundancy: Math.max(10, Math.min(100, redundancy)),
    citations: Math.max(10, Math.min(100, citations))
  };
};

// Visual Rendering Engine (Stage 7 & 10)
export const buildAndDownloadPPTX = async (
  slides: SlideBlueprint[],
  deckTitle: string,
  themeName: string
) => {
  const pptx = new pptxgen();
  pptx.title = deckTitle;
  pptx.layout = 'LAYOUT_16x9';

  const colors = THEME_STYLES[themeName] || THEME_STYLES.academic;

  slides.forEach((s, idx) => {
    const slide = pptx.addSlide();
    
    // Render custom backgrounds
    slide.background = { fill: colors.bg };

    // Dynamic Font Scaling
    const titleSize = getDynamicFontSize(s.title, 'title');
    const bodySize = getDynamicFontSize(s.keyPoints.join(' '), 'body');

    // Layout Rendering Engine via native PPT shapes
    if (s.slideType === 'title' || idx === 0) {
      // 1. Accent border
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.2, fill: { color: colors.accent } });
      
      // 2. Large centered title
      slide.addText(s.title, {
        x: 0.5, y: 1.8, w: 9.0, h: 1.5,
        fontSize: titleSize + 2, fontFace: colors.fontTitle,
        color: colors.text, bold: true, align: "center"
      });
      
      // 3. Subtitle / Objective
      slide.addText(s.objective || "Study presentation synthesized by NoteIT AI", {
        x: 0.5, y: 3.5, w: 9.0, h: 0.8,
        fontSize: bodySize + 1, fontFace: colors.fontBody,
        color: colors.primary, align: "center", italic: true
      });

      // Bottom bar decoration
      slide.addShape(pptx.ShapeType.rect, { x: 3.5, y: 4.6, w: 3.0, h: 0.05, fill: { color: colors.accent } });
      
    } else if (s.slideType === 'hero') {
      // Half text on left, image card on right
      slide.addText(s.title, {
        x: 0.5, y: 0.5, w: 4.5, h: 0.8,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });
      
      const bullets = s.keyPoints.map(p => ({ text: p, options: { bullet: true, color: colors.text } }));
      slide.addText(bullets, {
        x: 0.5, y: 1.4, w: 4.5, h: 3.5,
        fontSize: bodySize, fontFace: colors.fontBody,
        color: colors.text, lineSpacing: 18
      });

      if (s.imageUrl) {
        slide.addImage({
          path: s.imageUrl,
          x: 5.3, y: 0.8, w: 4.2, h: 4.0
        });
      }

    } else if (s.slideType === 'timeline') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // Horizontal dashed line
      slide.addShape(pptx.ShapeType.line, {
        x: 1.0, y: 2.6, w: 8.0, h: 0,
        line: { color: colors.accent, width: 3, dashType: 'dash' }
      });

      const steps = s.keyPoints.slice(0, 4);
      const stepWidth = 8.0 / Math.max(1, steps.length);
      
      steps.forEach((stepText, stepIdx) => {
        const xPos = 1.0 + (stepIdx * stepWidth);
        // Stage circle node
        slide.addShape(pptx.ShapeType.ellipse, {
          x: xPos + (stepWidth / 2) - 0.25, y: 2.35, w: 0.5, h: 0.5,
          fill: { color: colors.accent }
        });
        slide.addText(`0${stepIdx + 1}`, {
          x: xPos + (stepWidth / 2) - 0.25, y: 2.35, w: 0.5, h: 0.5,
          fontSize: 12, fontFace: colors.fontBody, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center"
        });
        // Card box
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos + 0.1, y: 1.0, w: stepWidth - 0.2, h: 1.1,
          fill: { color: colors.cardBg }
        });
        slide.addText(`Phase ${stepIdx + 1}`, {
          x: xPos + 0.1, y: 1.1, w: stepWidth - 0.2, h: 0.3,
          fontSize: 10, fontFace: colors.fontTitle, color: colors.accent, bold: true, align: "center"
        });
        // Description
        slide.addText(stepText, {
          x: xPos + 0.1, y: 3.0, w: stepWidth - 0.2, h: 1.8,
          fontSize: bodySize - 1, fontFace: colors.fontBody, color: colors.text, align: "center"
        });
      });

    } else if (s.slideType === 'process') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      const cards = s.keyPoints.slice(0, 3);
      const cardWidth = 2.4;
      const cardHeight = 1.6;
      const spacing = 8.0 / Math.max(1, cards.length);

      cards.forEach((stepText, stepIdx) => {
        const xPos = 1.0 + (stepIdx * spacing) + (spacing / 2 - cardWidth / 2);
        const yPos = 2.0;

        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos, y: yPos, w: cardWidth, h: cardHeight,
          fill: { color: colors.cardBg },
          line: { color: colors.accent, width: 2 }
        });

        slide.addText(`Stage 0${stepIdx + 1}`, {
          x: xPos + 0.1, y: yPos + 0.1, w: cardWidth - 0.2, h: 0.3,
          fontSize: 10, fontFace: colors.fontTitle, color: colors.accent, bold: true, align: "center"
        });

        slide.addText(stepText, {
          x: xPos + 0.1, y: yPos + 0.4, w: cardWidth - 0.2, h: 1.1,
          fontSize: bodySize, fontFace: colors.fontBody, color: colors.text, align: "center", valign: "middle"
        });

        // Connection arrow
        if (stepIdx < cards.length - 1) {
          const arrowStart = xPos + cardWidth;
          const arrowEnd = xPos + spacing;
          slide.addShape(pptx.ShapeType.line, {
            x: arrowStart + 0.15, y: yPos + (cardHeight / 2), w: (arrowEnd - arrowStart) - 0.3, h: 0,
            line: { color: colors.accent, width: 3, endArrowType: 'arrow' }
          });
        }
      });

    } else if (s.slideType === 'comparison') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // Render two side-by-side comparison columns
      const parameterA = s.keyPoints[0] || "Baseline Feature";
      const parameterB = s.keyPoints[1] || "Contrast Model";

      // Column 1
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.4, w: 4.0, h: 3.2,
        fill: { color: colors.cardBg }
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 1.4, w: 4.0, h: 0.5,
        fill: { color: colors.accent }
      });
      slide.addText("CASE A: OVERVIEW", {
        x: 0.8, y: 1.4, w: 4.0, h: 0.5,
        fontSize: 12, fontFace: colors.fontTitle, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center", valign: "middle"
      });
      slide.addText(parameterA, {
        x: 1.0, y: 2.1, w: 3.6, h: 2.3,
        fontSize: bodySize, fontFace: colors.fontBody, color: colors.text
      });

      // Column 2
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 5.2, y: 1.4, w: 4.0, h: 3.2,
        fill: { color: colors.cardBg }
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 5.2, y: 1.4, w: 4.0, h: 0.5,
        fill: { color: colors.primary }
      });
      slide.addText("CASE B: COMPARISON", {
        x: 5.2, y: 1.4, w: 4.0, h: 0.5,
        fontSize: 12, fontFace: colors.fontTitle, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center", valign: "middle"
      });
      slide.addText(parameterB, {
        x: 5.4, y: 2.1, w: 3.6, h: 2.3,
        fontSize: bodySize, fontFace: colors.fontBody, color: colors.text
      });

    } else if (s.slideType === 'architecture') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // Renders layered vertical stack layers (e.g. Client Layer, Service/Logic, DB Layer)
      const layers = s.keyPoints.slice(0, 3);
      const layerTitles = ["Presentation / Interface Layer", "Application Logic & Computing Layer", "Structured Storage & Database Layer"];

      layers.forEach((layerText, layerIdx) => {
        const yPos = 1.3 + (layerIdx * 1.2);
        
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.0, y: yPos, w: 8.0, h: 0.95,
          fill: { color: colors.cardBg },
          line: { color: colors.accent, width: 1.5 }
        });
        // Side block tag
        slide.addShape(pptx.ShapeType.rect, {
          x: 1.0, y: yPos, w: 2.0, h: 0.95,
          fill: { color: colors.accent }
        });
        slide.addText(`0${layerIdx + 1}. Stack`, {
          x: 1.0, y: yPos + 0.1, w: 2.0, h: 0.3,
          fontSize: 9, fontFace: colors.fontTitle, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center"
        });
        slide.addText(layerTitles[layerIdx], {
          x: 1.0, y: yPos + 0.4, w: 2.0, h: 0.4,
          fontSize: 8.5, fontFace: colors.fontBody, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", align: "center", bold: true
        });

        // Layer description
        slide.addText(layerText, {
          x: 3.2, y: yPos + 0.1, w: 5.6, h: 0.75,
          fontSize: bodySize - 1, fontFace: colors.fontBody, color: colors.text, valign: "middle"
        });
      });

    } else if (s.slideType === 'hierarchy') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // Simple tree hierarchy top block + bottom blocks
      // Top Block (Parent)
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 3.8, y: 1.2, w: 2.4, h: 0.9,
        fill: { color: colors.accent }
      });
      slide.addText(s.objective || "Core Concept Root", {
        x: 3.8, y: 1.2, w: 2.4, h: 0.9,
        fontSize: 10, fontFace: colors.fontTitle, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center", valign: "middle"
      });

      // Line connectors
      slide.addShape(pptx.ShapeType.line, { x: 5.0, y: 2.1, w: 0, h: 0.4, line: { color: colors.accent, width: 2 } });
      slide.addShape(pptx.ShapeType.line, { x: 2.3, y: 2.5, w: 5.4, h: 0, line: { color: colors.accent, width: 2 } });
      slide.addShape(pptx.ShapeType.line, { x: 2.3, y: 2.5, w: 0, h: 0.4, line: { color: colors.accent, width: 2 } });
      slide.addShape(pptx.ShapeType.line, { x: 7.7, y: 2.5, w: 0, h: 0.4, line: { color: colors.accent, width: 2 } });

      // Children Blocks
      const children = s.keyPoints.slice(0, 2);
      
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 2.9, w: 3.8, h: 1.6,
        fill: { color: colors.cardBg }, line: { color: colors.accent, width: 1.5 }
      });
      slide.addText(children[0] || "Branch Definition A", {
        x: 0.9, y: 3.0, w: 3.6, h: 1.4,
        fontSize: bodySize - 0.5, fontFace: colors.fontBody, color: colors.text, align: "center", valign: "middle"
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 5.4, y: 2.9, w: 3.8, h: 1.6,
        fill: { color: colors.cardBg }, line: { color: colors.accent, width: 1.5 }
      });
      slide.addText(children[1] || "Branch Definition B", {
        x: 5.5, y: 3.0, w: 3.6, h: 1.4,
        fontSize: bodySize - 0.5, fontFace: colors.fontBody, color: colors.text, align: "center", valign: "middle"
      });

    } else if (s.slideType === 'metrics') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // 3 vertical metric callouts
      const metrics = s.keyPoints.slice(0, 3);
      const cardWidth = 8.8 / Math.max(1, metrics.length);
      const metricNumbers = ["98%", "10x", "5.2M", "1st", "03", "45%"];

      metrics.forEach((m, mIdx) => {
        const xPos = 0.6 + (mIdx * cardWidth);
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos + 0.1, y: 1.3, w: cardWidth - 0.2, h: 3.2,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 1 }
        });
        
        slide.addText(metricNumbers[mIdx % metricNumbers.length], {
          x: xPos + 0.2, y: 1.6, w: cardWidth - 0.4, h: 0.8,
          fontSize: 36, fontFace: colors.fontTitle, color: colors.accent, bold: true, align: "center"
        });

        slide.addText(m, {
          x: xPos + 0.2, y: 2.6, w: cardWidth - 0.4, h: 1.7,
          fontSize: bodySize - 1, fontFace: colors.fontBody, color: colors.text, align: "center"
        });
      });

    } else if (s.slideType === 'quote') {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.0, y: 1.0, w: 8.0, h: 3.6,
        fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
      });
      // Quotation mark decoration
      slide.addText("“", {
        x: 1.2, y: 1.1, w: 1.0, h: 0.8,
        fontSize: 54, fontFace: colors.fontTitle, color: colors.accent, bold: true
      });
      slide.addText(`"${s.keyPoints.join(' ')}"`, {
        x: 1.5, y: 1.8, w: 7.0, h: 2.0,
        fontSize: bodySize + 2, fontFace: colors.fontBody, color: colors.text, italic: true, align: "center", bold: true
      });
      slide.addText(s.title || "Key Objective Quote", {
        x: 1.5, y: 3.9, w: 7.0, h: 0.4,
        fontSize: 10, fontFace: colors.fontTitle, color: colors.accent, align: "right", bold: true
      });

    } else if (s.slideType === 'case_study') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 1.2, w: 1.5, h: 0.35,
        fill: { color: colors.accent }
      });
      slide.addText("CASE STUDY ANALYSIS", {
        x: 0.8, y: 1.2, w: 1.5, h: 0.35,
        fontSize: 8, fontFace: colors.fontTitle, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center", valign: "middle"
      });

      const items = s.keyPoints.slice(0, 2);
      
      // Challenge card
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.7, w: 4.0, h: 2.8,
        fill: { color: colors.cardBg }
      });
      slide.addText("THE CHALLENGE", {
        x: 1.0, y: 1.85, w: 3.6, h: 0.3,
        fontSize: 10, fontFace: colors.fontTitle, color: colors.accent, bold: true
      });
      slide.addText(items[0] || "The primary obstacle in typical implementations.", {
        x: 1.0, y: 2.2, w: 3.6, h: 2.1,
        fontSize: bodySize, fontFace: colors.fontBody, color: colors.text
      });

      // Solution card
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 5.2, y: 1.7, w: 4.0, h: 2.8,
        fill: { color: colors.cardBg }
      });
      slide.addText("THE OUTCOME", {
        x: 5.4, y: 1.85, w: 3.6, h: 0.3,
        fontSize: 10, fontFace: colors.fontTitle, color: colors.primary, bold: true
      });
      slide.addText(items[1] || "The resulting outcomes and resolved milestones.", {
        x: 5.4, y: 2.2, w: 3.6, h: 2.1,
        fontSize: bodySize, fontFace: colors.fontBody, color: colors.text
      });

    } else if (s.slideType === 'diagram') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // Centralized flow diagram shapes
      const boxes = s.keyPoints.slice(0, 3);
      const boxWidth = 2.0;
      const boxHeight = 1.1;
      const spacing = 8.0 / Math.max(1, boxes.length);

      boxes.forEach((boxText, boxIdx) => {
        const xPos = 1.0 + (boxIdx * spacing) + (spacing / 2 - boxWidth / 2);
        const yPos = 2.3;

        slide.addShape(pptx.ShapeType.rect, {
          x: xPos, y: yPos, w: boxWidth, h: boxHeight,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
        });
        slide.addText(boxText, {
          x: xPos + 0.1, y: yPos + 0.1, w: boxWidth - 0.2, h: boxHeight - 0.2,
          fontSize: bodySize - 0.5, fontFace: colors.fontBody, color: colors.text, align: "center", valign: "middle"
        });

        if (boxIdx < boxes.length - 1) {
          const startX = xPos + boxWidth;
          const endX = xPos + spacing;
          slide.addShape(pptx.ShapeType.line, {
            x: startX + 0.1, y: yPos + (boxHeight / 2), w: (endX - startX) - 0.2, h: 0,
            line: { color: colors.accent, width: 2.5, dashType: 'dash', endArrowType: 'arrow' }
          });
        }
      });

    } else if (s.slideType === 'mindmap') {
      slide.addText(s.title, {
        x: 0.5, y: 0.4, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true
      });

      // Centered hub
      const centerCircleX = 5.0 - 0.75;
      const centerCircleY = 2.7 - 0.75;
      slide.addShape(pptx.ShapeType.ellipse, {
        x: centerCircleX, y: centerCircleY, w: 1.5, h: 1.5,
        fill: { color: colors.accent }
      });
      slide.addText(s.title.substring(0, 16), {
        x: centerCircleX + 0.1, y: centerCircleY + 0.1, w: 1.3, h: 1.3,
        fontSize: 10, fontFace: colors.fontTitle, color: colors.bg === "FFFFFF" ? "FFFFFF" : "000000", bold: true, align: "center", valign: "middle"
      });

      // Branch hubs radiating
      const branches = s.keyPoints.slice(0, 4);
      const coordinates = [
        { x: 1.5, y: 1.5, w: 2.2, h: 1.1 },
        { x: 6.3, y: 1.5, w: 2.2, h: 1.1 },
        { x: 1.5, y: 3.5, w: 2.2, h: 1.1 },
        { x: 6.3, y: 3.5, w: 2.2, h: 1.1 }
      ];

      branches.forEach((branchText, bIdx) => {
        const coord = coordinates[bIdx];
        
        // Line connector to center
        const lineEndX = centerCircleX + 0.75;
        const lineEndY = centerCircleY + 0.75;
        const lineStartX = coord.x + (coord.w / 2);
        const lineStartY = coord.y + (coord.h / 2);
        slide.addShape(pptx.ShapeType.line, {
          x: lineStartX, y: lineStartY, w: lineEndX - lineStartX, h: lineEndY - lineStartY,
          line: { color: colors.primary, width: 2 }
        });

        // Branch rounded box
        slide.addShape(pptx.ShapeType.roundRect, {
          x: coord.x, y: coord.y, w: coord.w, h: coord.h,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 1.5 }
        });
        slide.addText(branchText, {
          x: coord.x + 0.1, y: coord.y + 0.1, w: coord.w - 0.2, h: coord.h - 0.2,
          fontSize: bodySize - 1, fontFace: colors.fontBody, color: colors.text, align: "center", valign: "middle"
        });
      });

    } else { // conclusion
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.2, fill: { color: colors.accent } });
      
      slide.addText("Key Conclusions", {
        x: 0.5, y: 0.8, w: 9.0, h: 0.6,
        fontSize: titleSize, fontFace: colors.fontTitle,
        color: colors.accent, bold: true, align: "center"
      });

      const closingPoints = s.keyPoints.map(p => ({ text: p, options: { bullet: true, color: colors.text } }));
      slide.addText(closingPoints, {
        x: 1.5, y: 1.7, w: 7.0, h: 2.6,
        fontSize: bodySize, fontFace: colors.fontBody,
        color: colors.text, lineSpacing: 20
      });

      slide.addText("Synthesized dynamically by NoteIT AI Presentation Architect", {
        x: 0.5, y: 4.8, w: 9.0, h: 0.4,
        fontSize: 10, fontFace: colors.fontBody, color: colors.primary, align: "center", italic: true
      });
    }

    // Footers
    if (s.objective && s.slideType !== 'title' && s.slideType !== 'conclusion') {
      slide.addText(`Objective: ${s.objective}`, {
        x: 0.5, y: 5.15, w: 7.5, h: 0.4,
        fontSize: 9, fontFace: colors.fontBody,
        color: colors.primary, italic: true
      });
    }
    
    slide.addText(`Slide ${idx + 1} of ${slides.length}`, {
      x: 8.2, y: 5.15, w: 1.8, h: 0.4,
      fontSize: 8.5, fontFace: colors.fontBody,
      color: colors.primary, align: "right"
    });
  });

  pptx.writeFile({ fileName: `${deckTitle.replace(/\s+/g, "_")}.pptx` });
};
