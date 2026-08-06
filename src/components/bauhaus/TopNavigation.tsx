import React from 'react';
import { Search } from 'lucide-react';
import { Button } from './Button';

export interface TopNavigationProps {
  currentPageTitle: string;
  breadcrumb?: string;
  onSearchClick?: () => void;
  onCaptureClick?: () => void;
  onProClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  toggleSidebar?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentPageTitle,
  breadcrumb = 'NOTEIT',
  onCaptureClick,
  onProClick,
  searchQuery,
  onSearchChange,
  toggleSidebar,
}) => {
  return (
    <header className="w-full bg-[#F6F2EA] border-b-2 border-[#111111] px-4 md:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-[6px] border-2 border-[#111111] bg-white shadow-paper-sm text-[#111111]"
            aria-label="Toggle Navigation Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#666666]">
          <span className="bg-[#111111] text-white px-2 py-0.5 rounded-[4px]">{breadcrumb}</span>
          <span>&gt;</span>
          <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 rounded-[4px] uppercase tracking-wider font-bold border border-[#111111]">
            {currentPageTitle}
          </span>
        </div>
      </div>

      {/* Center: Minimal Editorial Search Bar */}
      <div className="hidden sm:flex items-center max-w-md w-full relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search notes, summaries, transcripts..."
            className="w-full bg-white text-[#111111] text-xs font-medium pl-9 pr-12 py-2 rounded-[6px] border-2 border-[#111111] shadow-paper-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#F6F2EA] px-1.5 py-0.5 rounded-[4px] border border-[#111111] text-[10px] font-mono font-bold text-[#666666]">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Industrial Buttons */}
      <div className="flex items-center gap-2.5">
        {onCaptureClick && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onCaptureClick}
            icon={
              <span className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-pulse border border-[#111111]" />
            }
          >
            Capture Live
          </Button>
        )}
      </div>
    </header>
  );
};
