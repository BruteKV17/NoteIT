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
  FolderPlus, 
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { PageId, NotificationItem } from '../types';

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
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
        );
      case 'collaboration':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  const handleActionClick = (actionPage?: PageId) => {
    if (actionPage) {
      setActivePage(actionPage);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title & mark-all-read toolbar panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 tracking-tight">Activity Center</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track AI synthesis completion alerts, collaborative notes shares, and academic progress logs.</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none"
            >
              <Check className="h-4.5 w-4.5 text-green-600" />
              <span>Mark all as read</span>
            </button>
            <button
              onClick={onClearNotifications}
              className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-150 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none"
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>Clear Activity</span>
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-gray-100 mx-auto">
            <Bell className="h-5.5 w-5.5 text-slate-400" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">No new activity</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Your academic transcripts are completely organized and compiled with no outstanding actions.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline Section: Today */}
          {today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                <span>Today</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-250 divide-y divide-gray-150 overflow-hidden shadow-xs">
                {today.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 flex items-start gap-4 transition-colors ${item.read ? 'bg-white' : 'bg-indigo-50/15'}`}
                  >
                    {getCategoryIcon(item.category)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-[13px] font-bold truncate ${item.read ? 'text-gray-900' : 'text-slate-900'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{item.timestamp}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 leading-normal">
                        {item.description}
                      </p>

                      {/* Action trigger links mapped */}
                      {item.actionLabel && (
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => handleActionClick(item.actionPage)}
                            className="group flex items-center gap-1 text-[11px] font-bold text-black border-b border-black pb-0.5 hover:opacity-75 focus:outline-none"
                          >
                            <span>{item.actionLabel}</span>
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                          
                          {!item.read && (
                            <button
                              onClick={() => onMarkRead(item.id)}
                              className="text-[10px] font-semibold text-gray-400 hover:text-black focus:outline-none"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section: Yesterday */}
          {yesterday.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">
                Yesterday
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#F3F4F6] overflow-hidden">
                {yesterday.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 flex items-start gap-4 transition-colors ${item.read ? 'bg-white' : 'bg-indigo-50/10'}`}
                  >
                    {getCategoryIcon(item.category)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-bold text-gray-950 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">{item.timestamp}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>

                      {item.actionLabel && (
                        <div className="mt-2.5 flex items-center gap-3">
                          <button
                            onClick={() => handleActionClick(item.actionPage)}
                            className="text-[11px] font-bold text-black border-b border-black pb-0.5"
                          >
                            {item.actionLabel}
                          </button>
                          {!item.read && (
                            <button
                              onClick={() => onMarkRead(item.id)}
                              className="text-[10px] font-semibold text-gray-400 hover:text-black focus:outline-none"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Older Timelines */}
          {older.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">
                Earlier Actions
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-[#F3F4F6] overflow-hidden">
                {older.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 flex items-start gap-4"
                  >
                    {getCategoryIcon(item.category)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-bold text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
