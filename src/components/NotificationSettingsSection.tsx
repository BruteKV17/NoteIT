/**
 * Notification Settings Section Component
 * Embedded in NoteIT SettingsView page to control push notification preferences.
 */

import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, BellOff, Sparkles, Check, RefreshCw } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { 
  getUserNotificationPreferences, 
  saveUserNotificationPreferences, 
  getNotificationPermissionState,
  requestNotificationPermission,
  DEFAULT_NOTIFICATION_PREFERENCES,
  UserNotificationPreferences 
} from '../services/notificationService';

export default function NotificationSettingsSection({
  onTriggerSave
}: {
  onTriggerSave?: () => void;
}) {
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [loading, setLoading] = useState(true);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    setPermissionState(getNotificationPermissionState());

    if (user) {
      getUserNotificationPreferences(user.uid).then((prefs) => {
        setPreferences(prefs);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleToggleMaster = async (enabled: boolean) => {
    const updated = {
      ...preferences,
      masterEnabled: enabled
    };
    setPreferences(updated);
    await persistPreferences(updated);
  };

  const handleToggleCategory = async (key: keyof UserNotificationPreferences, value: boolean) => {
    const updated = {
      ...preferences,
      [key]: value
    };
    setPreferences(updated);
    await persistPreferences(updated);
  };

  const handleDisableAll = async () => {
    const disabled: UserNotificationPreferences = {
      ...preferences,
      masterEnabled: false,
      studyReminders: false,
      xpRewards: false,
      streakAlerts: false,
      lectureUpdates: false,
      quizPractice: false,
      facultyDoubtUpdates: false
    };
    setPreferences(disabled);
    await persistPreferences(disabled);
  };

  const persistPreferences = async (updated: UserNotificationPreferences) => {
    const user = auth.currentUser;
    if (user) {
      await saveUserNotificationPreferences(user.uid, updated);
      if (onTriggerSave) onTriggerSave();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleEnableBrowserPermission = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setRequestingPermission(true);
    try {
      const res = await requestNotificationPermission(user.uid);
      setPermissionState(res.permission);
    } finally {
      setRequestingPermission(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] flex items-center justify-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
        <RefreshCw className="h-4 w-4 animate-spin text-[#FFC400]" />
        <span>Loading notification preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none text-[var(--text-primary)]">
      
      {/* Header */}
      <div>
        <h3 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)] flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#FFC400]" />
          Push Notification Preferences
        </h3>
        <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1">
          Control background web push notifications delivered to your computer and mobile browser via Firebase Cloud Messaging.
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-[4px] border-2 border-[var(--border-main)] bg-[#19B56B] text-white p-3 text-xs font-mono font-extrabold flex items-center gap-2 shadow-paper-sm">
          <Check className="h-4 w-4" />
          <span>NOTIFICATION PREFERENCES SAVED</span>
        </div>
      )}

      {/* Browser Permission Status Telemetry Card */}
      <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-paper-sm font-mono text-xs">
        <div>
          <div className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase">
            Browser Web Push Permission Status
          </div>
          <div className="mt-1 font-extrabold flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-[4px] border border-[var(--border-main)] text-[10px] uppercase font-extrabold ${
              permissionState === 'granted'
                ? 'bg-[#19B56B] text-white'
                : permissionState === 'denied'
                ? 'bg-[#FF4D4D] text-white'
                : 'bg-[#FFC400] text-[#111111]'
            }`}>
              {permissionState.toUpperCase()}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {permissionState === 'granted'
                ? 'Browser is configured to receive background push notifications.'
                : permissionState === 'denied'
                ? 'Blocked in browser settings. Please allow notifications in browser URL bar.'
                : 'Permission not yet granted by browser.'}
            </span>
          </div>
        </div>

        {permissionState === 'default' && (
          <button
            type="button"
            onClick={handleEnableBrowserPermission}
            disabled={requestingPermission}
            className="px-4 py-2 rounded-[4px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase hover:bg-[#ffe066] transition-all shadow-paper-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>{requestingPermission ? 'Requesting...' : 'Enable Browser Push'}</span>
          </button>
        )}
      </div>

      {/* Master Toggle Card */}
      <div className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] flex items-center justify-between gap-4 shadow-paper-sm">
        <div>
          <h4 className="font-heading font-extrabold text-sm uppercase text-[var(--text-primary)]">
            Master Push Notifications Toggle
          </h4>
          <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-0.5">
            Enable or pause all background learning reminders, streak alerts, and XP drops.
          </p>
        </div>
        <input
          type="checkbox"
          checked={preferences.masterEnabled}
          onChange={(e) => handleToggleMaster(e.target.checked)}
          className="h-6 w-6 rounded border-2 border-[var(--border-main)] accent-[#FFC400] cursor-pointer"
        />
      </div>

      {/* Quiet Hours & Delivery Constraints */}
      <div className={`p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] space-y-4 shadow-paper-sm transition-all ${preferences.masterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-heading font-extrabold text-xs uppercase text-[var(--text-primary)]">
              Quiet Hours Schedule
            </h4>
            <p className="text-[11px] font-mono text-[var(--text-secondary)] font-bold mt-0.5">
              Pause normal notifications during sleep hours (Streak warnings exempt).
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.quietHours?.enabled ?? true}
            onChange={(e) => {
              const updated = {
                ...preferences,
                quietHours: {
                  ...(preferences.quietHours || { start: "22:30", end: "08:00" }),
                  enabled: e.target.checked
                }
              };
              setPreferences(updated);
              persistPreferences(updated);
            }}
            className="h-5 w-5 rounded border-2 border-[var(--border-main)] accent-[#FFC400] cursor-pointer"
          />
        </div>

        {preferences.quietHours?.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-main)] font-mono text-xs">
            <div>
              <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase block mb-1">
                Quiet Hours Start (From)
              </label>
              <input
                type="time"
                value={preferences.quietHours?.start || "22:30"}
                onChange={(e) => {
                  const updated = {
                    ...preferences,
                    quietHours: {
                      ...(preferences.quietHours || { enabled: true, end: "08:00" }),
                      start: e.target.value
                    }
                  };
                  setPreferences(updated);
                  persistPreferences(updated);
                }}
                className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-main)] p-2 rounded-[4px] font-bold text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase block mb-1">
                Quiet Hours End (Until)
              </label>
              <input
                type="time"
                value={preferences.quietHours?.end || "08:00"}
                onChange={(e) => {
                  const updated = {
                    ...preferences,
                    quietHours: {
                      ...(preferences.quietHours || { enabled: true, start: "22:30" }),
                      end: e.target.value
                    }
                  };
                  setPreferences(updated);
                  persistPreferences(updated);
                }}
                className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-main)] p-2 rounded-[4px] font-bold text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-main)] font-mono text-xs">
          <div>
            <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase block mb-1">
              Max Notifications Per Day
            </label>
            <select
              value={preferences.dailyLimit || 2}
              onChange={(e) => {
                const updated = { ...preferences, dailyLimit: parseInt(e.target.value, 10) };
                setPreferences(updated);
                persistPreferences(updated);
              }}
              className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-main)] p-2 rounded-[4px] font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value={1}>1 notification / day</option>
              <option value={2}>2 notifications / day (Recommended)</option>
              <option value={4}>4 notifications / day</option>
              <option value={6}>6 notifications / day</option>
              <option value={8}>8 notifications / day</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase block mb-1">
              Minimum Cooldown Between Alerts
            </label>
            <select
              value={preferences.cooldownMinutes || 240}
              onChange={(e) => {
                const updated = { ...preferences, cooldownMinutes: parseInt(e.target.value, 10) };
                setPreferences(updated);
                persistPreferences(updated);
              }}
              className="w-full bg-[var(--card-bg)] border-2 border-[var(--border-main)] p-2 rounded-[4px] font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours (Recommended)</option>
              <option value={360}>6 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Granular Toggles */}
      <div className={`space-y-3 transition-all ${preferences.masterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <span className="text-[10px] font-mono font-extrabold text-[var(--text-secondary)] uppercase tracking-widest block px-1">
          NOTIFICATION CATEGORY CONTROLS
        </span>

        {[
          { key: 'studyReminders', title: 'Study & Revision Reminders', desc: 'Alerts when topics need revision or lecture notes are synthesized.' },
          { key: 'xpRewards', title: 'XP & Rewards Drops', desc: 'Notifications for daily XP availability, leveling up, and reward badges.' },
          { key: 'streakAlerts', title: 'Daily Streak Alerts', desc: 'Evening warnings before your active daily streak is at risk of breaking.' },
          { key: 'lectureUpdates', title: 'Lecture Processing Updates', desc: 'Notifications when audio recordings or document processing finishes.' },
          { key: 'quizPractice', title: 'Quiz & Practice Challenges', desc: 'Memory retention checks, 5-question quizzes, and weekend challenges.' },
          { key: 'facultyDoubtUpdates', title: 'Faculty & Doubt Updates', desc: 'Notifications when faculty answers your academic questions or posts updates.' }
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <div>
              <h4 className="text-xs font-heading font-extrabold uppercase text-[var(--text-primary)]">
                {item.title}
              </h4>
              <p className="text-[11px] font-mono text-[var(--text-secondary)] font-bold mt-0.5">
                {item.desc}
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(preferences[item.key as keyof UserNotificationPreferences])}
              onChange={(e) => handleToggleCategory(item.key as keyof UserNotificationPreferences, e.target.checked)}
              className="h-5 w-5 rounded border-2 border-[var(--border-main)] accent-[#FFC400] cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Opt-Out Disable All Button */}
      <div className="pt-4 border-t-2 border-[var(--border-main)] flex justify-between items-center">
        <button
          type="button"
          onClick={handleDisableAll}
          className="px-4 py-2.5 rounded-[4px] border-2 border-[var(--border-main)] bg-[#FF4D4D]/15 hover:bg-[#FF4D4D] text-[#FF4D4D] hover:text-white font-mono text-xs font-extrabold uppercase transition-all shadow-paper-sm flex items-center gap-2 cursor-pointer"
        >
          <BellOff className="h-4 w-4" />
          <span>Disable All Notifications</span>
        </button>
      </div>

    </div>
  );
}
