import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, X, RefreshCw, Copy, Check } from 'lucide-react';
import { explainInBhaiLang } from '../../services/bhaiLangService';

interface BhaiLangPopoverProps {
  subjectName?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function BhaiLangPopover({ subjectName, containerRef }: BhaiLangPopoverProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!explanation) {
          setPosition(null);
          setSelectedText('');
        }
        return;
      }

      const text = selection.toString().trim();
      if (text.length > 5) {
        setSelectedText(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setPosition({
          x: Math.max(10, Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 100)),
          y: Math.max(10, rect.top - 50 + window.scrollY)
        });
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [explanation]);

  const handleTriggerExplanation = async () => {
    if (!selectedText) return;
    setIsExplaining(true);
    setExplanation(null);
    try {
      const res = await explainInBhaiLang(selectedText, subjectName);
      setExplanation(res);
    } catch (e) {
      setExplanation("Bhai lagta hai network crash ho gaya. Dobara try karo!");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleClose = () => {
    setPosition(null);
    setSelectedText('');
    setExplanation(null);
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!position || !selectedText) return null;

  return (
    <div 
      ref={popoverRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="absolute z-50 animate-fade-in"
    >
      {!explanation && !isExplaining ? (
        <button
          type="button"
          onClick={handleTriggerExplanation}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-black bg-[#FFC400] hover:bg-amber-400 text-black text-xs font-mono font-black shadow-paper-sm hover:shadow-paper transition-all cursor-pointer transform -translate-y-full"
        >
          <MessageSquare className="h-4 w-4 fill-black" />
          <span>EXPLAIN IN BHAI LANG 🗣️</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 p-4 rounded-2xl border-2 border-black bg-white dark:bg-[#1E293B] text-black dark:text-white shadow-2xl space-y-3 transform -translate-y-full">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#FFC400] text-black rounded border border-black text-xs">🗣️</span>
              <span className="text-xs font-mono font-black uppercase tracking-wider text-[#1D4ED8] dark:text-[#60A5FA]">Bhai Lang Explanation</span>
            </div>
            <div className="flex items-center gap-1">
              {explanation && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-black dark:hover:text-white"
                  title="Copy explanation"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-black dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isExplaining ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-mono font-bold text-slate-500 animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin text-[#2563EB]" />
              <span>Bhai soch raha hai (simplifying)...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-sans font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-[#F8FAFC] dark:bg-[#0D1117] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {explanation}
              </p>
              <div className="text-[10px] font-mono font-bold text-slate-400 text-right">
                Original context preserved ✓
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
