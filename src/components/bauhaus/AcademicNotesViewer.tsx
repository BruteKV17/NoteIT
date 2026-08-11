/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Sparkles, Check, AlertTriangle, HelpCircle, Layers, Lightbulb, Target } from 'lucide-react';

interface AcademicNotesViewerProps {
  content: string | Record<string, string> | any[];
  mode?: string;
  theme?: 'light' | 'dark';
}

/**
 * Strips timestamp and source tags like [Source: Timestamp 00:08] or [00:08] or [Source: Page 3]
 * to produce clean, textbook-quality notes without visual clutter.
 */
export function cleanNotesTimestamps(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[Source:\s*Timestamp\s*\d{1,2}:\d{2}\]/gi, '')
    .replace(/\[Source:\s*Page\s*\d+\]/gi, '')
    .replace(/\[Source:\s*[^\]]+\]/gi, '')
    .replace(/\[\d{1,2}:\d{2}\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Render Markdown content cleanly with Bauhaus aesthetics,
 * properly formatted headings, tables, callouts, formulas, and bullet points.
 */
export const AcademicNotesViewer: React.FC<AcademicNotesViewerProps> = ({
  content,
  mode = 'academic',
  theme = 'light'
}) => {
  // Normalize content into a single clean string
  let rawText = '';
  if (typeof content === 'string') {
    rawText = content;
  } else if (Array.isArray(content)) {
    rawText = content.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const t = item.title ? `# ${item.title}\n` : '';
        const c = item.content || item.text || item.explanation || '';
        return `${t}${c}`;
      }
      return '';
    }).filter(Boolean).join('\n\n---\n\n');
  } else if (content && typeof content === 'object') {
    rawText = content[mode] || content.academic || content.detailed || content.quick || Object.values(content)[0] || '';
  }

  const cleanedText = cleanNotesTimestamps(rawText);

  if (!cleanedText.trim()) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-[var(--border-main)] rounded-[6px] bg-[var(--panel-bg)] p-6 space-y-3">
        <BookOpen className="h-8 w-8 text-[var(--text-secondary)] mx-auto animate-pulse" />
        <p className="text-xs font-mono font-bold text-[var(--text-secondary)]">No study notes available for this section.</p>
      </div>
    );
  }

  // Parse lines to build structured academic layout
  const lines = cleanedText.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTableRows: string[][] = [];
  let isInsideTable = false;
  let keyCounter = 0;

  const renderFormattedInlineText = (text: string) => {
    // Process inline bold, code/math, and callout labels
    let formatted: React.ReactNode[] = [];
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);

    parts.forEach((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        // Highlight specific labels like Definition:, Given:, Result:, Formula:
        if (/^(Definition|Key Idea|Important|Formula|Given|Process|Result|Example|Where|Common Confusion):/i.test(inner)) {
          formatted.push(
            <span key={idx} className="inline-block px-1.5 py-0.5 rounded-[3px] bg-[#FFC400] text-[#111111] font-mono font-extrabold text-[11px] uppercase tracking-wide mr-1 border border-[#111111] shadow-paper-sm">
              {inner}
            </span>
          );
        } else {
          formatted.push(<strong key={idx} className="font-extrabold text-[var(--text-primary)]">{inner}</strong>);
        }
      } else if ((part.startsWith('`') && part.endsWith('`')) || (part.startsWith('$') && part.endsWith('$'))) {
        const inner = part.slice(1, -1);
        formatted.push(
          <code key={idx} className="px-1.5 py-0.5 rounded-[3px] bg-[var(--panel-bg)] text-[#111111] font-mono text-[11px] font-bold border border-[var(--border-main)] mx-0.5">
            {inner}
          </code>
        );
      } else {
        formatted.push(part);
      }
    });

    return formatted;
  };

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      const headerRow = currentTableRows[0];
      const dataRows = currentTableRows.slice(1).filter(r => !r.every(c => c.replace(/[-:\s]/g, '') === ''));

      elements.push(
        <div key={`table-${keyCounter++}`} className="my-5 overflow-x-auto rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFC400] text-[#111111] border-b-2 border-[var(--border-main)]">
                {headerRow.map((col, cIdx) => (
                  <th key={cIdx} className="p-3 font-extrabold uppercase tracking-wider border-r-2 border-[var(--border-main)] last:border-r-0">
                    {col.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[var(--border-main)]">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--panel-bg)] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 font-medium text-[var(--text-primary)] border-r-2 border-[var(--border-main)] last:border-r-0">
                      {renderFormattedInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      currentTableRows = [];
      isInsideTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table line processing
    if (line.startsWith('|') && line.endsWith('|')) {
      isInsideTable = true;
      const cells = line.slice(1, -1).split('|');
      currentTableRows.push(cells);
      continue;
    } else if (isInsideTable) {
      flushTable();
    }

    if (!line) {
      continue;
    }

    // Header 1: Document Title (# Title)
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      const titleText = line.replace(/^#\s+/, '');
      elements.push(
        <div key={`h1-${keyCounter++}`} className="pb-4 mb-6 border-b-4 border-[var(--border-main)] bg-[var(--panel-bg)] p-5 rounded-[6px] shadow-paper-md border-2 border-[var(--border-main)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#FFC400] text-[#111111] font-mono text-[10px] font-extrabold uppercase border border-[#111111] shadow-paper-sm">
              UNIVERSITY STUDY GUIDE
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[var(--text-primary)] leading-tight">
            {titleText}
          </h1>
        </div>
      );
    }
    // Header 2: Special Callouts (Remember, Exam Focus, Common Confusion) or Major Concept (## 01 — ...)
    else if (line.startsWith('## ')) {
      const h2Text = line.replace(/^##\s+/, '');

      if (h2Text.includes('🧠 Remember') || h2Text.toLowerCase().includes('remember')) {
        elements.push(
          <div key={`remember-${keyCounter++}`} className="mt-8 mb-4 p-5 rounded-[6px] border-2 border-[#111111] bg-[#FFC400]/15 text-[var(--text-primary)] shadow-paper-md">
            <div className="flex items-center gap-2 border-b-2 border-[#111111] pb-2 mb-3">
              <Sparkles className="h-5 w-5 text-[#111111] fill-[#FFC400]" />
              <h2 className="font-heading text-base font-extrabold uppercase tracking-wider text-[#111111]">
                🧠 REMEMBER (QUICK REVISION)
              </h2>
            </div>
          </div>
        );
      } else if (h2Text.includes('🎯 Exam Focus') || h2Text.toLowerCase().includes('exam focus')) {
        elements.push(
          <div key={`exam-${keyCounter++}`} className="mt-8 mb-4 p-5 rounded-[6px] border-2 border-[#111111] bg-[#19B56B]/15 text-[var(--text-primary)] shadow-paper-md">
            <div className="flex items-center gap-2 border-b-2 border-[#111111] pb-2 mb-3">
              <Target className="h-5 w-5 text-[#19B56B]" />
              <h2 className="font-heading text-base font-extrabold uppercase tracking-wider text-[#111111]">
                🎯 EXAM FOCUS & HIGH-YIELD TOPICS
              </h2>
            </div>
          </div>
        );
      } else if (h2Text.includes('⚠️ Common Confusion') || h2Text.toLowerCase().includes('common confusion')) {
        elements.push(
          <div key={`confusion-${keyCounter++}`} className="mt-8 mb-4 p-5 rounded-[6px] border-2 border-[#111111] bg-[#FF4D4D]/15 text-[var(--text-primary)] shadow-paper-md">
            <div className="flex items-center gap-2 border-b-2 border-[#111111] pb-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-[#FF4D4D]" />
              <h2 className="font-heading text-base font-extrabold uppercase tracking-wider text-[#111111]">
                ⚠️ COMMON CONFUSION & DISTINCTIONS
              </h2>
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={`h2-${keyCounter++}`} className="mt-8 mb-3 pt-3 border-t-2 border-[var(--border-main)]">
            <h2 className="font-heading text-lg sm:text-xl font-extrabold uppercase tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-[#FFC400] border border-[#111111] inline-block shrink-0" />
              <span>{h2Text}</span>
            </h2>
          </div>
        );
      }
    }
    // Header 3: Subheadings (### Definition, ### Explanation, ### Formula, etc.)
    else if (line.startsWith('### ')) {
      const h3Text = line.replace(/^###\s+/, '');
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className="font-heading text-sm font-extrabold uppercase text-[var(--text-primary)] mt-4 mb-2 flex items-center gap-1.5">
          <span className="text-[#FFC400]">▪</span>
          <span>{h3Text}</span>
        </h3>
      );
    }
    // Lists: Bullet points (* or -)
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemText = line.replace(/^[*\-]\s+/, '');
      elements.push(
        <li key={`li-${keyCounter++}`} className="ml-4 pl-1 text-xs font-mono font-medium text-[var(--text-primary)] leading-relaxed mb-1.5 list-disc">
          {renderFormattedInlineText(itemText)}
        </li>
      );
    }
    // Numbered lists (1. 2. 3.)
    else if (/^\d+\.\s+/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${keyCounter++}`} className="flex items-start gap-2.5 my-2 ml-1 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-[4px] bg-[#FFC400] text-[#111111] font-extrabold border border-[#111111] text-[10px] shrink-0">
              {numMatch[1]}
            </span>
            <div className="font-medium text-[var(--text-primary)] leading-relaxed pt-0.5">
              {renderFormattedInlineText(numMatch[2])}
            </div>
          </div>
        );
      }
    }
    // Standard Paragraph
    else {
      elements.push(
        <p key={`p-${keyCounter++}`} className="text-xs font-sans font-normal text-[var(--text-primary)] leading-relaxed mb-3">
          {renderFormattedInlineText(line)}
        </p>
      );
    }
  }

  // Ensure lingering tables are rendered
  if (isInsideTable) {
    flushTable();
  }

  return (
    <div className="academic-notes-container space-y-2 selection:bg-[#FFC400] selection:text-[#111111]">
      {elements}
    </div>
  );
};
