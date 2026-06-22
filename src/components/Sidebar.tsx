/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Compass, 
  Settings, 
  Bell, 
  GraduationCap,
  Sparkles,
  BookMarked,
  X,
  Mic,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ExternalLink
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import AILogo from './AILogo';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  settings: UserSettings;
  onNewAnalysis?: () => void;
  theme: 'light' | 'dark';
  onLogOut: () => void;
}

export default function Sidebar({
  activePage,
  setActivePage,
  isOpenMobile,
  setIsOpenMobile,
  settings,
  onNewAnalysis,
  theme,
  onLogOut
}: SidebarProps) {
  
  // Sidebar expand/collapse state for desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Grouped Menu Navigation
  const workspaceItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lecture-capture', label: 'Capture Live', icon: Mic, badge: 'REC' },
    { id: 'knowledge-studio', label: 'Knowledge Studio', icon: Compass },
    { id: 'academic-library', label: 'Academic Library', icon: BookMarked },
    { id: 'quiz-mode', label: 'Quiz Mode', icon: GraduationCap }
  ];

  const accountItems = [
    { id: 'notifications', label: 'Activity Center', icon: Bell, indicator: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (pageId: PageId) => {
    setActivePage(pageId);
    setIsOpenMobile(false);
  };

  const isPro = settings.subscription.planName !== 'Scholar';

  const sidebarContent = (
    <div className={`flex h-full flex-col select-none transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-[#0e0f14] text-neutral-300 border-r border-[#1a1b24]' 
        : 'bg-white text-gray-700 border-r border-[#E5E7EB]'
    } ${isCollapsed ? 'w-20' : 'w-[260px] lg:w-[280px]'}`}>
      
      {/* Brand area */}
      <div className={`flex h-16 items-center justify-between px-4 border-b ${
        theme === 'dark' ? 'border-[#1a1b24]' : 'border-[#F3F4F6]'
      }`}>
        <div 
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden truncate"
          onClick={() => handleNavClick('landing')}
        >
          <AILogo size={38} theme={theme} />
          
          {!isCollapsed && (
            <div className="animate-fade-in">
              <div className="font-sans font-black text-sm tracking-tight text-gray-900 dark:text-neutral-50 flex items-center gap-1">
                NoteIT
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[8.5px] font-bold text-indigo-400 font-mono">
                  v1.5
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#2563EB] dark:text-indigo-400">
                COGNITIVE LAB
              </div>
            </div>
          )}
        </div>

        {/* Mobile close trigger or Collapse toggle */}
        <button 
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex h-7 w-7 items-center justify-center rounded-lg border focus:outline-none hover:opacity-85 ${
            theme === 'dark' 
              ? 'bg-[#121318] border-neutral-800 hover:bg-[#1a1b24]' 
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Primary Capture Sync Trigger */}
      {!isCollapsed && onNewAnalysis && (
        <div className={`px-4 py-4 border-b ${theme === 'dark' ? 'border-[#1a1b24]' : 'border-[#F3F4F6]'}`}>
          <button
            onClick={() => handleNavClick('lecture-capture')}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 font-sans text-xs font-bold text-white transition-all transform active:scale-[0.98] shadow-md focus:outline-none cursor-pointer ${
              theme === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20' 
                : 'bg-black hover:bg-neutral-800'
            }`}
          >
            <Mic className="h-4 w-4 animate-pulse text-indigo-300" />
            <span className="animate-fade-in">Capture Live Course</span>
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        
        {/* GROUP 1: WORKSPACE */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3.5 mb-2 text-[10px] font-black uppercase tracking-widest text-[#2563EB] dark:text-indigo-400 font-mono">
              Workspace
            </div>
          )}
          {workspaceItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as PageId)}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full items-center rounded-xl p-2.5 font-sans text-[13.5px] font-medium transition-all focus:outline-none cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-indigo-500/10 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                      : 'bg-gray-100 text-gray-900 font-bold border-l-2 border-black pl-2'
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:bg-[#1a1b24]/40 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}
              >
                <IconComponent className={`h-4.5 w-4.5 flex-shrink-0 ${
                  isActive 
                    ? theme === 'dark' ? 'text-indigo-400' : 'text-black' 
                    : theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'
                }`} />
                
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate animate-fade-in">{item.label}</span>
                )}

                {item.badge && !isCollapsed && (
                  <span className="rounded bg-red-500 text-white font-sans text-[8px] font-bold px-1 py-0.5 tracking-wide uppercase scale-95 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* GROUP 2: ACCOUNT */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3.5 mb-2 text-[10px] font-black uppercase tracking-widest text-[#2563EB] dark:text-indigo-400 font-mono">
              Account
            </div>
          )}
          {accountItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as PageId)}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full items-center rounded-xl p-2.5 font-sans text-[13.5px] font-medium transition-all focus:outline-none cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-indigo-500/10 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                      : 'bg-gray-100 text-gray-900 font-bold border-l-2 border-black pl-2'
                    : theme === 'dark'
                      ? 'text-neutral-400 hover:bg-[#1a1b24]/40 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}
              >
                <IconComponent className={`h-4.5 w-4.5 flex-shrink-0 ${
                  isActive 
                    ? theme === 'dark' ? 'text-indigo-400' : 'text-black' 
                    : 'text-gray-400'
                }`} />
                
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate animate-fade-in">{item.label}</span>
                )}

                {item.indicator && (
                  <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-red-500 relative flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Subscription premium Tier banner */}
      {!isCollapsed && (
        <div className={`px-4 py-4 border-t ${theme === 'dark' ? 'border-[#1a1b24]' : 'border-[#F3F4F6]'} bg-gray-50/10`}>
          <div className={`rounded-xl border p-3.5 shadow-sm space-y-3 ${
            theme === 'dark' ? 'bg-[#121318]/90 border-neutral-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-indigo-950/40 text-[#2563EB] dark:text-indigo-400">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-neutral-50 truncate">
                  Note-IT {settings.subscription.planName}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                  {isPro ? 'AI models fully optimized' : '5 summaries limit / mo'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleNavClick('pricing')}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-center text-xs font-semibold focus:outline-none cursor-pointer ${
                theme === 'dark' 
                  ? 'border-neutral-800 hover:bg-[#1a1b24] text-neutral-300' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>{isPro ? 'Upgrade SaaS Plan' : 'Unleash Pro Tiers'}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Profile Identity card in the footer */}
      <div className={`border-t p-4 ${theme === 'dark' ? 'border-[#1a1b24]' : 'border-[#F3F4F6]'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <button 
            onClick={() => handleNavClick('profile')}
            className="flex-shrink-0 focus:outline-none"
            title="Update Profile"
          >
            {settings.profile.avatarUrl ? (
              <img
                src={settings.profile.avatarUrl}
                alt={settings.profile.fullName}
                className="h-10 w-10 rounded-full border border-gray-200 dark:border-neutral-800 object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                <User className="h-5 w-5" />
              </div>
            )}
          </button>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in" onClick={() => handleNavClick('profile')}>
              <div className="text-sm font-bold text-gray-900 dark:text-neutral-50 truncate cursor-pointer hover:underline">
                {settings.profile.fullName}
              </div>
              <div className="text-[10px] font-medium text-gray-400 truncate mt-0.5" title={settings.profile.emailAddress}>
                {settings.profile.emailAddress}
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={onLogOut}
              title="Secure Logout"
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar Frame */}
      <aside className={`hidden md:block h-screen sticky top-0 flex-shrink-0 z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[260px] lg:w-[280px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          onClick={() => setIsOpenMobile(false)}
          className="absolute inset-0 bg-[#0a0a0c]/60 backdrop-blur-xs" 
        />
        
        <div 
          className={`absolute inset-y-0 left-0 w-[270px] max-w-xs transition-transform duration-300 ease-out transform ${
            isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
