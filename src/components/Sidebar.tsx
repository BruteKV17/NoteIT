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

  const isPro = settings.subscription.planName !== 'BYOK';

  const sidebarContent = (
    <div className={`flex h-full flex-col select-none transition-all duration-200 bg-[#F6F2EA] text-[#111111] border-r border-[#111111] ${
      isCollapsed ? 'w-20' : 'w-[260px] lg:w-[280px]'
    }`}>
      
      {/* Brand area */}
      <div className={`flex h-16 items-center border-b border-[#111111] bg-white ${
        isCollapsed ? 'justify-center px-1 gap-1' : 'justify-between px-4'
      }`}>
        <div 
          className="flex items-center gap-2 cursor-pointer overflow-hidden truncate"
          onClick={() => handleNavClick('landing')}
        >
          <div className="p-1 rounded-[6px] bg-[#FFC400] border-2 border-[#111111] shadow-paper-sm shrink-0">
            <AILogo size={26} theme="light" />
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="font-heading font-bold text-base tracking-tight text-[#111111] flex items-center gap-1.5">
                NOTEIT
                <span className="rounded-[3px] bg-[#FFC400] px-1 py-0.2 text-[9px] font-bold text-[#111111] border border-[#111111] font-mono">
                  v1.5
                </span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[2px] text-[#666666] font-mono">
                COGNITIVE LAB
              </div>
            </div>
          )}
        </div>

        {/* Mobile close trigger */}
        <button 
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] shadow-paper-sm hover:bg-[#FFC400]"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] shadow-paper-sm hover:bg-[#FFC400] focus:outline-none shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Primary Capture Live Trigger */}
      {!isCollapsed && onNewAnalysis && (
        <div className="px-4 py-3 border-b-2 border-[#111111]">
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
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        
        {/* GROUP 1: WORKSPACE */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 mb-1.5 section-label text-[10px] font-bold uppercase tracking-[3px] text-[#666666]">
              WORKSPACE
            </div>
          )}
          {workspaceItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <SidebarItem
                key={item.id}
                icon={<IconComponent className="w-4 h-4" />}
                label={item.label}
                badge={item.badge}
                active={isActive}
                collapsed={isCollapsed}
                onClick={() => handleNavClick(item.id as PageId)}
              />
            );
          })}
        </div>

        {/* GROUP 2: ACCOUNT */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 mb-1.5 section-label text-[10px] font-bold uppercase tracking-[3px] text-[#666666]">
              ACCOUNT
            </div>
          )}
          {accountItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <SidebarItem
                key={item.id}
                icon={<IconComponent className="w-4 h-4" />}
                label={item.label}
                hasNotificationDot={item.indicator}
                active={isActive}
                collapsed={isCollapsed}
                onClick={() => handleNavClick(item.id as PageId)}
              />
            );
          })}
        </div>

      </div>

      {/* Subscription premium Tier banner */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-t-2 border-[#111111] bg-white m-3 rounded-[6px] shadow-paper-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#FFC400] border border-[#111111]" />
            <span className="font-heading text-xs font-bold text-[#111111] uppercase tracking-tight truncate">
              Note-IT {settings.subscription.planName} Plan
            </span>
          </div>
          <p className="text-[10px] text-[#666666] font-mono mb-2">
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

      {/* Bottom Profile Identity card */}
      <div className="border-t-2 border-[#111111] p-3 bg-white">
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
                className="h-8 w-8 rounded-[4px] border-2 border-[#111111] object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-[4px] border-2 border-[#111111] bg-[#FFC400] flex items-center justify-center font-bold text-xs text-[#111111] shrink-0">
                {settings.profile.fullName ? settings.profile.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#111111] truncate font-heading uppercase">
                  {settings.profile.fullName || 'Academic Scholar'}
                </div>
                <div className="text-[10px] font-mono text-[#666666] truncate" title={settings.profile.emailAddress}>
                  {settings.profile.emailAddress}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogOut}
              title="Secure Logout"
              className="p-1.5 rounded-[4px] border-2 border-[#111111] bg-[#F6F2EA] text-[#111111] hover:bg-[#FF4D4D] hover:text-white transition-colors"
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
