/**
 * Non-Intrusive Notification Permission Banner for NoteIT AI
 * Only prompts for browser permission after explicit user click on [Enable Notifications].
 */

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { 
  getNotificationPermissionState, 
  requestNotificationPermission 
} from '../services/notificationService';
import { auth } from '../firebaseConfig';

export default function NotificationPermissionBanner() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeniedHelp, setShowDeniedHelp] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const currentState = getNotificationPermissionState();
    setPermissionState(currentState);

    const dismissedInSession = sessionStorage.getItem('noteit_notification_prompt_dismissed') === 'true';
    if (dismissedInSession) {
      setIsDismissed(true);
    }
  }, []);

  const handleEnableClick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setShowDeniedHelp(false);

    try {
      const res = await requestNotificationPermission(user.uid);
      setPermissionState(res.permission);

      if (res.success && res.permission === 'granted') {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      } else if (res.permission === 'denied') {
        setShowDeniedHelp(true);
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('noteit_notification_prompt_dismissed', 'true');
  };

  // If permission is already granted, dismissed in session, or unsupported: do not show prompt banner
  if (permissionState === 'granted' || isDismissed || permissionState === 'unsupported') {
    if (showSuccessToast) {
      return (
        <div className="fixed bottom-5 right-5 z-50 rounded-[6px] border-2 border-[var(--border-main)] bg-[#19B56B] text-white p-3.5 shadow-paper-lg flex items-center gap-3 text-xs font-mono font-extrabold max-w-sm animate-bounce">
          <div className="p-1 rounded-full bg-white/20">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="uppercase tracking-wide font-extrabold">Notifications Enabled!</div>
            <div className="text-[10px] font-bold opacity-90 mt-0.5">
              You'll get streak warnings, XP drops & lecture reminders even when NoteIT is closed.
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-full bg-[#0c0e17] border-b-2 border-[#FFC400] text-white px-4 py-3 shadow-paper-md relative z-40 transition-all select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
        
        {/* Left Info Column with NoteIT Logo Branding */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[6px] bg-[#242834] border border-[#FFC400]/40 flex items-center justify-center shrink-0 p-1">
            <img src="/favicon.svg" alt="NoteIT Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="font-heading font-extrabold text-sm uppercase text-[#FFC400] tracking-wide flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-[#FFC400]" />
              <span>Enable NoteIT Notifications</span>
            </div>
            <p className="text-[11px] font-bold text-gray-300 mt-0.5 max-w-2xl leading-tight">
              Get reminders, XP drops, streak alerts and important learning updates even when NoteIT is closed.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-[4px] border border-gray-600 bg-transparent text-gray-300 hover:text-white hover:bg-white/10 font-bold uppercase text-[11px] transition-colors cursor-pointer"
          >
            Not Now
          </button>
          
          <button
            onClick={handleEnableClick}
            disabled={loading}
            className="px-4 py-1.5 rounded-[4px] border-2 border-[#111111] bg-[#FFC400] text-[#111111] font-extrabold uppercase text-[11px] hover:bg-[#ffe066] transition-all shadow-paper-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{loading ? 'Requesting...' : 'Enable Notifications'}</span>
          </button>
        </div>
      </div>

      {/* Instruction alert if user denied permission previously */}
      {showDeniedHelp && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-red-500/40 text-[11px] font-mono text-red-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
          <span>
            Notifications are blocked in your browser settings. To allow them, click the lock/settings icon next to the URL bar in your browser and toggle <strong>Notifications</strong> to <strong>Allow</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
