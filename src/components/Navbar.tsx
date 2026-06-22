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
  GraduationCap,
  User,
  CreditCard,
  Sun,
  Moon,
  Shield,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { PageId, UserSettings } from '../types';

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
        return 'Overview';
      case 'lecture-capture':
        return 'Lecture Capture';
      case 'research-hub':
        return 'Research Hub';
      case 'academic-library':
        return 'Academic Library';
      case 'quiz-mode':
        return 'Interactive Study Mode';
      case 'notifications':
        return 'Activity Center';
      case 'settings':
        return 'Account Settings';
      case 'help-support':
        return 'Help & Support';
      case 'pricing':
        return 'Subscription Plans';
      case 'profile':
        return 'My Profile';
      default:
        return 'Workspace';
    }
  };

  const getBreadcrumbs = () => {
    const title = getPageTitle();
    return (
      <div className="flex items-center gap-1.5 font-sans text-xs text-neutral-400 font-medium">
        <span className="cursor-pointer hover:text-[#2563EB]" onClick={() => setActivePage('dashboard')}>NoteIT</span>
        <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-700" />
        <span className="text-gray-900 dark:text-neutral-50 font-semibold">{title}</span>
      </div>
    );
  };

  const handleDropdownOption = (page: PageId) => {
    setActivePage(page);
    setDropdownOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 md:px-6 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-[#0a0a0c]/85 border-neutral-900/60 text-white' 
        : 'bg-white/80 border-[#E5E7EB] text-gray-900'
    } backdrop-blur-md`}>
      
      {/* Left items: Mobile trigger & Branded Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpenMobile(true)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border md:hidden focus:outline-none hover:opacity-85 ${
            theme === 'dark' ? 'bg-[#121318] border-neutral-800' : 'bg-white border-gray-200'
          }`}
        >
          <Menu className="h-4.5 w-4.5 text-current" />
        </button>
        
        <div className="hidden sm:block">
          {getBreadcrumbs()}
        </div>
        <div className="block sm:hidden font-sans font-extrabold text-sm tracking-tight">
          {getPageTitle()}
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, summaries, transcripts..."
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all ${
              theme === 'dark'
                ? 'bg-[#121318] text-white border border-neutral-800 placeholder-neutral-500 focus:border-indigo-500'
                : 'bg-gray-50 text-gray-900 border border-gray-200 placeholder-gray-400 focus:border-black'
            }`}
          />
        </div>
      </div>

      {/* Right widgets: Quick triggers, actions, profiles */}
      <div className="flex items-center gap-2.5 relative">
        
        {/* Pro Badge */}
        {settings.subscription.planName === 'Scholar' ? (
          <button
            onClick={() => setActivePage('pricing')}
            className="hidden lg:flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 focus:outline-none cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Unleash Pro Tiers</span>
          </button>
        ) : (
          <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
            <span>Researcher Active</span>
          </span>
        )}

        {/* Short-path Actions */}
        {onNewAnalysis && (
          <button
            onClick={() => setActivePage('lecture-capture')}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-colors focus:outline-none cursor-pointer ${
              theme === 'dark' 
                ? 'border-neutral-800 bg-[#121318] hover:bg-neutral-800' 
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Plus className="h-4 w-4 text-gray-500" />
            <span>Capture Lecture</span>
          </button>
        )}

        {/* Activity Center indicator */}
        <button
          onClick={() => handleDropdownOption('notifications')}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl focus:outline-none hover:bg-gray-50/10 ${
            theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          }`}
          title="Activity Center"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 shadow-sm animate-pulse" />
        </button>

        {/* Brightness switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`flex h-9 w-9 items-center justify-center rounded-xl focus:outline-none hover:bg-gray-50/10 ${
            theme === 'dark' ? 'text-amber-400' : 'text-gray-500'
          }`}
          title={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className={`h-6 w-[1.5px] mx-1 md:block hidden ${theme === 'dark' ? 'bg-[#1a1b24]' : 'bg-[#E5E7EB]'}`} />

        {/* User avatar - Click avatar opens premium menu dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-full hover:opacity-85 focus:outline-none cursor-pointer"
          >
            {settings.profile.avatarUrl ? (
              <img
                src={settings.profile.avatarUrl}
                alt={settings.profile.fullName}
                className="h-9 w-9 rounded-full border border-indigo-500 object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full border border-indigo-500 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                <User className="h-4.5 w-4.5" />
              </div>
            )}
          </button>

          {/* Premium Avatar dropdown panel */}
          {dropdownOpen && (
            <div className={`absolute right-0 mt-3.5 w-64 rounded-2xl border p-4 shadow-2xl space-y-4 animate-fade-in ${
              theme === 'dark' 
                ? 'bg-[#0f1015]/95 border-neutral-800 text-white shadow-[#000]/60' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {/* Dropdown Header Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-800/10 dark:border-neutral-800/40">
                {settings.profile.avatarUrl ? (
                  <img
                    src={settings.profile.avatarUrl}
                    alt={settings.profile.fullName}
                    className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full border border-gray-200 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{settings.profile.fullName}</div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#2563EB] dark:text-indigo-400 mt-0.5 truncate">
                    {settings.profile.role}
                  </div>
                </div>
              </div>

              {/* Items List Mapping */}
              <div className="space-y-1.5">
                
                {/* Profile Option */}
                <button
                  onClick={() => handleDropdownOption('profile')}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors focus:outline-none hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <User className="h-4.5 w-4.5 text-neutral-400" />
                  <span>My Academic Profile</span>
                </button>

                {/* Account settings Option */}
                <button
                  onClick={() => handleDropdownOption('settings')}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors focus:outline-none hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <Settings className="h-4.5 w-4.5 text-neutral-400" />
                  <span>Account Settings</span>
                </button>

                {/* Billing options Option */}
                <button
                  onClick={() => handleDropdownOption('pricing')}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors focus:outline-none hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <CreditCard className="h-4.5 w-4.5 text-neutral-400" />
                  <span>Billing & Subscription</span>
                </button>

                {/* Help support Option */}
                <button
                  onClick={() => handleDropdownOption('help-support')}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors focus:outline-none hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <HelpCircle className="h-4.5 w-4.5 text-neutral-400" />
                  <span>Help & Documentation</span>
                </button>
              </div>

              {/* Theme toggle segment inside popover */}
              <div className="flex items-center justify-between p-2.5.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-neutral-800/5 dark:border-neutral-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Appearance Theme</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`p-1.5 rounded-md focus:outline-none ${
                      theme === 'light' ? 'bg-white ring-1 ring-gray-200 text-amber-500 font-bold' : 'text-gray-400'
                    }`}
                    title="Light"
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`p-1.5 rounded-md focus:outline-none ${
                      theme === 'dark' ? 'bg-neutral-800 ring-1 ring-neutral-700 text-indigo-400 font-bold' : 'text-gray-400'
                    }`}
                    title="Dark"
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Secure Log out */}
              <div className="pt-2 border-t border-neutral-800/15 dark:border-neutral-800">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-bold text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors focus:outline-none cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Log Out Securely</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}
