/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck,
  Calendar,
  BellOff
} from 'lucide-react';
import { PageId, NotificationItem } from '../types';
import { Button, Card, Badge, SectionHeader, TimelineItem } from './bauhaus';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  setActivePage: (page: PageId) => void;
}

export default function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearNotifications,
  setActivePage
}: NotificationsViewProps) {
  
  // Group notifications by day
  const groupTimelines = () => {
    const today = notifications.filter(n => n.timeLabel === 'Today');
    const yesterday = notifications.filter(n => n.timeLabel === 'Yesterday');
    const older = notifications.filter(n => n.timeLabel !== 'Today' && n.timeLabel !== 'Yesterday');
    
    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupTimelines();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai-insights':
        return <Sparkles className="w-4 h-4 text-[#111111]" />;
      case 'collaboration':
        return <MessageSquare className="w-4 h-4 text-[#111111]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#111111]" />;
    }
  };

  const handleActionClick = (actionPage?: PageId) => {
    if (actionPage) {
      setActivePage(actionPage);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* 1. HERO HEADER (Matching Stitch Mockup 5) */}
      <div className="relative rounded-[6px] border-2 border-[#111111] bg-white p-6 md:p-8 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[3px] block">
            NOTEIT LOG SYSTEM
          </span>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-[#111111] uppercase tracking-tight mt-1">
            ACTIVITY CENTER
          </h1>
          <p className="text-xs md:text-sm font-mono text-[#666666] mt-1 border-l-4 border-[#FFC400] pl-3 py-1">
            Track AI synthesis completion alerts, collaborative notes shares, and academic progress logs.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="tertiary"
              size="sm"
              onClick={onMarkAllRead}
              icon={<Check className="h-4 w-4 text-[#19B56B]" />}
            >
              Mark all read
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={onClearNotifications}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Clear Log
            </Button>
          </div>
        )}
      </div>

      {/* 2. TIMELINE OR EMPTY STATE (Matching Stitch Mockup 5) */}
      {notifications.length === 0 ? (
        <Card shadow="lg" className="p-8 md:p-12 bg-white max-w-xl mx-auto border-2 border-[#111111] text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-[6px] bg-[#F6F2EA] border-2 border-[#111111] shadow-paper-sm flex items-center justify-center text-[#111111] mb-4">
            <BellOff className="w-8 h-8 text-[#111111]" />
          </div>

          <h3 className="font-heading text-xl font-extrabold uppercase text-[#111111] tracking-tight mb-2">
            NO NEW ACTIVITY
          </h3>

          <p className="text-xs md:text-sm text-[#666666] font-mono leading-relaxed border-l-2 border-[#FF4D4D] pl-3 py-1 max-w-md mb-6 text-left">
            Your academic transcripts are completely organized and compiled with no outstanding actions. Enjoy the silence.
          </p>

          <Button
            variant="tertiary"
            size="md"
            onClick={() => window.location.reload()}
            className="border-2 border-[#111111] shadow-paper-sm hover:bg-[#FFC400]"
          >
            REFRESH STATUS
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Today Timeline */}
          {today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 section-label text-xs font-bold uppercase tracking-[3px] text-[#666666]">
                <Calendar className="h-3.5 w-3.5" />
                <span>TODAY</span>
              </div>
              <div className="space-y-3">
                {today.map((item) => (
                  <TimelineItem
                    key={item.id}
                    icon={getCategoryIcon(item.category)}
                    title={item.title}
                    timestamp={item.timestamp}
                    description={item.description}
                    category={item.category}
                    action={
                      item.actionLabel ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActionClick(item.actionPage)}
                        >
                          {item.actionLabel}
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday Timeline */}
          {yesterday.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 section-label text-xs font-bold uppercase tracking-[3px] text-[#666666]">
                <Calendar className="h-3.5 w-3.5" />
                <span>YESTERDAY</span>
              </div>
              <div className="space-y-3">
                {yesterday.map((item) => (
                  <TimelineItem
                    key={item.id}
                    icon={getCategoryIcon(item.category)}
                    title={item.title}
                    timestamp={item.timestamp}
                    description={item.description}
                    category={item.category}
                    action={
                      item.actionLabel ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActionClick(item.actionPage)}
                        >
                          {item.actionLabel}
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Older Timeline */}
          {older.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 section-label text-xs font-bold uppercase tracking-[3px] text-[#666666]">
                <Calendar className="h-3.5 w-3.5" />
                <span>PREVIOUS LOGS</span>
              </div>
              <div className="space-y-3">
                {older.map((item) => (
                  <TimelineItem
                    key={item.id}
                    icon={getCategoryIcon(item.category)}
                    title={item.title}
                    timestamp={item.timestamp}
                    description={item.description}
                    category={item.category}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
