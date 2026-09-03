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
  BookMarked,
  Trophy,
  X,
  Mic,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ExternalLink,
  HelpCircle,
  Target
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import AILogo from './AILogo';
import { SidebarItem, Button, Badge } from './bauhaus';

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
    { id: 'quiz-mode', label: 'Preparation Mode', icon: Target },
    { id: 'rewards', label: 'Rewards & XP', icon: Trophy, badge: 'XP' }
  ];

  const accountItems = [
    { id: 'notifications', label: 'Activity Center', icon: Bell, indicator: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (pageId: PageId) => {
    setActivePage(pageId);
    setIsOpenMobile(false);
  };

  const isPro = settings.subscription.planName !== 'BYOK';

  const sidebarContent = (
    <div className={`flex h-full flex-col select-none transition-all duration-200 bg-[var(--sidebar-bg)] text-[var(--text-primary)] border-r border-[var(--border-main)] ${
      isCollapsed ? 'w-20' : 'w-[260px] lg:w-[280px]'
    }`}>
      
      {/* Brand area */}
      <div className={`flex h-16 items-center border-b border-[var(--border-main)] bg-[var(--card-bg)] ${
        isCollapsed ? 'justify-center px-1 gap-1' : 'justify-between px-4'
      }`}>
        <div 
          className="flex items-center gap-2 cursor-pointer overflow-hidden truncate"
          onClick={() => handleNavClick('dashboard')}
        >
          <div className="p-1 rounded-[6px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm shrink-0">
            <AILogo size={26} theme="light" />
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="font-heading font-bold text-base tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
                NOTEIT
                <span className="rounded-[3px] bg-[#FFC400] px-1 py-0.2 text-[9px] font-bold text-[#111111] border border-[var(--border-main)] font-mono">
                  v2.0
                </span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[2px] text-[var(--text-secondary)] font-mono">
                COGNITIVE LAB
              </div>
            </div>
          )}
        </div>

        {/* Mobile close trigger */}
        <button 
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-paper-sm hover:bg-[#FFC400] hover:text-[#111111]"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-paper-sm hover:bg-[#FFC400] hover:text-[#111111] focus:outline-none shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Primary Capture Live Trigger */}
      {!isCollapsed && onNewAnalysis && (
        <div className="px-4 py-3 border-b-2 border-[var(--border-main)] space-y-2">
          <div data-tour="capture-live">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => handleNavClick('lecture-capture')}
              icon={<Mic className="h-4 w-4 animate-pulse text-[#FF4D4D]" />}
            >
              Capture Live Course
            </Button>
          </div>
          <div data-tour="ask-doubt">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => window.dispatchEvent(new CustomEvent('noteit_open_ask_doubt'))}
              icon={<HelpCircle className="h-4 w-4 text-[#38BDF8]" />}
              className="border-[#38BDF8]/40 hover:border-[#38BDF8]"
            >
              Ask Doubt
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Workspace section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
              MAIN WORKSPACE
            </div>
          )}

          {workspaceItems.map((item) => (
            <div key={item.id} data-tour={item.id === 'dashboard' ? 'dashboard-link' : item.id}>
              <SidebarItem
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                badge={item.badge}
                active={activePage === item.id}
                onClick={() => handleNavClick(item.id as PageId)}
                collapsed={isCollapsed}
              />
            </div>
          ))}
        </div>

        {/* Account section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
              SYSTEM & CONTROL
            </div>
          )}

          {accountItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
              active={activePage === item.id}
              hasNotificationDot={item.indicator}
              notificationColor="yellow"
              onClick={() => handleNavClick(item.id as PageId)}
              collapsed={isCollapsed}
            />
          ))}
        </div>
        {/* Subscription callout banner */}
        {!isCollapsed && (
          <div className="mt-4 p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-heading text-[11px] font-bold uppercase text-[var(--text-primary)]">
                {settings.subscription.planName} MEMBER
              </span>
              <Badge variant={isPro ? "yellow" : "red"} size="sm">
                {isPro ? "ACTIVE" : "FREE"}
              </Badge>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono mb-2">
              {isPro ? 'Direct API Key Mode' : 'Bring Your Own Key Mode'}
            </p>
            <Button
              variant="tertiary"
              size="sm"
              fullWidth
              onClick={() => handleNavClick('pricing')}
              icon={<ExternalLink className="h-3 w-3" />}
              iconPosition="right"
            >
              {isPro ? 'Upgrade SaaS Plan' : 'Unleash Pro Tiers'}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Profile Identity card (Always pinned to bottom) */}
      <div className="border-t-2 border-[var(--border-main)] p-3 bg-[var(--card-bg)] shrink-0 sticky bottom-0 z-20 shadow-paper-md">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-2 cursor-pointer min-w-0"
            onClick={() => handleNavClick('profile')}
            title="Update Profile"
          >
            {settings.profile.avatarUrl ? (
              <img
                src={settings.profile.avatarUrl}
                alt={settings.profile.fullName}
                className="h-8 w-8 rounded-[4px] border-2 border-[var(--border-main)] object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-[4px] border-2 border-[var(--border-main)] bg-[#FFC400] flex items-center justify-center font-bold text-xs text-[#111111] shrink-0">
                {settings.profile.fullName ? settings.profile.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate font-heading uppercase">
                  {settings.profile.fullName || 'Academic Scholar'}
                </div>
                <div className="text-[10px] font-mono text-[var(--text-secondary)] truncate" title={settings.profile.emailAddress}>
                  {settings.profile.emailAddress}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogOut}
              title="Secure Logout"
              className="p-1.5 rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] text-[var(--text-primary)] hover:bg-[#FF4D4D] hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar Frame */}
      <aside className={`hidden md:block h-screen sticky top-0 shrink-0 z-30 transition-all duration-200 ${isCollapsed ? 'w-20' : 'w-[260px] lg:w-[280px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          onClick={() => setIsOpenMobile(false)}
          className="absolute inset-0 bg-[#111111]/70 backdrop-blur-[2px]" 
        />
        
        <div 
          className={`absolute inset-y-0 left-0 w-[270px] max-w-xs transition-transform duration-200 ease-out transform ${
            isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
