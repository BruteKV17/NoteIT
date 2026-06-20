import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  Layout,
  Image as ImageIcon,
  Palette,
  Check,
  AlertCircle,
  HelpCircle,
  FileText,
  BarChart3,
  Layers,
  ChevronDown,
  Trash2,
  Settings,
  Shield
} from 'lucide-react';
import {
  THEME_STYLES,
  calculateQualityScore,
  buildAndDownloadPPTX,
  generatePresentationBlueprint,
  resolveImagesForBlueprint,
  extractJsonObject
} from '../services/presentationEngine';
import { SlideBlueprint } from '../types';
import { searchImages } from '../services/images';

interface PresentationWorkspaceProps {
  theme: 'light' | 'dark';
  apiKey: string;
  contentSourceText: string;
  initialBlueprint?: {
    theme: string;
    purpose: string;
    regenerationLevel: 'quick' | 'balanced' | 'premium';
    qualityScore: number;
    slideCount: number;
    blueprint: SlideBlueprint[];
  };
  title: string;
  onUpdateSlides: (updatedBlueprint: {
    theme: string;
    purpose: string;
    regenerationLevel: 'quick' | 'balanced' | 'premium';
    qualityScore: number;
    slideCount: number;
    blueprint: SlideBlueprint[];
  }) => Promise<void>;
}

const PURPOSES = [
  'Study Notes',
  'Exam Revision',
  'Class Presentation',
  'Seminar',
  'Project Viva',
  'Corporate Presentation',
  'Startup Pitch',
  'Research Paper'
];

const LAYOUTS: SlideBlueprint['slideType'][] = [
  'title', 'hero', 'timeline', 'process', 'comparison', 'architecture', 'hierarchy', 'metrics', 'quote', 'case_study', 'diagram', 'mindmap', 'conclusion'
];

export default function PresentationWorkspace({
  theme,
  apiKey,
  contentSourceText,
  initialBlueprint,
  title,
  onUpdateSlides
}: PresentationWorkspaceProps) {
  // Config state
  const [selectedTheme, setSelectedTheme] = useState<string>(initialBlueprint?.theme || 'academic');
  const [selectedPurpose, setSelectedPurpose] = useState<string>(initialBlueprint?.purpose || 'Study Notes');
  const [regLevel, setRegLevel] = useState<'quick' | 'balanced' | 'premium'>(initialBlueprint?.regenerationLevel || 'balanced');
  const [slideCount, setSlideCount] = useState<number>(initialBlueprint?.slideCount || 10);

  // Slides blueprint array
  const [slides, setSlides] = useState<SlideBlueprint[]>(initialBlueprint?.blueprint || []);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  
  // Specific slide editing states
  const [activeSlideIdx, setActiveSlideIdx] = useState<number | null>(null);
  const [isRefreshingSlide, setIsRefreshingSlide] = useState<Record<number, boolean>>({});
  const [isRefreshingImage, setIsRefreshingImage] = useState<Record<number, boolean>>({});

  // Compute quality reports
  const qualityReport = calculateQualityScore(slides);

  // Auto-generate preview baselines if empty
  useEffect(() => {
    if (slides.length === 0 && contentSourceText) {
      handleRegenerateDeck();
    }
  }, [contentSourceText]);

  // Sync to database on blueprint change
  const saveBlueprintState = async (updatedSlides: SlideBlueprint[]) => {
    setSlides(updatedSlides);
    const scoreReport = calculateQualityScore(updatedSlides);
    await onUpdateSlides({
      theme: selectedTheme,
      purpose: selectedPurpose,
      regenerationLevel: regLevel,
      qualityScore: scoreReport.score,
      slideCount: updatedSlides.length,
      blueprint: updatedSlides
    });
  };

  // Stage 1 & 2 & 11: Complete blueprint planner pipeline
  const handleRegenerateDeck = async () => {
    if (!contentSourceText) return;
    setIsGenerating(true);
    setStatusMsg(
      regLevel === 'premium' 
        ? 'Activating Gemini Pro for Gamma-quality synthesis (30-60s)...' 
        : regLevel === 'balanced' 
          ? 'Planning layouts & structural balance (15s)...' 
          : 'Generating rapid draft blueprint (5s)...'
    );

    try {
      // 1. Generate blueprint
      const plannedSlides = await generatePresentationBlueprint(
        contentSourceText,
        selectedTheme,
        slideCount,
        selectedPurpose,
        regLevel,
        apiKey
      );

      setStatusMsg('Retrieving stock illustrations & resolving duplicates...');

      // 2. Fetch images
      const resolvedSlides = await resolveImagesForBlueprint(plannedSlides, searchImages);

      // 3. Save
      await saveBlueprintState(resolvedSlides);
      setStatusMsg('');
    } catch (err: any) {
      console.error("Presentation generation pipeline failed:", err);
      setStatusMsg(`Generation failed: ${err.message || err}`);
      
      // Local fallback slide builder on error
      if (slides.length === 0) {
        const fallbacks: SlideBlueprint[] = [];
        fallbacks.push({
          slideType: 'title',
          title: title,
          objective: 'Presentation summary',
          keyPoints: ['Comprehensive presentation baseline', 'Generated dynamically from notes'],
          imageQuery: 'education',
          layoutPriority: 1,
          visualImportance: 'high',
          wordLimit: 40,
          designNotes: 'Title presentation style'
        });
        for (let i = 1; i < slideCount; i++) {
          const lType = LAYOUTS[i % LAYOUTS.length];
          fallbacks.push({
            slideType: lType,
            title: `Topic Module 0${i}`,
            objective: `Explaining core parameters of section ${i}`,
            keyPoints: [`Key concept definitions and guidelines`, `Actionable study references`],
            imageQuery: 'study',
            layoutPriority: 2,
            visualImportance: 'medium',
            wordLimit: 40,
            designNotes: `Dynamic theme rendering layout: ${lType}`
          });
        }
        const resolved = await resolveImagesForBlueprint(fallbacks, searchImages);
        await saveBlueprintState(resolved);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Stage 9: Single-slide content refresh
  const handleRefreshSlideContent = async (idx: number) => {
    const slide = slides[idx];
    if (!slide) return;
    
    setIsRefreshingSlide(prev => ({ ...prev, [idx]: true }));
    try {
      const model = regLevel === 'premium' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      const prompt = `You are Gamma AI and Gemini Presentations.
Regenerate a single slide about the topic "${slide.title}" for a "${selectedPurpose}" presentation.
Keep total body word count strictly under 40 words.
Formulate clear definitions, exam review parameters, or startup pitch notes based on the purpose.

Original Slide Objective: ${slide.objective}
Source context material:
${contentSourceText.substring(0, 6000)}

Return JSON only matching this schema:
{
  "title": "A short, engaging slide title (max 20 words)",
  "objective": "The main objective of this slide",
  "keyPoints": ["concise bullet point 1", "concise bullet point 2", "concise bullet point 3"],
  "imageQuery": "A specific Stock Photo search query",
  "designNotes": "Specific styling layout suggestions"
}
`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                objective: { type: 'STRING' },
                keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
                imageQuery: { type: 'STRING' },
                designNotes: { type: 'STRING' }
              },
              required: ['title', 'objective', 'keyPoints', 'imageQuery', 'designNotes']
            }
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = extractJsonObject(text);
        const parsed = JSON.parse(cleaned);

        const updatedSlides = [...slides];
        updatedSlides[idx] = {
          ...slide,
          title: parsed.title,
          objective: parsed.objective,
          keyPoints: parsed.keyPoints,
          imageQuery: parsed.imageQuery,
          designNotes: parsed.designNotes
        };
        // Fetch new image for the regenerated query
        const resolved = await resolveImagesForBlueprint([updatedSlides[idx]], searchImages);
        updatedSlides[idx] = resolved[0];
        await saveBlueprintState(updatedSlides);
      }
    } catch (err) {
      console.error("Single slide regeneration failed:", err);
    } finally {
      setIsRefreshingSlide(prev => ({ ...prev, [idx]: false }));
    }
  };

  // Stage 9: Single-slide image refresh
  const handleRefreshSlideImage = async (idx: number) => {
    const slide = slides[idx];
    if (!slide) return;
    setIsRefreshingImage(prev => ({ ...prev, [idx]: true }));
    try {
      const query = slide.imageQuery || slide.title || "academic design";
      const urls = await searchImages(query);
      if (urls && urls.length > 0) {
        // Find next image in list to avoid duplicates
        const currentIndex = urls.indexOf(slide.imageUrl || '');
        const nextIndex = (currentIndex + 1) % urls.length;
        const nextUrl = urls[nextIndex] || urls[0];

        const updatedSlides = [...slides];
        updatedSlides[idx] = { ...slide, imageUrl: nextUrl };
        await saveBlueprintState(updatedSlides);
      }
    } catch (err) {
      console.error("Image rotation failed:", err);
    } finally {
      setIsRefreshingImage(prev => ({ ...prev, [idx]: false }));
    }
  };

  // Stage 9: Change single slide layout
  const handleChangeSlideLayout = async (idx: number, newLayout: SlideBlueprint['slideType']) => {
    const updatedSlides = [...slides];
    updatedSlides[idx] = { ...updatedSlides[idx], slideType: newLayout };
    await saveBlueprintState(updatedSlides);
  };

  // Export handling
  const handleExportPPT = async () => {
    await buildAndDownloadPPTX(slides, title, selectedTheme);
  };

  const activeThemeColors = THEME_STYLES[selectedTheme] || THEME_STYLES.academic;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in w-full text-left">
      {/* LEFT 3 COLUMNS: MAIN PREVIEW WORKSPACE */}
      <div className="xl:col-span-3 space-y-4 max-h-[520px] overflow-y-auto pr-2">
        <div className="flex items-center justify-between bg-neutral-900/30 p-3 rounded-xl border border-neutral-900/60 backdrop-blur-xs">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">
              Presentation Blueprint Editor
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Render slides on the fly with premium HSL themes & visual shapes.
            </p>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        {slides.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-850 rounded-2xl bg-neutral-950/20">
            <AlertCircle className="h-8 w-8 text-neutral-600 mx-auto animate-pulse" />
            <p className="text-xs text-neutral-450 mt-3 font-mono">No presentation blueprint created. Press "Regenerate" to build.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slides.map((slide, idx) => {
              const themeBg = activeThemeColors.bg === "FFFFFF" ? "bg-white" : "bg-[#0b0f19]";
              const cardBorder = activeThemeColors.bg === "FFFFFF" ? "border-gray-200" : "border-neutral-850";
              const textPrimary = activeThemeColors.bg === "FFFFFF" ? "text-gray-900" : "text-white";
              const textSecondary = activeThemeColors.bg === "FFFFFF" ? "text-gray-600" : "text-neutral-450";

              return (
                <div
                  key={idx}
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${themeBg} ${cardBorder} ${
                    activeSlideIdx === idx ? 'ring-2 ring-indigo-500' : 'hover:scale-[1.01]'
                  }`}
                >
                  {/* Theme Accent Border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: `#${activeThemeColors.accent}` }}
                  />

                  {/* Slide header metadata bar */}
                  <div className="flex justify-between items-center pb-3.5 border-b border-neutral-900/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase">
                        Slide {idx + 1}
                      </span>
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/15 uppercase capitalize">
                        {slide.slideType}
                      </span>
                    </div>

                    {/* Micro action buttons */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {/* Layout Picker Dropdown */}
                      <div className="relative group">
                        <button className="h-6 px-2 text-[9px] font-bold border border-neutral-800 rounded bg-neutral-950/60 hover:bg-neutral-900 text-neutral-400 flex items-center gap-1 cursor-pointer">
                          <Layout className="h-2.5 w-2.5" />
                          <span>Layout</span>
                          <ChevronDown className="h-2.5 w-2.5" />
                        </button>
                        <div className="absolute right-0 mt-1 w-36 bg-neutral-950 border border-neutral-850 rounded-lg shadow-xl hidden group-hover:block z-20 p-1">
                          {LAYOUTS.map(l => (
                            <button
                              key={l}
                              onClick={() => handleChangeSlideLayout(idx, l)}
                              className="w-full text-left px-2 py-1.5 text-[9px] font-bold text-neutral-400 hover:text-white hover:bg-neutral-900 rounded capitalize cursor-pointer"
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Refresh Content */}
                      <button
                        onClick={() => handleRefreshSlideContent(idx)}
                        disabled={isRefreshingSlide[idx]}
                        className="h-6 w-6 flex items-center justify-center border border-neutral-800 rounded bg-neutral-950/60 hover:bg-neutral-900 text-neutral-400 cursor-pointer disabled:opacity-40"
                        title="Regenerate Slide Content"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${isRefreshingSlide[idx] ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Refresh Image (if visual) */}
                      {['hero', 'split_column', 'comparison', 'case_study'].includes(slide.slideType) && (
                        <button
                          onClick={() => handleRefreshSlideImage(idx)}
                          disabled={isRefreshingImage[idx]}
                          className="h-6 w-6 flex items-center justify-center border border-neutral-800 rounded bg-neutral-950/60 hover:bg-neutral-900 text-neutral-400 cursor-pointer disabled:opacity-40"
                          title="Rotate Image"
                        >
                          <ImageIcon className={`h-2.5 w-2.5 ${isRefreshingImage[idx] ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Layout Previews in Slide Card Workspace */}
                  <div className="mt-4 flex flex-col md:flex-row gap-5">
                    {/* Slide Text Content */}
                    <div className="flex-1 space-y-2">
                      <h4 className={`text-sm font-black font-sans leading-snug ${textPrimary}`}>{slide.title}</h4>
                      
                      {slide.slideType === 'quote' ? (
                        <p className="text-xs italic text-neutral-400 border-l-2 border-indigo-500 pl-3.5 my-3">
                          "{slide.keyPoints.join(' ')}"
                        </p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-400 font-sans">
                          {slide.keyPoints.map((bp, bidx) => (
                            <li key={bidx} className="leading-relaxed">{bp}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Graphic shape preview blocks based on Slide Types */}
                    <div className="w-full md:w-56 flex-shrink-0 flex items-center justify-center bg-neutral-950/40 border border-neutral-900/60 rounded-xl p-3 h-28 relative overflow-hidden">
                      
                      {/* Image Query overlay tag */}
                      {slide.imageUrl && ['hero', 'split_column', 'comparison', 'case_study'].includes(slide.slideType) ? (
                        <>
                          <img src={slide.imageUrl} alt={slide.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                            <span className="text-[7px] font-mono font-bold text-white uppercase truncate w-full">
                              🔍 {slide.imageQuery || slide.title}
                            </span>
                          </div>
                        </>
                      ) : slide.slideType === 'timeline' ? (
                        <div className="w-full space-y-2">
                          <div className="relative h-0.5 w-full bg-indigo-500/30 flex justify-between items-center">
                            {[1, 2, 3].map(n => (
                              <div key={n} className="h-3 w-3 rounded-full bg-indigo-500 border border-[#0b0f19] flex items-center justify-center text-[5px] font-bold text-white">
                                {n}
                              </div>
                            ))}
                          </div>
                          <span className="text-[7.5px] text-neutral-500 font-mono block text-center uppercase">Timeline layout</span>
                        </div>
                      ) : slide.slideType === 'process' ? (
                        <div className="w-full flex items-center justify-between gap-1">
                          {[1, 2, 3].map(n => (
                            <React.Fragment key={n}>
                              <div className="flex-1 p-1 py-2 text-[7px] font-bold text-center border border-indigo-500/20 bg-indigo-500/5 rounded">
                                Stage {n}
                              </div>
                              {n < 3 && <span className="text-[8px] text-indigo-500">→</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : slide.slideType === 'metrics' ? (
                        <div className="w-full flex gap-1.5 justify-center">
                          {["98%", "10x", "5.2M"].map((num, n) => (
                            <div key={n} className="flex-1 p-1 bg-neutral-900 border border-neutral-850 rounded text-center">
                              <span className="text-[10px] font-bold text-indigo-400 block">{num}</span>
                              <span className="text-[5px] text-neutral-500 uppercase block">Metric</span>
                            </div>
                          ))}
                        </div>
                      ) : slide.slideType === 'quote' ? (
                        <div className="text-center font-serif italic text-[18px] text-indigo-400">
                          “ Quote Layout ”
                        </div>
                      ) : slide.slideType === 'architecture' ? (
                        <div className="w-full space-y-1 font-mono text-[7px]">
                          <div className="p-1 text-center bg-indigo-500/10 border border-indigo-500/20 rounded font-bold text-indigo-400">UI Presentation Layer</div>
                          <div className="p-1 text-center bg-teal-500/10 border border-teal-500/20 rounded font-bold text-teal-400">Application Logic</div>
                          <div className="p-1 text-center bg-orange-500/10 border border-orange-500/20 rounded font-bold text-orange-400">DB Storage Layer</div>
                        </div>
                      ) : slide.slideType === 'hierarchy' ? (
                        <div className="w-full flex flex-col items-center gap-2">
                          <div className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 rounded text-[7px] font-bold">Root Anchor</div>
                          <div className="w-24 h-0.5 bg-indigo-500/30 relative flex justify-between">
                            <div className="absolute top-0 left-0 h-1.5 w-0.5 bg-indigo-500" />
                            <div className="absolute top-0 right-0 h-1.5 w-0.5 bg-indigo-500" />
                          </div>
                          <div className="flex gap-2">
                            <div className="px-1 py-0.5 bg-neutral-900 border border-neutral-850 rounded text-[6px]">Node A</div>
                            <div className="px-1 py-0.5 bg-neutral-900 border border-neutral-850 rounded text-[6px]">Node B</div>
                          </div>
                        </div>
                      ) : slide.slideType === 'diagram' ? (
                        <div className="w-full flex items-center justify-center gap-2">
                          <div className="h-6 w-12 rounded bg-neutral-900 border border-indigo-500/30 flex items-center justify-center text-[7px]">Node 1</div>
                          <span className="text-neutral-500">→</span>
                          <div className="h-6 w-12 rounded bg-neutral-900 border border-indigo-500/30 flex items-center justify-center text-[7px]">Node 2</div>
                        </div>
                      ) : slide.slideType === 'mindmap' ? (
                        <div className="relative h-16 w-16 flex items-center justify-center">
                          <div className="h-5 w-5 rounded-full bg-indigo-600 border border-[#0b0f19] z-10 flex items-center justify-center text-[5px] font-bold">HUB</div>
                          <div className="absolute top-0 left-0 h-3 w-3 rounded-full bg-neutral-800" />
                          <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-neutral-800" />
                          <div className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-neutral-800" />
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-neutral-800" />
                        </div>
                      ) : (
                        <div className="text-[8px] font-mono text-neutral-600 uppercase text-center">
                          No Graphic Preview Required
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Speaker notes and references footer */}
                  <div className="mt-4 pt-3 border-t border-neutral-900/10 flex flex-col gap-1.5 text-[9.5px] text-neutral-500 font-sans">
                    <div>
                      <strong className="text-indigo-400">Speaker Notes:</strong> {slide.objective}
                    </div>
                    {slide.designNotes && (
                      <div>
                        <strong className="text-indigo-400">Design Layout advice:</strong> {slide.designNotes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT 1 COLUMN: SIDEBAR CONFIGS & QUALITY SCORE METRICS */}
      <div className={`p-4 rounded-2xl border space-y-5 flex flex-col justify-between h-[520px] ${
        theme === 'dark' ? 'bg-[#0d0e12]/60 border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="space-y-4 flex-1 overflow-y-auto pr-1.5 scrollbar-thin">
          <h4 className="text-[10px] font-black text-indigo-400 font-mono uppercase tracking-wider">
            Presentation Settings
          </h4>

          {/* Quality Circle callout */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-900/60">
            <div className="relative h-12 w-12 flex items-center justify-center rounded-full border border-indigo-500/35 bg-indigo-500/5">
              <div className="text-center">
                <span className="text-xs font-black text-indigo-400">{qualityReport.score}</span>
                <span className="text-[5px] text-neutral-500 block uppercase font-mono leading-none mt-0.5">Grade</span>
              </div>
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="text-[8px] font-bold text-neutral-500 uppercase font-mono">Design Audit Score</span>
              <div className="text-[10.5px] font-extrabold text-neutral-200">
                {qualityReport.score >= 85 ? '🌟 PREMIUM DESIGN' : qualityReport.score >= 70 ? '👍 STANDARDS MET' : '⚠️ TUNING REQUIRED'}
              </div>
            </div>
          </div>

          {/* Quality Audit scores list */}
          <div className="space-y-2 border-b border-neutral-900/60 pb-4">
            {[
              { label: 'Narrative Flow', val: qualityReport.narrativeFlow },
              { label: 'Visual Density', val: qualityReport.visualDensity },
              { label: 'Image Relevance', val: qualityReport.imageRelevance },
              { label: 'Completeness', val: qualityReport.completeness },
              { label: 'Redundancy Check', val: qualityReport.redundancy }
            ].map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold font-mono">
                  <span className="text-neutral-500 uppercase">{item.label}</span>
                  <span className="text-indigo-400">{item.val}/100</span>
                </div>
                <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-550 rounded-full transition-all duration-500"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Presentation Purpose dropdown (Mod 4) */}
          <div>
            <label className="block text-[8.5px] font-bold text-neutral-500 uppercase font-mono mb-1.5">
              Presentation Purpose
            </label>
            <div className="relative">
              <select
                value={selectedPurpose}
                onChange={e => setSelectedPurpose(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 text-[10.5px] font-bold px-3 py-2 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500"
              >
                {PURPOSES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-neutral-450 pointer-events-none" />
            </div>
          </div>

          {/* Presentation Length selector */}
          <div>
            <label className="block text-[8.5px] font-bold text-neutral-500 uppercase font-mono mb-1.5">
              Deck Slide Count
            </label>
            <div className="flex gap-1.5">
              {([5, 10, 15] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setSlideCount(l)}
                  className={`flex-1 py-1 px-1.5 rounded-lg border text-[9.5px] font-extrabold cursor-pointer transition-all ${
                    slideCount === l
                      ? 'bg-indigo-650 text-white border-indigo-500 shadow-md'
                      : 'bg-transparent border-neutral-900 text-neutral-450 hover:border-neutral-800'
                  }`}
                >
                  {l} Slides
                </button>
              ))}
            </div>
          </div>

          {/* Presentation Regeneration Levels (Mod 2) */}
          <div>
            <label className="block text-[8.5px] font-bold text-neutral-500 uppercase font-mono mb-1.5">
              Regeneration Strategy
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['quick', 'balanced', 'premium'] as const).map(levelName => (
                <button
                  key={levelName}
                  onClick={() => setRegLevel(levelName)}
                  className={`py-1.5 text-[8.5px] rounded-lg border font-bold capitalize cursor-pointer transition-all ${
                    regLevel === levelName
                      ? 'bg-indigo-650 text-white border-indigo-500 shadow-md'
                      : 'bg-transparent border-neutral-900 text-neutral-450 hover:border-neutral-800'
                  }`}
                >
                  {levelName === 'premium' ? 'Premium Pro' : levelName}
                </button>
              ))}
            </div>
            <span className="text-[7.5px] text-neutral-500 font-mono block mt-1.5">
              {regLevel === 'premium' 
                ? '⚡ Uses Gemini Pro + AI Critic Pass for Gamma-level slides (30-60s)' 
                : regLevel === 'balanced' 
                  ? '⚡ Planner + AI Critic Pass using Gemini Flash (15s)' 
                  : '⚡ Rapid layout blueprint directly mapped (5s)'}
            </span>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-[8.5px] font-bold text-neutral-500 uppercase font-mono mb-1.5">
              Premium HSL Color Theme
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.keys(THEME_STYLES).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTheme(t)}
                  className={`h-8.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 cursor-pointer capitalize transition-all ${
                    selectedTheme === t
                      ? 'bg-indigo-650 border-indigo-500 text-white font-extrabold'
                      : 'bg-transparent border-neutral-900 text-neutral-450 hover:border-neutral-800'
                  }`}
                  title={`${t} mode palette`}
                >
                  <span className="text-[8px] truncate max-w-full px-0.5">{t}</span>
                  <div className="flex gap-0.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `#${THEME_STYLES[t].accent}` }} />
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `#${THEME_STYLES[t].primary}` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Action Triggers */}
        <div className="space-y-1.5 pt-4 border-t border-neutral-900/60">
          <button
            onClick={handleRegenerateDeck}
            disabled={isGenerating}
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 active:scale-98 transition-all text-white text-[10px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-200" />
            <span>Regenerate Deck Blueprint</span>
          </button>
          
          <button
            onClick={handleExportPPT}
            disabled={slides.length === 0}
            className="w-full py-2.5 bg-white text-black hover:bg-neutral-100 disabled:opacity-40 active:scale-98 transition-all text-[10px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
          >
            <Download className="h-3.5 w-3.5 text-black" />
            <span>Download PPTX File</span>
          </button>
        </div>
      </div>
    </div>
  );
}
