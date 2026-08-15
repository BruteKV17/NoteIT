import React, { useState, useEffect } from 'react';
import { fetchGeminiApi } from '../providers/GeminiProvider';
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
      const model = 'gemini-3.6-flash';
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
      const bodyObj = {
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
      };
      const res = await fetchGeminiApi(apiKey, model, bodyObj);

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
        <div className="flex items-center justify-between bg-[#F6F2EA] p-3.5 rounded-[6px] border border-[#111111] shadow-paper-sm">
          <div>
            <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#111111]" />
              Presentation Blueprint Editor
            </h3>
            <p className="text-[10px] text-[#666666] font-mono mt-0.5">
              Render slides on the fly with Bauhaus paper themes & visual shapes.
            </p>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 text-[10px] text-[#111111] font-bold font-mono bg-[#FFC400] px-3 py-1 rounded-[4px] border border-[#111111] shadow-paper-sm">
              <RefreshCw className="h-3 w-3 animate-spin text-[#111111]" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        {slides.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#111111] rounded-[6px] bg-white p-6 shadow-paper-sm">
            <AlertCircle className="h-8 w-8 text-[#666666] mx-auto animate-pulse" />
            <p className="text-xs text-[#111111] mt-3 font-mono font-bold">No presentation blueprint created. Press "Regenerate Deck Blueprint" to build.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slides.map((slide, idx) => {
              return (
                <div
                  key={idx}
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`p-5 rounded-[6px] border border-[#111111] bg-white text-[#111111] shadow-paper-sm transition-all relative overflow-hidden cursor-pointer ${
                    activeSlideIdx === idx ? 'ring-2 ring-[#FFC400]' : 'hover:bg-[#FFF8D6]/30'
                  }`}
                >
                  {/* Theme Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FFC400]" />

                  {/* Slide header metadata bar */}
                  <div className="flex justify-between items-center pb-3 border-b border-[#111111] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-[4px] bg-[#FFC400] text-[#111111] border border-[#111111] uppercase shadow-paper-sm">
                        SLIDE #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-[4px] bg-white text-[#111111] border border-[#111111] uppercase shadow-paper-sm capitalize">
                        {slide.slideType}
                      </span>
                    </div>

                    {/* Micro action buttons */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {/* Layout Picker Dropdown */}
                      <div className="relative group">
                        <button className="h-7 px-2.5 text-[10px] font-mono font-bold border border-[#111111] rounded-[4px] bg-[#F6F2EA] hover:bg-[#FFC400] text-[#111111] flex items-center gap-1 cursor-pointer shadow-paper-sm">
                          <Layout className="h-3 w-3" />
                          <span>Layout</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white border-2 border-[#111111] rounded-[6px] shadow-paper-md hidden group-hover:block z-20 p-1">
                          {LAYOUTS.map(l => (
                            <button
                              key={l}
                              onClick={() => handleChangeSlideLayout(idx, l)}
                              className="w-full text-left px-2.5 py-1.5 text-[10px] font-mono font-bold text-[#111111] hover:bg-[#FFC400] rounded-[3px] capitalize cursor-pointer"
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
                        className="h-7 w-7 flex items-center justify-center border border-[#111111] rounded-[4px] bg-[#F6F2EA] hover:bg-[#FFC400] text-[#111111] cursor-pointer shadow-paper-sm disabled:opacity-40"
                        title="Regenerate Slide Content"
                      >
                        <RefreshCw className={`h-3 w-3 ${isRefreshingSlide[idx] ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Refresh Image (if visual) */}
                      {['hero', 'split_column', 'comparison', 'case_study'].includes(slide.slideType) && (
                        <button
                          onClick={() => handleRefreshSlideImage(idx)}
                          disabled={isRefreshingImage[idx]}
                          className="h-7 w-7 flex items-center justify-center border border-[#111111] rounded-[4px] bg-[#F6F2EA] hover:bg-[#FFC400] text-[#111111] cursor-pointer shadow-paper-sm disabled:opacity-40"
                          title="Rotate Image"
                        >
                          <ImageIcon className={`h-3 w-3 ${isRefreshingImage[idx] ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Layout Previews in Slide Card Workspace */}
                  <div className="mt-3 flex flex-col md:flex-row gap-4">
                    {/* Slide Text Content */}
                    <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-heading font-extrabold text-[#111111] leading-snug">{slide.title}</h4>
                      
                      {slide.slideType === 'quote' ? (
                        <p className="text-xs italic text-[#111111] border-l-4 border-[#FFC400] pl-3.5 my-3 bg-[#FFF8D6] p-2 rounded-[4px]">
                          "{slide.keyPoints.join(' ')}"
                        </p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-xs text-[#111111] font-sans">
                          {slide.keyPoints.map((bp, bidx) => (
                            <li key={bidx} className="leading-relaxed">{bp}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Graphic shape preview blocks based on Slide Types */}
                    <div className="w-full md:w-56 flex-shrink-0 flex items-center justify-center bg-[#F6F2EA] border border-[#111111] rounded-[6px] p-3 h-28 relative overflow-hidden shadow-paper-sm">
                      
                      {/* Image Query overlay tag */}
                      {slide.imageUrl && ['hero', 'split_column', 'comparison', 'case_study'].includes(slide.slideType) ? (
                        <>
                          <img src={slide.imageUrl} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                            <span className="text-[8px] font-mono font-bold text-white uppercase truncate w-full">
                              🔍 {slide.imageQuery || slide.title}
                            </span>
                          </div>
                        </>
                      ) : slide.slideType === 'timeline' ? (
                        <div className="w-full space-y-2">
                          <div className="relative h-1 w-full bg-[#111111] flex justify-between items-center">
                            {[1, 2, 3].map(n => (
                              <div key={n} className="h-4 w-4 rounded-full bg-[#FFC400] border border-[#111111] flex items-center justify-center text-[7px] font-bold text-[#111111]">
                                {n}
                              </div>
                            ))}
                          </div>
                          <span className="text-[8px] text-[#111111] font-mono font-bold block text-center uppercase">Timeline layout</span>
                        </div>
                      ) : slide.slideType === 'quote' ? (
                        <div className="text-center font-serif italic text-base font-bold text-[#111111]">
                          “ Quote ”
                        </div>
                      ) : slide.slideType === 'architecture' ? (
                        <div className="w-full space-y-1 font-mono text-[7px]">
                          <div className="p-1 text-center bg-[#FFC400] border border-[#111111] rounded-[3px] font-bold text-[#111111]">UI Layer</div>
                          <div className="p-1 text-center bg-[#2F6BFF] border border-[#111111] rounded-[3px] font-bold text-white">App Logic</div>
                          <div className="p-1 text-center bg-[#FF4D4D] border border-[#111111] rounded-[3px] font-bold text-white">DB Storage</div>
                        </div>
                      ) : slide.slideType === 'hierarchy' ? (
                        <div className="w-full flex flex-col items-center gap-1.5">
                          <div className="px-2 py-0.5 bg-[#FFC400] border border-[#111111] rounded-[3px] text-[7px] font-bold text-[#111111]">Root Anchor</div>
                          <div className="w-20 h-0.5 bg-[#111111] relative flex justify-between">
                            <div className="absolute top-0 left-0 h-1.5 w-0.5 bg-[#111111]" />
                            <div className="absolute top-0 right-0 h-1.5 w-0.5 bg-[#111111]" />
                          </div>
                          <div className="flex gap-2">
                            <div className="px-1.5 py-0.5 bg-white border border-[#111111] rounded-[3px] text-[6px] font-bold">Node A</div>
                            <div className="px-1.5 py-0.5 bg-white border border-[#111111] rounded-[3px] text-[6px] font-bold">Node B</div>
                          </div>
                        </div>
                      ) : slide.slideType === 'diagram' ? (
                        <div className="w-full flex items-center justify-center gap-2">
                          <div className="h-6 w-12 rounded-[3px] bg-white border border-[#111111] flex items-center justify-center text-[7px] font-bold">Node 1</div>
                          <span className="text-[#111111] font-bold">→</span>
                          <div className="h-6 w-12 rounded-[3px] bg-[#FFC400] border border-[#111111] flex items-center justify-center text-[7px] font-bold">Node 2</div>
                        </div>
                      ) : slide.slideType === 'mindmap' ? (
                        <div className="relative h-16 w-16 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full bg-[#FFC400] border border-[#111111] z-10 flex items-center justify-center text-[6px] font-bold text-[#111111]">HUB</div>
                          <div className="absolute top-0 left-0 h-3.5 w-3.5 rounded-full bg-white border border-[#111111]" />
                          <div className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-white border border-[#111111]" />
                          <div className="absolute bottom-0 left-0 h-3.5 w-3.5 rounded-full bg-white border border-[#111111]" />
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-white border border-[#111111]" />
                        </div>
                      ) : (
                        <div className="text-[8px] font-mono text-[#666666] font-bold uppercase text-center">
                          Visual Layout
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Speaker notes and references footer */}
                  <div className="mt-3 pt-2.5 border-t border-dashed border-[#111111] flex flex-col gap-1 text-[10px] text-[#666666] font-mono">
                    <div>
                      <strong className="text-[#111111] font-bold">Speaker Notes:</strong> {slide.objective}
                    </div>
                    {slide.designNotes && (
                      <div>
                        <strong className="text-[#111111] font-bold">Layout Notes:</strong> {slide.designNotes}
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
      <div className="p-4.5 rounded-[6px] border border-[#111111] bg-[#F6F2EA] text-[#111111] shadow-paper-sm space-y-4 flex flex-col justify-between h-[520px]">
        <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <h4 className="text-[10px] font-mono font-extrabold text-[#111111] uppercase tracking-wider border-b border-[#111111] pb-1.5">
            DECK CONFIGURATOR
          </h4>

          {/* Quality Circle callout */}
          <div className="flex items-center gap-3.5 p-3 rounded-[6px] bg-white border border-[#111111] shadow-paper-sm">
            <div className="relative h-11 w-11 flex items-center justify-center rounded-full border border-[#111111] bg-[#FFC400] shrink-0">
              <div className="text-center">
                <span className="text-xs font-mono font-extrabold text-[#111111]">{qualityReport.score}</span>
              </div>
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="text-[8px] font-bold text-[#666666] uppercase font-mono">Design Audit Score</span>
              <div className="text-xs font-extrabold text-[#111111] font-mono">
                {qualityReport.score >= 85 ? '🌟 PREMIUM DESIGN' : qualityReport.score >= 70 ? '👍 STANDARDS MET' : '⚠️ TUNING REQUIRED'}
              </div>
            </div>
          </div>

          {/* Quality Audit scores list */}
          <div className="space-y-2 border-b border-[#111111] pb-3">
            {[
              { label: 'Narrative Flow', val: qualityReport.narrativeFlow },
              { label: 'Visual Density', val: qualityReport.visualDensity },
              { label: 'Image Relevance', val: qualityReport.imageRelevance },
              { label: 'Completeness', val: qualityReport.completeness },
              { label: 'Redundancy Check', val: qualityReport.redundancy }
            ].map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold font-mono">
                  <span className="text-[#666666] uppercase">{item.label}</span>
                  <span className="text-[#111111]">{item.val}/100</span>
                </div>
                <div className="h-1.5 w-full bg-[#E5DDCB] border border-[#111111] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFC400] transition-all duration-500"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Presentation Purpose dropdown */}
          <div>
            <label className="block text-[9px] font-bold text-[#111111] uppercase font-mono mb-1">
              Presentation Purpose
            </label>
            <div className="relative">
              <select
                value={selectedPurpose}
                onChange={e => setSelectedPurpose(e.target.value)}
                className="w-full bg-white border border-[#111111] text-xs font-mono font-bold px-3 py-2 rounded-[4px] text-[#111111] appearance-none cursor-pointer outline-none shadow-paper-sm focus:bg-[#FFF8D6]"
              >
                {PURPOSES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#111111] pointer-events-none" />
            </div>
          </div>

          {/* Presentation Length selector */}
          <div>
            <label className="block text-[9px] font-bold text-[#111111] uppercase font-mono mb-1">
              Deck Slide Count
            </label>
            <div className="flex gap-1.5">
              {([5, 10, 15] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setSlideCount(l)}
                  className={`flex-1 py-1.5 px-1.5 rounded-[4px] border border-[#111111] text-[10px] font-mono font-extrabold cursor-pointer transition-all shadow-paper-sm ${
                    slideCount === l
                      ? 'bg-[#FFC400] text-[#111111]'
                      : 'bg-white text-[#111111] hover:bg-[#FFF8D6]'
                  }`}
                >
                  {l} Slides
                </button>
              ))}
            </div>
          </div>

          {/* Presentation Regeneration Levels */}
          <div>
            <label className="block text-[9px] font-bold text-[#111111] uppercase font-mono mb-1">
              Regeneration Strategy
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['quick', 'balanced', 'premium'] as const).map(levelName => (
                <button
                  key={levelName}
                  onClick={() => setRegLevel(levelName)}
                  className={`py-1.5 text-[9px] rounded-[4px] border border-[#111111] font-mono font-bold capitalize cursor-pointer transition-all shadow-paper-sm ${
                    regLevel === levelName
                      ? 'bg-[#FFC400] text-[#111111]'
                      : 'bg-white text-[#111111] hover:bg-[#FFF8D6]'
                  }`}
                >
                  {levelName === 'premium' ? 'Premium Pro' : levelName}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-[9px] font-bold text-[#111111] uppercase font-mono mb-1">
              Color Theme Palette
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.keys(THEME_STYLES).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTheme(t)}
                  className={`h-8 rounded-[4px] border border-[#111111] flex flex-col items-center justify-center gap-0.5 cursor-pointer capitalize transition-all shadow-paper-sm ${
                    selectedTheme === t
                      ? 'bg-[#FFC400] text-[#111111] font-black'
                      : 'bg-white text-[#111111] hover:bg-[#FFF8D6]'
                  }`}
                  title={`${t} mode palette`}
                >
                  <span className="text-[8px] font-mono font-bold truncate max-w-full px-0.5">{t}</span>
                  <div className="flex gap-0.5">
                    <div className="h-1.5 w-1.5 rounded-full border border-[#111111]" style={{ backgroundColor: `#${THEME_STYLES[t].accent}` }} />
                    <div className="h-1.5 w-1.5 rounded-full border border-[#111111]" style={{ backgroundColor: `#${THEME_STYLES[t].primary}` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Action Triggers */}
        <div className="space-y-2 pt-3 border-t border-[#111111]">
          <button
            onClick={handleRegenerateDeck}
            disabled={isGenerating}
            className="w-full py-2.5 bg-[#FFC400] hover:bg-[#ffe066] text-[#111111] disabled:opacity-40 transition-all text-xs font-mono font-extrabold rounded-[4px] border border-[#111111] shadow-paper-sm cursor-pointer flex items-center justify-center gap-2 uppercase"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#111111]" />
            <span>Regenerate Deck Blueprint</span>
          </button>
          
          <button
            onClick={handleExportPPT}
            disabled={slides.length === 0}
            className="w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white disabled:opacity-40 transition-all text-xs font-mono font-extrabold rounded-[4px] border border-[#111111] shadow-paper-sm cursor-pointer flex items-center justify-center gap-2 uppercase"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            <span>Download PPTX File</span>
          </button>
        </div>
      </div>
    </div>
  );
}
