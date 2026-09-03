/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Download, Printer, ArrowRight } from 'lucide-react';

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
  const overview = lectureData?.summary || lectureData?.notes?.overview || (typeof lectureData?.notes === 'string' ? lectureData.notes : '') || '';

  // Extract all sections/topics dynamically
  let sections: Array<{ title: string; content: string }> = [];
  if (Array.isArray(lectureData?.sections) && lectureData.sections.length > 0) {
    sections = lectureData.sections.map((s: any) => ({
      title: s.title || s.heading || 'Topic Section',
      content: s.content || s.explanation || s.summary || ''
    }));
  } else if (Array.isArray(lectureData?.notes) && lectureData.notes.length > 0) {
    sections = lectureData.notes.map((n: any) => ({
      title: n.title || n.heading || 'Topic Section',
      content: typeof n.content === 'string' ? n.content : (Array.isArray(n.details) ? n.details.join('. ') : JSON.stringify(n.content))
    }));
  } else if (typeof lectureData?.content === 'string' && lectureData.content.trim().length > 0) {
    const paragraphs = lectureData.content.split(/\n\s*\n/).map((p: string) => p.trim()).filter((p: string) => p.length > 20);
    sections = paragraphs.map((p: string, idx: number) => {
      const lines = p.split('\n');
      const firstLine = lines[0].replace(/^#{1,4}\s+/, '').trim();
      const body = lines.length > 1 ? lines.slice(1).join(' ') : p;
      return {
        title: firstLine.length > 0 && firstLine.length < 70 ? firstLine : `Topic Section ${idx + 1}`,
        content: body
      };
    });
  }

  // Key terms & formulas
  const sourceIntel = lectureData?.sourceIntelligence || {};
  const keyTerms: string[] = sourceIntel.keyTerms || [];
  const formulas: string[] = sourceIntel.formulas || [];

  // Build handwritten notes pages dynamically covering ALL real academic topics
  const generateHandwrittenPages = () => {
    const pages: Array<{
      pageNumber: number;
      header: string;
      items: Array<{
        title: string;
        type: 'text' | 'concept' | 'diagram' | 'formula' | 'terms' | 'bullets';
        content: any;
      }>;
    }> = [];

    // STRICT ADMINISTRATIVE NOISE FILTER
    const noiseRegex = /co-po|course outcome|program outcome|\bco[1-6]\b|\bpo[1-6]\b|table of content|\bindex\b|syllabus|faculty|office hour|grading|prerequisites|unit details/i;
    const cleanSections = (sections.length > 0 ? sections : [
      { title: 'Core Concepts & Overview', content: overview || 'High-yield revision sheet compiled from source material.' }
    ]).filter(s => !noiseRegex.test(s.title || '') && !noiseRegex.test(s.content || ''));

    const allSections = cleanSections.length > 0 ? cleanSections : [
      { title: 'Core Concepts & Overview', content: overview || 'High-yield revision sheet compiled from source material.' }
    ];

    // Pack 2-3 real concept sections per A4 sheet
    const sectionsPerPage = Math.max(2, Math.min(4, Math.ceil(allSections.length / Math.max(1, Math.ceil(allSections.length / 3)))));
    const pageCount = Math.max(1, Math.ceil(allSections.length / sectionsPerPage));

    for (let p = 0; p < pageCount; p++) {
      const pageSections = allSections.slice(p * sectionsPerPage, (p + 1) * sectionsPerPage);
      const pageItems: any[] = [];

      // Include Overview synthesis on page 1 if available
      if (p === 0 && overview && !noiseRegex.test(overview)) {
        pageItems.push({
          title: 'CORE TOPIC SYNTHESIS',
          type: 'text',
          content: overview.replace(/\[Source:\s*[^\]]+\]/g, '').trim()
        });
      }

      // Add each real academic section topic for this page
      pageSections.forEach((sec) => {
        pageItems.push({
          title: sec.title.toUpperCase(),
          type: 'concept',
          content: sec.content
        });
      });

      // Include Formulas ONLY ONCE on the final page if present
      if (p === pageCount - 1 && formulas.length > 0) {
        pageItems.push({
          title: 'KEY FORMULAS & EQUATIONS',
          type: 'formula',
          content: formulas
        });
      }

      // Include Key Terminology ONLY ONCE on the final page if present
      if (p === pageCount - 1 && keyTerms.length > 0) {
        pageItems.push({
          title: 'KEY TERMINOLOGY',
          type: 'terms',
          content: keyTerms.slice(0, 10)
        });
      }

      const sectionNum = String(p + 1).padStart(2, '0');
      pages.push({
        pageNumber: p + 1,
        header: `SECTION ${sectionNum} — ${p === 0 ? 'CONCEPTUAL FOUNDATIONS' : p === 1 ? 'ADVANCED TOPICS & ARCHITECTURE' : 'REVISION & EXAM CHEAT SHEET'}`,
        items: pageItems
      });
    }

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
            ({pages.length} {pages.length === 1 ? 'Page' : 'Pages'} • 210mm × 297mm A4 Canvas)
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
            className="a4-page relative w-[210mm] min-h-[297mm] !bg-white !text-slate-900 p-[16mm] rounded-[2px] border-[5px] border-[#2563EB] shadow-2xl overflow-hidden font-handwritten select-text"
            style={{
              fontFamily: "'Kalam', 'Caveat', cursive",
              backgroundColor: '#FFFFFF',
              backgroundImage: 'linear-gradient(#FFFFFF 27px, #CBD5E1 28px)',
              backgroundSize: '100% 28px',
              lineHeight: '28px',
              color: '#0F294A'
            }}
          >
            {/* HEADER METADATA */}
            <div className="flex justify-between items-center pb-2 border-b-2 border-[#2563EB] mb-6 text-sm font-bold tracking-wide">
              <div>
                <span className="text-[#0F294A] uppercase tracking-wider text-xs font-mono font-black">{pg.header}</span>
              </div>
              <div className="text-xs font-mono font-bold text-[#475569]">
                PAGE {String(pg.pageNumber).padStart(2, '0')} OF {String(pages.length).padStart(2, '0')}
              </div>
            </div>

            {/* DOCUMENT TITLE (ON PAGE 1) */}
            {pg.pageNumber === 1 && (
              <div className="mb-6">
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
                  {item.type === 'text' && (
                    <div className="pl-2 text-lg font-bold leading-snug text-[#0F294A]">
                      <p className="whitespace-pre-line">{item.content}</p>
                    </div>
                  )}

                  {item.type === 'concept' && (
                    <div className="pl-2 space-y-1 text-lg font-bold leading-snug text-[#0F294A]">
                      <p className="whitespace-pre-line">{item.content}</p>
                    </div>
                  )}

                  {item.type === 'diagram' && (
                    <div className="my-3 p-4 rounded-[6px] border-2 border-dashed border-[#2563EB] bg-[#F8FAFC]">
                      <div className="text-xs font-bold uppercase text-[#2563EB] mb-2 font-mono">Process Flow Diagram</div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                        {Array.isArray(item.content) && item.content.map((step: string, sIdx: number) => (
                          <React.Fragment key={sIdx}>
                            <div 
                              className="p-2.5 bg-white rounded-md border-2 border-[#2563EB] shadow-sm font-extrabold text-sm flex-1 text-center"
                              style={{ backgroundColor: '#FFFFFF', color: '#0F294A' }}
                            >
                              {step}
                            </div>
                            {sIdx < item.content.length - 1 && (
                              <ArrowRight className="h-5 w-5 text-[#2563EB] shrink-0 sm:rotate-0 rotate-90" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.type === 'formula' && (
                    <div className="my-3 space-y-2">
                      {Array.isArray(item.content) && item.content.map((f: string, fIdx: number) => (
                        <div key={fIdx} className="p-3 rounded-[6px] border-2 border-[#2563EB] bg-[#F1F5F9] shadow-sm relative">
                          <span className="absolute top-1 right-2 text-[10px] font-mono text-blue-700 uppercase font-bold">Equation Box</span>
                          <div className="text-xl font-black text-[#0F294A] tracking-wider font-mono">
                            {f}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.type === 'terms' && (
                    <div className="flex flex-wrap gap-2 my-2 pl-2">
                      {Array.isArray(item.content) && item.content.map((term: string, tIdx: number) => (
                        <span key={tIdx} className="px-3 py-1 bg-amber-100 rounded-full border border-amber-400 text-amber-950 font-bold text-sm">
                          📌 {term}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.type === 'bullets' && (
                    <ul className="space-y-1.5 pl-2 text-lg">
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
            <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-xs font-mono font-bold text-slate-600">
              <span>NOTEIT — HANDWRITTEN STUDY ENGINE</span>
              <span>A4 PORTRAIT (210mm × 297mm)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
