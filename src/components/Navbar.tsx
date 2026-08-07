/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  ChevronRight,
  Sparkles,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import { Button, Badge } from './bauhaus';

interface NavbarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  setIsOpenMobile: (open: boolean) => void;
  settings: UserSettings;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewAnalysis?: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogOut: () => void;
}

export default function Navbar({
  activePage,
  setActivePage,
  setIsOpenMobile,
  settings,
  searchQuery,
  setSearchQuery,
  onNewAnalysis,
  theme,
  setTheme,
  onLogOut
}: NavbarProps) {
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'OVERVIEW';
      case 'lecture-capture':
        return 'CAPTURE LIVE';
      case 'research-hub':
        return 'RESEARCH HUB';
      case 'academic-library':
        return 'ACADEMIC LIBRARY';
      case 'quiz-mode':
        return 'QUIZ MODE';
      case 'notifications':
        return 'ACTIVITY CENTER';
      case 'settings':
        return 'SETTINGS';
      case 'help-support':
        return 'HELP & SUPPORT';
      case 'pricing':
        return 'SUBSCRIPTION PLANS';
      case 'profile':
        return 'MY PROFILE';
      default:
        return 'WORKSPACE';
    }
  };

  const handleDropdownOption = (page: PageId) => {
    setActivePage(page);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-main)] bg-[var(--navbar-bg)] px-4 md:px-6 select-none">
      
      {/* Left items: Mobile trigger & Branded Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-paper-sm md:hidden focus:outline-none hover:bg-[#FFC400] hover:text-[#111111]"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--text-secondary)]">
          <span 
            className="hidden sm:inline-block bg-[var(--border-main)] text-[var(--card-bg)] px-2 py-0.5 rounded-[4px] cursor-pointer hover:bg-[#FFC400] hover:text-[#111111] transition-colors"
            onClick={() => setActivePage('dashboard')}
          >
            NOTEIT
          </span>
          <ChevronRight className="hidden sm:inline-block h-3.5 w-3.5 text-[var(--text-primary)]" />
          <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 sm:px-2.5 rounded-[4px] font-bold border border-[var(--border-main)] shadow-paper-sm uppercase tracking-wider text-[11px] sm:text-xs">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6 relative">
        <div className="relative w-full">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, summaries, transcripts..."
            className="w-full rounded-[6px] border border-[var(--border-main)] bg-[var(--input-bg)] pl-9 pr-14 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-paper-sm placeholder:text-[var(--text-secondary)]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-[var(--panel-bg)] px-1.5 py-0.5 rounded-[3px] border border-[var(--border-main)] text-[10px] font-mono font-bold text-[var(--text-secondary)]">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right widgets: Quick triggers, actions, theme toggle, profiles */}
      <div className="flex items-center gap-2 relative">
        
        {/* Short-path Actions */}
        {onNewAnalysis && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActivePage('lecture-capture')}
            className="hidden sm:inline-flex"
            icon={<Plus className="h-4 w-4" />}
          >
            Capture
          </Button>
        )}

        {/* Theme Toggle Quick Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[6px] border border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] focus:outline-none cursor-pointer transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark Blue'} Theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#FFC400]" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--text-primary)]" />
          )}
        </button>

        {/* Activity Center indicator */}
        <button
          onClick={() => handleDropdownOption('notifications')}
          className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[6px] border border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm text-[var(--text-primary)] hover:bg-[var(--hover-bg)] focus:outline-none cursor-pointer"
          title="Activity Center"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#FF4D4D] border border-[var(--border-main)]" />
        </button>

        <div className="h-6 w-[2px] bg-[var(--border-main)] mx-1 hidden sm:block" />

        {/* User avatar - Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            {settings.profile.avatarUrl ? (
              <img
                src={settings.profile.avatarUrl}
                alt={settings.profile.fullName}
                className="h-9 w-9 rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-sm object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-sm bg-[#FFC400] flex items-center justify-center font-bold text-xs text-[#111111] uppercase">
                {settings.profile.fullName ? settings.profile.fullName.charAt(0) : 'U'}
              </div>
            )}
          </button>

          {/* Avatar dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-4 shadow-paper-lg space-y-3 z-50 text-[var(--text-primary)]">
              {/* Dropdown Header Info */}
              <div className="flex items-center gap-3 pb-3 border-b-2 border-[var(--border-main)]">
                {settings.profile.avatarUrl ? (
                  <img
                    src={settings.profile.avatarUrl}
                    alt={settings.profile.fullName}
                    className="h-10 w-10 rounded-[6px] border-2 border-[var(--border-main)] object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] flex items-center justify-center font-bold text-sm text-[#111111] uppercase">
                    {settings.profile.fullName ? settings.profile.fullName.charAt(0) : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-heading font-bold text-[var(--text-primary)] truncate">{settings.profile.fullName}</div>
                  <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] truncate mt-0.5">
                    {settings.profile.role || 'Academic Scholar'}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1 font-mono text-xs text-[var(--text-primary)]">
                <button
                  onClick={() => handleDropdownOption('profile')}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 font-bold text-left hover:bg-[#FFC400] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span>Academic Profile</span>
                </button>

                <button
                  onClick={() => handleDropdownOption('settings')}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 font-bold text-left hover:bg-[#FFC400] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex w-full items-center justify-between rounded-[4px] px-2.5 py-2 font-bold text-left hover:bg-[#FFC400] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0 text-[#FFC400]" /> : <Moon className="h-4 w-4 shrink-0" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-main)] bg-[var(--panel-bg)] font-bold">
                    {theme === 'dark' ? 'DARK BLUE' : 'LIGHT'}
                  </span>
                </button>

                <button
                  onClick={() => handleDropdownOption('pricing')}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 font-bold text-left hover:bg-[#FFC400] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Subscription Plans</span>
                </button>

                <button
                  onClick={() => handleDropdownOption('help-support')}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 font-bold text-left hover:bg-[#FFC400] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <span>Documentation</span>
                </button>
              </div>

              {/* Log out button */}
              <div className="pt-2 border-t-2 border-[var(--border-main)]">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogOut();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 font-bold text-left text-white bg-[#FF4D4D] border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ff6666] transition-colors font-mono text-xs uppercase"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
