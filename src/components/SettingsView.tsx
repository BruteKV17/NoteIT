/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Sparkles, 
  Link2, 
  ShieldCheck, 
  CreditCard,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { PageId, UserSettings } from '../types';

const COUNTRY_CODES = [
  { code: '+1', name: 'United States / Canada (+1)' },
  { code: '+44', name: 'United Kingdom (+44)' },
  { code: '+91', name: 'India (+91)' },
  { code: '+61', name: 'Australia (+61)' },
  { code: '+49', name: 'Germany (+49)' },
  { code: '+33', name: 'France (+33)' },
  { code: '+81', name: 'Japan (+81)' },
  { code: '+86', name: 'China (+86)' },
  { code: '+55', name: 'Brazil (+55)' }
];

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  setActivePage: (page: PageId) => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  setActivePage
}: SettingsViewProps) {
  
  // Local state
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'lms' | 'billing'>('profile');
  
  // Profile edits
  const [firstName, setFirstName] = useState(settings.profile.firstName || '');
  const [lastName, setLastName] = useState(settings.profile.lastName || '');
  const [emailAddress, setEmailAddress] = useState(settings.profile.emailAddress || '');
  const [institution, setInstitution] = useState(settings.profile.institution || '');
  const [countryCode, setCountryCode] = useState(settings.profile.countryCode || '');
  const [phoneNumber, setPhoneNumber] = useState(settings.profile.phoneNumber || '');
  const [error, setError] = useState<string | null>(null);
  
  // Canvas Credentials
  const [canvasUrl, setCanvasUrl] = useState(settings.integrations.canvasUrl || '');
  const [canvasToken, setCanvasToken] = useState('••••••••••••••••••••••••');
  const [isLmsSyncing, setIsLmsSyncing] = useState(false);

  // AI Levels
  const [proactive, setProactive] = useState(settings.aiLevels.proactiveConceptSuggestion);
  const [bibliography, setBibliography] = useState(settings.aiLevels.automatedBibliography);
  const [synthesis, setSynthesis] = useState(settings.aiLevels.highIntensitySynthesis);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize local state with settings prop when it loads asynchronously
  React.useEffect(() => {
    if (settings.profile) {
      setFirstName(settings.profile.firstName || '');
      setLastName(settings.profile.lastName || '');
      setEmailAddress(settings.profile.emailAddress || '');
      setInstitution(settings.profile.institution || '');
      setCountryCode(settings.profile.countryCode || '');
      setPhoneNumber(settings.profile.phoneNumber || '');
    }
    if (settings.integrations) {
      setCanvasUrl(settings.integrations.canvasUrl || '');
    }
    if (settings.aiLevels) {
      setProactive(settings.aiLevels.proactiveConceptSuggestion);
      setBibliography(settings.aiLevels.automatedBibliography);
      setSynthesis(settings.aiLevels.highIntensitySynthesis);
    }
  }, [settings]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !institution.trim() || !emailAddress.trim() || !countryCode || !phoneNumber.trim()) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid phone number (digits only, at least 7 digits).');
      return;
    }

    const updated: UserSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        emailAddress: emailAddress.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        institution: institution.trim(),
        countryCode,
        phoneNumber: cleanPhone,
        onboardingCompleted: true
      }
    };
    onUpdateSettings(updated);
    triggerSaveNotification();
  };

  const handleSaveAISettings = () => {
    const updated: UserSettings = {
      ...settings,
      aiLevels: {
        proactiveConceptSuggestion: proactive,
        automatedBibliography: bibliography,
        highIntensitySynthesis: synthesis
      }
    };
    onUpdateSettings(updated);
    triggerSaveNotification();
  };

  const handleTriggerLmsSync = () => {
    setIsLmsSyncing(true);
    setTimeout(() => {
      setIsLmsSyncing(false);
      const updated: UserSettings = {
        ...settings,
        integrations: {
          canvasConnected: true,
          blackboardConnected: false,
          canvasUrl,
          lastSynced: 'Just now'
        }
      };
      onUpdateSettings(updated);
      triggerSaveNotification();
    }, 2000);
  };

  const triggerSaveNotification = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto pb-12">
      
      {/* Settings Navigation Menu Sidebar (1 Column) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-1.5 h-fit">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'ai', label: 'AI Parameters', icon: Sparkles },
          { id: 'lms', label: 'Canvas/LMS portal', icon: Link2 },
          { id: 'billing', label: 'Billing & Plan', icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-sans text-xs font-semibold tracking-tight transition-all focus:outline-none ${
                isActive
                  ? 'bg-black text-white shadow-xs'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form Block (3 Columns) */}
      <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs relative">
        
        {saveSuccess && (
          <div className="absolute top-4 right-6 rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 animate-bounce z-50">
            <Check className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}

        {/* Tab content panel */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <h3 className="font-sans font-bold text-base text-gray-950">User Profile</h3>
              <p className="text-xs text-gray-400 mt-1">Configure your primary academic researcher identification and institutional information.</p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
                <span className="text-xs text-red-500 font-semibold">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase">FIRST NAME</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase">LAST NAME</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase">UNIVERSITY / SCHOOL NAME</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">CODE</label>
                <select
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 mt-1 focus:border-black focus:bg-white outline-none cursor-pointer"
                >
                  <option value="" disabled>Select</option>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">PHONE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-black px-4.5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-all active:scale-95 shadow-xs"
              >
                Save Profile Outlines
              </button>
            </div>
          </form>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-sans font-bold text-base text-gray-950">AI Generator Parameters</h3>
              <p className="text-xs text-gray-400 mt-1">Calibrate model parameters according to your reading and cognitive retention speed.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between gap-4 p-3.5 border border-gray-150 rounded-xl hover:bg-gray-50/50">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-900">Proactive Concept Suggestion</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                    Automatically recommend linked articles and weak-topics material in your dashboard based on note contexts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={proactive}
                  onChange={(e) => setProactive(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 border border-gray-150 rounded-xl hover:bg-gray-50/50">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-900">Automated Bibliography Generation</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                    Precompile standard LaTeX style citations references for uploaded PDFs or external research paper URLs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={bibliography}
                  onChange={(e) => setBibliography(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 border border-gray-150 rounded-xl hover:bg-gray-50/50">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-900">High-Intensity Synthesis Engine</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                    Apply deeper token-scanning parameters for massive 100+ page textbook outlines. (Requires Researcher tier subscription).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={synthesis}
                  disabled={settings.subscription.planName === 'Scholar'}
                  onChange={(e) => setSynthesis(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black h-4.5 w-4.5 mt-0.5 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSaveAISettings}
                className="rounded-xl bg-black px-4.5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-all shadow-xs"
              >
                Save Parameters
              </button>
            </div>
          </div>
        )}

        {activeTab === 'lms' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-sans font-bold text-base text-gray-950">Canvas LMS Sync Portal</h3>
              <p className="text-xs text-gray-400 mt-1">Interfacing Note-IT AI with Canvas allows automated downloading of semester presentations, homework documents, and syllabi.</p>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase">INSTITUTION CANVAS HOSTING DOMAIN</label>
                <div className="flex gap-2 mt-1">
                  <span className="inline-flex items-center rounded-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-400">
                    https://
                  </span>
                  <input
                    type="text"
                    value={canvasUrl}
                    onChange={(e) => setCanvasUrl(e.target.value)}
                    placeholder="e.g. camb-uni.instructure.com"
                    className="flex-1 rounded-r-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 outline-none focus:border-black focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase">CANVAS API DEVELOPER ACCESS KEY</label>
                <input
                  type="password"
                  value={canvasToken}
                  onChange={(e) => setCanvasToken(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-mono text-gray-900 mt-1 focus:border-black outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  Generated inside Settings &gt; Approved Integrations inside your student Canvas account profile. We encrypt keys before local caching.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-950">Integration Status</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {settings.integrations.canvasConnected 
                      ? `Last synchronized: ${settings.integrations.lastSynced || 'Never'}` 
                      : 'Not connected'}
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  settings.integrations.canvasConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {settings.integrations.canvasConnected ? 'ACTIVE CANAL' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={handleTriggerLmsSync}
                disabled={isLmsSyncing || !canvasUrl}
                className="flex items-center gap-1.5 rounded-xl bg-black px-4.5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {isLmsSyncing && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>{isLmsSyncing ? 'Authorizing Key...' : 'Validate & Sync Coursework'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-sans font-bold text-base text-gray-950">Plan & Subscription Overview</h3>
              <p className="text-xs text-gray-400 mt-1">Review active tiers, billing periods, and features limits.</p>
            </div>

            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded tracking-wide uppercase">
                    ACTIVE PLAN
                  </span>
                  <h4 className="font-sans font-bold text-lg text-slate-900 mt-1.5">Note-IT {settings.subscription.planName} Tier</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Renews automatically on <strong className="text-gray-900 font-semibold">{settings.subscription.nextBillDate}</strong></p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-gray-900 font-mono">{settings.subscription.price}</div>
                  <div className="text-[10px] font-medium text-gray-400 mt-0.5">billed {settings.subscription.billingCycle}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">FEATURES INCLUDED:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 font-medium font-sans">
                  {settings.subscription.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="bg-green-100 text-green-700 rounded-full h-4 w-4 flex items-center justify-center p-0.5 flex-shrink-0">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Want to scale up with collaborative research workspaces?</span>
              <button
                onClick={() => setActivePage('pricing')}
                className="flex items-center gap-1 rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-all focus:outline-none"
              >
                <span>Compare All SaaS Plans</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
