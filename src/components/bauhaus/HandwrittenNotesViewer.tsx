/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Download, Printer, BookOpen, Sparkles, FileText, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';

interface HandwrittenNotesViewerProps {
  lectureData: any;
  theme?: 'light' | 'dark';
}

export const HandwrittenNotesViewer: React.FC<HandwrittenNotesViewerProps> = ({
  lectureData,
  theme = 'light'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract structured notes knowledge from lecture data
  const title = lectureData?.title || 'Lecture Study Notes';
  const overview = lectureData?.summary || lectureData?.notes?.overview || 'High-yield engineering revision notes compiled directly from lecture synthesis.';
  const keyConcepts = lectureData?.notes?.keyConcepts || lectureData?.keyConcepts || [];
  const sections = lectureData?.sections || [];
  const rawNotes = lectureData?.notes?.academic || lectureData?.notes?.detailed || lectureData?.notes || '';
  const sourceIntel = lectureData?.sourceIntelligence || {};

  // Build handwritten notes pages logically
  const generateHandwrittenPages = () => {
    // We break content into 2 to 3 A4 pages based on complexity
    const pages: Array<{
      pageNumber: number;
      header: string;
      sectionType: 'overview' | 'formulas' | 'revision';
      items: Array<{ title: string; type: 'flow' | 'formula' | 'diagram' | 'table' | 'bullets' | 'text'; content: any }>;
    }> = [];

    // PAGE 1: Overview, Core Definitions & Flow Concepts
    const page1Items: any[] = [];
    
    // Overview flow
    page1Items.push({
      title: 'CORE TOPIC OVERVIEW',
      type: 'flow',
      content: overview.replace(/\[Source:\s*[^\]]+\]/g, '').substring(0, 320)
    });

    // Core concepts flow statements
    if (sections && sections.length > 0) {
      sections.slice(0, 3).forEach((sec: any) => {
        page1Items.push({
          title: sec.title || 'Key Concept',
          type: 'flow',
          content: sec.content || sec.summary || ''
        });
      });
    } else {
      page1Items.push({
        title: 'Fundamental Principle',
        type: 'flow',
        content: 'Lectures present continuous signal & algorithmic transformation. Processing maps inputs to discrete outputs with minimal error.'
      });
    }

    pages.push({
      pageNumber: 1,
      header: 'SECTION 01 — CONCEPTUAL FOUNDATIONS',
      sectionType: 'overview',
      items: page1Items
    });

    // PAGE 2: Mathematical Formulas, Diagrams & Flowcharts
    const page2Items: any[] = [];
    const formulas = sourceIntel.formulas || ['b = log₂(L)', 'SNR = 6.02N + 1.76 dB', 'E = mc²'];
    
    page2Items.push({
      title: 'CORE FORMULAS & MATHEMATICAL RELATIONSHIPS',
      type: 'formula',
      content: formulas
    });

    // Flowchart diagram
    page2Items.push({
      title: 'PROCESS FLOWCHART / ARCHITECTURE',
      type: 'diagram',
      content: sections.length >= 2 
        ? sections.slice(0, 4).map((s: any) => s.title)
        : ['Input Context', 'Signal Processing', 'Quantization Stage', 'Output Stream']
    });

    pages.push({
      pageNumber: 2,
      header: 'SECTION 02 — FORMULAS & SYSTEM FLOWCHART',
      sectionType: 'formulas',
      items: page2Items
    });

    // PAGE 3: Key Takeaways & Exam Memory Sheet
    const page3Items: any[] = [];
    const keyTerms = sourceIntel.keyTerms || ['Quantization', 'Sampling Rate', 'Nyquist Rate', 'Bit Rate'];
    
    page3Items.push({
      title: 'KEY TERMINOLOGY & QUICK RECALL',
      type: 'bullets',
      content: keyTerms.slice(0, 6)
    });

    page3Items.push({
      title: 'EXAM HIGH-YIELD TAKEAWAYS (RETAIN FOR TEST)',
      type: 'bullets',
      content: [
        'Always verify Nyquist condition: fs ≥ 2 fmax to prevent aliasing.',
        'Increasing quantization levels by 1 bit improves SNR by ~6 dB.',
        'Check edge cases and boundary conditions in step-by-step algorithms.'
      ]
    });

    pages.push({
      pageNumber: 3,
      header: 'SECTION 03 — REVISION & EXAM CHEAT SHEET',
      sectionType: 'revision',
      items: page3Items
    });

    return pages;
  };

  const pages = generateHandwrittenPages();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="handwritten-workspace space-y-6 select-none">
      {/* TOOLBAR CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-[4px] bg-[#1E3A8A] text-white text-[10px] font-mono font-extrabold uppercase tracking-wider border border-[#111111] shadow-paper-sm">
            📝 A4 HANDWRITTEN REVISION SHEET
          </span>
          <span className="text-xs font-mono font-bold text-[#666666]">
            (3 Pages • 210mm × 297mm A4 Canvas)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFC400] text-[#111111] text-xs font-mono font-extrabold uppercase rounded-[4px] border border-[#111111] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#111111] text-xs font-mono font-extrabold uppercase rounded-[4px] border border-[#111111] shadow-paper-sm hover:bg-gray-100 cursor-pointer transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* PRINT-SPECIFIC CSS STYLES */}
      <style>{`
        @font-face {
          font-family: 'HandwrittenPen';
          src: local('Kalam'), local('Caveat'), cursive;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .handwritten-a4-stack, .handwritten-a4-stack * {
            visibility: visible;
          }
          .handwritten-a4-stack {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .a4-page {
            page-break-after: always;
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* VERTICALLY SCROLLABLE A4 PAGES STACK */}
      <div ref={containerRef} className="handwritten-a4-stack space-y-10 flex flex-col items-center py-6 bg-[#0F172A] rounded-[8px] p-6 border-2 border-[#111111] overflow-x-auto">
        {pages.map((pg) => (
          <div
            key={pg.pageNumber}
            className="a4-page relative w-[210mm] min-h-[297mm] !bg-white !text-slate-900 p-[20mm] rounded-[2px] border-[5px] border-[#2563EB] shadow-2xl overflow-hidden font-handwritten select-text"
            style={{
              fontFamily: "'Kalam', 'Caveat', cursive",
              backgroundColor: '#FFFFFF',
              backgroundImage: 'linear-gradient(#FFFFFF 27px, #CBD5E1 28px)',
              backgroundSize: '100% 28px',
              lineHeight: '28px',
              color: '#0F294A'
            }}
          >
            {/* VERTICAL NOTEBOOK MARGIN LINE */}
            <div className="absolute top-0 bottom-0 left-[22mm] border-l-2 border-red-500/80 pointer-events-none" />

            {/* HEADER METADATA */}
            <div className="flex justify-between items-center pb-2 border-b-2 border-[#2563EB] mb-6 text-sm font-bold tracking-wide">
              <div>
                <span className="text-[#0F294A] uppercase tracking-wider text-xs font-mono font-black">{pg.header}</span>
              </div>
              <div className="text-xs font-mono font-bold text-[#475569]">
                PAGE 0{pg.pageNumber} OF 0{pages.length}
              </div>
            </div>

            {/* DOCUMENT TITLE (ON PAGE 1) */}
            {pg.pageNumber === 1 && (
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#0F294A] leading-none mb-2 decoration-wavy underline underline-offset-8">
                  {title}
                </h1>
                <div className="text-xs font-mono font-bold text-[#334155] mt-2 italic flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#2563EB]" />
                  <span>University Revision Sheet • Hand-annotated Study Notes</span>
                </div>
              </div>
            )}

            {/* PAGE SECTION CONTENT */}
            <div className="space-y-6 text-base leading-relaxed text-[#0F294A]">
              {pg.items.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  {/* SECTION TITLE WITH HANDWRITTEN HIGHLIGHT */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#FFD54F] text-[#0F294A] text-lg font-extrabold shadow-sm border border-amber-400">
                      ✏ {item.title}
                    </span>
                  </div>

                  {/* ITEM CONTENT BASED ON TYPE */}
                  {item.type === 'flow' && (
                    <div className="pl-4 space-y-2 text-lg">
                      <p className="whitespace-pre-line font-bold leading-snug text-[#0F294A]">
                        {typeof item.content === 'string' ? item.content : ''}
                      </p>
                      {/* HANDWRITTEN FLOW STEP DIAGRAM */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 text-base font-bold text-[#0F294A]">
                        <span className="px-2.5 py-1 bg-blue-100 rounded border border-blue-400 text-blue-950 font-bold">Input Data</span>
                        <ArrowRight className="h-4 w-4 text-[#0F294A]" />
                        <span className="px-2.5 py-1 bg-blue-100 rounded border border-blue-400 text-blue-950 font-bold">Core Processing</span>
                        <ArrowRight className="h-4 w-4 text-[#0F294A]" />
                        <span className="px-2.5 py-1 bg-amber-100 rounded border border-amber-400 text-amber-950 font-bold">Discrete Result</span>
                      </div>
                    </div>
                  )}

                  {item.type === 'formula' && (
                    <div className="my-4 space-y-3">
                      {Array.isArray(item.content) && item.content.map((f: string, fIdx: number) => (
                        <div key={fIdx} className="p-4 rounded-[6px] border-2 border-[#2563EB] bg-[#F1F5F9] shadow-sm relative">
                          <span className="absolute top-1 right-2 text-xs font-mono text-blue-700 uppercase font-bold">Equation Box</span>
                          <div className="text-2xl font-black text-[#0F294A] tracking-wider font-mono">
                            {f}
                          </div>
                          <div className="text-sm font-sans text-slate-700 font-medium mt-1">
                            Where variables denote signal scale, quantized bits, or energy state.
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.type === 'diagram' && (
                    <div className="my-4 p-5 rounded-[6px] border-2 border-dashed border-[#2563EB] bg-[#F8FAFC] space-y-3">
                      <div className="text-sm font-bold uppercase text-[#0F294A]">Hand-Drawn System Architecture Diagram</div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
                        {Array.isArray(item.content) && item.content.map((step: string, sIdx: number) => (
                          <React.Fragment key={sIdx}>
                            <div 
                              className="p-3.5 bg-white rounded-md border-2 border-[#2563EB] shadow-sm font-extrabold text-base flex-1 text-center"
                              style={{ backgroundColor: '#FFFFFF', color: '#0F294A' }}
                            >
                              {step}
                            </div>
                            {sIdx < item.content.length - 1 && (
                              <span className="text-2xl font-extrabold text-[#2563EB] sm:rotate-0 rotate-90" style={{ color: '#2563EB' }}>➔</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.type === 'bullets' && (
                    <ul className="space-y-2 pl-4 text-lg">
                      {Array.isArray(item.content) && item.content.map((bullet: string, bIdx: number) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-extrabold">★</span>
                          <span className="font-bold text-[#0F294A] leading-snug">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* PAGE FOOTER */}
            <div className="absolute bottom-[10mm] left-[20mm] right-[20mm] pt-3 border-t border-slate-300 flex justify-between items-center text-xs font-mono font-bold text-slate-600">
              <span>NOTEIT — HANDWRITTEN STUDY ENGINE</span>
              <span>A4 PORTRAIT (210mm × 297mm)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
