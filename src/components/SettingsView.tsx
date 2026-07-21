/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Sparkles, 
  Link2, 
  ShieldCheck, 
  CreditCard,
  Check,
  RefreshCw,
  ExternalLink,
  Key,
  Trash2,
  Lock,
  ChevronDown,
  Search,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

const PROVIDER_METADATA: Record<string, {
  name: string;
  description: string;
  defaultModel: string;
  docLink: string;
  getKeyLink: string;
  models: string[];
  endpoint: string;
}> = {
  gemini: {
    name: 'Google Gemini',
    description: 'Highly capable multimodal model for fast note synthesis, quizzes, and mind maps.',
    defaultModel: 'gemini-2.5-flash',
    docLink: 'https://ai.google.dev/gemini-api/docs',
    getKeyLink: 'https://aistudio.google.com/apikey',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    endpoint: 'generativelanguage.googleapis.com'
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-low latency open models. Excellent for speedy revision synthesis.',
    defaultModel: 'llama-3.3-70b-versatile',
    docLink: 'https://console.groq.com/docs',
    getKeyLink: 'https://console.groq.com/keys',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    endpoint: 'api.groq.com/openai/v1'
  },
  openai: {
    name: 'OpenAI',
    description: 'Industry-standard general purpose models with high accuracy and speed.',
    defaultModel: 'gpt-4o-mini',
    docLink: 'https://platform.openai.com/docs',
    getKeyLink: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'o3-mini', 'o1-mini'],
    endpoint: 'api.openai.com/v1'
  },
  claude: {
    name: 'Anthropic Claude',
    description: 'Advanced reasoning and writing capabilities. Top-tier notes output quality.',
    defaultModel: 'claude-3-5-sonnet-latest',
    docLink: 'https://docs.anthropic.com',
    getKeyLink: 'https://console.anthropic.com/settings/keys',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-20240229'],
    endpoint: 'api.anthropic.com/v1'
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'High-performance cost-effective reasoning and general-purpose models.',
    defaultModel: 'deepseek-chat',
    docLink: 'https://api-docs.deepseek.com',
    getKeyLink: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    endpoint: 'api.deepseek.com/v1'
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access any open or closed model through a single unified API key.',
    defaultModel: 'google/gemini-2.5-flash',
    docLink: 'https://openrouter.ai/docs',
    getKeyLink: 'https://openrouter.ai/keys',
    models: ['google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini'],
    endpoint: 'openrouter.ai/api/v1'
  },
  mistral: {
    name: 'Mistral',
    description: 'Sovereign European open-source models with high academic synthesis reasoning.',
    defaultModel: 'mistral-large-latest',
    docLink: 'https://docs.mistral.ai',
    getKeyLink: 'https://console.mistral.ai/api-keys',
    models: ['mistral-large-latest', 'mistral-small-latest', 'open-mixtral-8x22b', 'codestral-latest'],
    endpoint: 'api.mistral.ai/v1'
  },
  grok: {
    name: 'xAI Grok',
    description: 'Advanced reasoning, vision, and real-time knowledge capabilities from xAI.',
    defaultModel: 'grok-2-1212',
    docLink: 'https://docs.x.ai',
    getKeyLink: 'https://console.x.ai',
    models: ['grok-2-1212', 'grok-beta'],
    endpoint: 'api.x.ai/v1'
  }
};

const PROVIDER_COSTS: Record<string, { input: number; output: number }> = {
  gemini: { input: 0.075, output: 0.30 }, // per million tokens
  groq: { input: 0.59, output: 0.79 },
  openai: { input: 0.15, output: 0.60 },
  claude: { input: 3.00, output: 15.00 },
  deepseek: { input: 0.14, output: 0.28 },
  openrouter: { input: 0.10, output: 0.40 },
  mistral: { input: 2.00, output: 6.00 },
  grok: { input: 2.00, output: 10.00 }
};


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
  theme?: 'light' | 'dark';
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme = 'dark'
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

  // AI Provider & API Keys state
  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  
  // Search & custom dropdowns
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Configuration Status state
  const [configStatus, setConfigStatus] = useState<{
    configured: boolean;
    provider?: string;
    maskedKey?: string;
    lastValidated?: string | null;
    selectedModel?: string;
    usageStats?: {
      todayRequests: number;
      estimatedTokens: number;
      avgResponseTime: number;
      failedRequests: number;
      errors429: number;
      errors503: number;
    };
    estimatedMonthlyTokens?: number;
    lastHealthCheck?: {
      status: string;
      latency: number;
      checkedAt: string;
    };
  } | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [revalidating, setRevalidating] = useState(false);
  const [deletingKey, setDeletingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showReplaceForm, setShowReplaceForm] = useState(false);


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

  const fetchConfigStatus = async () => {
    setIsLoadingConfig(true);
    setValidationError(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai/config-status`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
        if (data.configured) {
          setAiProvider(data.provider || 'gemini');
          setSelectedModel(data.selectedModel || PROVIDER_METADATA[data.provider || 'gemini']?.defaultModel || '');
        }
      }
    } catch (err) {
      console.error('Error fetching AI config status:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      fetchConfigStatus();
    }
  }, [activeTab]);

  const handleRevalidateKey = async () => {
    setRevalidating(true);
    setValidationError(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai/revalidate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        triggerSaveNotification();
        await fetchConfigStatus();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setValidationError(errorData.error || 'Failed to revalidate API key.');
      }
    } catch (err: any) {
      console.error('Error revalidating key:', err);
      setValidationError('Failed to revalidate API key. Please check network connection.');
    } finally {
      setRevalidating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!window.confirm('Are you sure you want to delete your API key configuration? This will lock your workspace until a new key is validated.')) {
      return;
    }
    setDeletingKey(true);
    setValidationError(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai/config`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setValidationError(errorData.error || 'Failed to delete API key.');
      }
    } catch (err: any) {
      console.error('Error deleting key:', err);
      setValidationError('Failed to delete key. Please check network connection.');
    } finally {
      setDeletingKey(false);
    }
  };

  const handleSaveNewKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) {
      setValidationError('Please enter a new API key.');
      return;
    }
    setSavingKey(true);
    setValidationError(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          key: newKey.trim(),
          provider: aiProvider,
          model: selectedModel
        })
      });
      if (res.ok) {
        setNewKey('');
        setShowReplaceForm(false);
        triggerSaveNotification();
        await fetchConfigStatus();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setValidationError(errorData.error || 'Failed to validate API key.');
      }
    } catch (err: any) {
      console.error('Error saving new key:', err);
      setValidationError('Failed to validate key. Check your key and connection.');
    } finally {
      setSavingKey(false);
    }
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
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto pb-12 transition-colors duration-300 ${
      theme === 'dark' ? 'text-neutral-100' : 'text-gray-900'
    }`}>
      
      {/* Settings Navigation Menu Sidebar (1 Column) */}
      <div className={`rounded-2xl border p-4 flex md:flex-col overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5 md:space-y-1.5 h-fit ${
        theme === 'dark' ? 'bg-[#0e0f14] border-neutral-900' : 'bg-white border-gray-200'
      }`}>
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
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-sans text-xs font-semibold tracking-tight transition-all focus:outline-none flex-shrink-0 md:w-full cursor-pointer ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-black text-white shadow-xs'
                  : theme === 'dark'
                    ? 'text-neutral-400 hover:bg-[#1a1b24]/40 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form Block (3 Columns) */}
      <div className={`md:col-span-3 rounded-2xl border p-6 shadow-xs relative ${
        theme === 'dark' ? 'bg-[#0d0e12]/60 border-neutral-900' : 'bg-white border-gray-200'
      }`}>
        
        {saveSuccess && (
          <div className={`absolute top-4 right-6 rounded-lg border px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 animate-bounce z-50 ${
            theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            <Check className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}

        {/* Tab content panel */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <h3 className={`font-sans font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>User Profile</h3>
              <p className="text-xs text-gray-400 mt-1">Configure your primary academic researcher identification and institutional information.</p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
                <span className="text-xs text-red-500 font-semibold">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">FIRST NAME</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-medium mt-1 outline-none ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-neutral-900/40 text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">LAST NAME</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-medium mt-1 outline-none ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-neutral-900/40 text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-950 focus:border-black focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">UNIVERSITY / SCHOOL NAME</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-medium mt-1 outline-none ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-neutral-900/40 text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-medium mt-1 outline-none ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-neutral-900/40 text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">CODE</label>
                <select
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-medium mt-1 outline-none cursor-pointer ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-neutral-900/40 text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                  }`}
                >
                  <option value="" disabled>Select</option>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">PHONE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-medium mt-1 outline-none ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-neutral-900/40 text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className={`pt-4 border-t flex justify-end ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              <button
                type="submit"
                className={`rounded-xl px-4.5 py-2.5 text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Save Profile Outlines
              </button>
            </div>
          </form>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-5 animate-fade-in text-left">
            <div>
              <h3 className={`font-sans font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>AI Generator Parameters</h3>
              <p className="text-xs text-gray-400 mt-1">Calibrate model parameters according to your reading and cognitive retention speed.</p>
            </div>

            {validationError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 flex items-start gap-2.5">
                <div className="text-xs text-red-500 font-semibold">{validationError}</div>
              </div>
            )}

            {isLoadingConfig ? (
              <div className={`p-8 rounded-xl border flex flex-col items-center justify-center gap-3 ${
                theme === 'dark' ? 'bg-[#08090c]/40 border-neutral-900' : 'bg-gray-50 border-gray-200'
              }`}>
                <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
                <span className="text-xs text-neutral-400">Fetching API Key telemetry...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* AI Providers Connection Telemetry */}
                <div className={`p-5 rounded-xl border space-y-4 ${
                  theme === 'dark' ? 'bg-[#08090c]/40 border-neutral-900' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/40">
                    <div>
                      <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI Connection Telemetry</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Real-time status of your secure Bring Your Own Key configuration.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase ${
                        configStatus?.lastHealthCheck?.status === 'Healthy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : configStatus?.lastHealthCheck?.status === 'Slow'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {configStatus?.lastHealthCheck?.status || 'Unknown'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase ${
                        configStatus?.configured
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {configStatus?.configured ? 'Connected' : 'Not Configured'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">AI Provider</div>
                      <div className="mt-1 font-semibold text-neutral-200">
                        {PROVIDER_METADATA[configStatus?.provider || '']?.name || configStatus?.provider || 'None'}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Active Model</div>
                      <div className="mt-1 font-mono text-neutral-300 font-bold">
                        {configStatus?.selectedModel || 'None'}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">API Key Mask</div>
                      <div className="mt-1 font-mono font-bold text-neutral-300">
                        {configStatus?.maskedKey || 'No key loaded'}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Latency (RTT)</div>
                      <div className="mt-1 font-semibold text-neutral-200">
                        {configStatus?.lastHealthCheck?.latency !== undefined ? `${configStatus.lastHealthCheck.latency} ms` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Security Profile</div>
                      <div className="mt-1 font-semibold text-neutral-200 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-indigo-400" />
                        <span>AES-256-GCM</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Last Validated</div>
                      <div className="mt-1 font-semibold text-neutral-200">
                        {configStatus?.lastValidated
                          ? new Date(configStatus.lastValidated).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Never'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-3 border-t border-neutral-800/40">
                    <button
                      onClick={handleRevalidateKey}
                      disabled={revalidating || !configStatus?.configured}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                        theme === 'dark' ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${revalidating ? 'animate-spin' : ''}`} />
                      <span>Validate Again</span>
                    </button>

                    <button
                      onClick={() => setShowReplaceForm(!showReplaceForm)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>{showReplaceForm ? 'Hide Settings' : 'Change Provider'}</span>
                    </button>

                    <button
                      onClick={handleDeleteKey}
                      disabled={deletingKey || !configStatus?.configured}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Key</span>
                    </button>
                  </div>
                </div>

                {/* AI Usage Dashboard */}
                <div className={`p-5 rounded-xl border space-y-4 ${
                  theme === 'dark' ? 'bg-[#08090c]/40 border-neutral-900' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI Usage Dashboard</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Estimated metrics tracked locally from request execution counts.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-neutral-950/20 border border-neutral-800/20">
                      <div className="text-neutral-400 text-[9px] font-bold uppercase tracking-wider">Today's Requests</div>
                      <div className="mt-1.5 text-lg font-black text-white">{configStatus?.usageStats?.todayRequests || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-950/20 border border-neutral-800/20">
                      <div className="text-neutral-400 text-[9px] font-bold uppercase tracking-wider">Monthly Tokens</div>
                      <div className="mt-1.5 text-lg font-black text-white">
                        {configStatus?.estimatedMonthlyTokens ? `${(configStatus.estimatedMonthlyTokens / 1000).toFixed(0)}K` : '0K'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-950/20 border border-neutral-800/20">
                      <div className="text-neutral-400 text-[9px] font-bold uppercase tracking-wider">Monthly Cost Est.</div>
                      <div className="mt-1.5 text-lg font-black text-indigo-400">
                        ${((configStatus?.estimatedMonthlyTokens || 0) / 1000000 * (PROVIDER_COSTS[configStatus?.provider || '']?.output || 0.35)).toFixed(3)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-950/20 border border-neutral-800/20">
                      <div className="text-neutral-400 text-[9px] font-bold uppercase tracking-wider">Response Speed</div>
                      <div className="mt-1.5 text-lg font-black text-emerald-400">
                        {configStatus?.usageStats?.avgResponseTime ? `${configStatus.usageStats.avgResponseTime}s` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Usage Meter Progress Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-neutral-400">ESTIMATED MONTHLY TOKENS UTILIZATION</span>
                      <span className="text-indigo-400">
                        {((configStatus?.estimatedMonthlyTokens || 0) / 5000000 * 100).toFixed(1)}% ({((configStatus?.estimatedMonthlyTokens || 0) / 1000000).toFixed(2)}M / 5.00M)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((configStatus?.estimatedMonthlyTokens || 0) / 5000000 * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Horizontal visual chart */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[10px]">
                    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-neutral-950/10 border border-neutral-900/60">
                      <span className="text-neutral-400 uppercase font-black tracking-wider text-[8px]">Failure Rates</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-400 font-bold">{configStatus?.usageStats?.failedRequests || 0}</span>
                        <span className="text-neutral-500">Failed calls</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-neutral-950/10 border border-neutral-900/60">
                      <span className="text-neutral-400 uppercase font-black tracking-wider text-[8px]">Rate Limiting (429)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">{configStatus?.usageStats?.errors429 || 0}</span>
                        <span className="text-neutral-500">Errors</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-neutral-950/10 border border-neutral-900/60">
                      <span className="text-neutral-400 uppercase font-black tracking-wider text-[8px]">Service Faults (503)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-500 font-bold">{configStatus?.usageStats?.errors503 || 0}</span>
                        <span className="text-neutral-500">Errors</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagnostics Panel */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#08090c]/40 border-neutral-900' : 'bg-gray-50 border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="w-full flex items-center justify-between text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-indigo-400" />
                      <span>AI Advanced Diagnostics</span>
                    </div>
                    <span>{showDiagnostics ? 'Hide Panel' : 'Show Panel'}</span>
                  </button>

                  {showDiagnostics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-4 mt-3 border-t border-neutral-800/40 text-[11px] text-neutral-300 font-mono">
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">PROVIDER_ID</span>
                        <span>{configStatus?.provider || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">ACTIVE_MODEL</span>
                        <span>{configStatus?.selectedModel || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">API_STATUS</span>
                        <span className="text-emerald-400">{configStatus?.lastHealthCheck?.status || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">AUTH_MODE</span>
                        <span>Bearer JWT</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">AVG_LATENCY</span>
                        <span>{configStatus?.usageStats?.avgResponseTime ? `${configStatus.usageStats.avgResponseTime}s` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">ENDPOINT_URI</span>
                        <span className="text-[10px] break-all truncate max-w-[150px]">
                          {PROVIDER_METADATA[configStatus?.provider || '']?.endpoint || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">ENCRYPTION</span>
                        <span className="text-indigo-400">AES-256-GCM (Cipher)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-900/40">
                        <span className="text-neutral-500">LAST_HEALTH_VAL</span>
                        <span className="text-[10px]">
                          {configStatus?.lastHealthCheck?.checkedAt
                            ? new Date(configStatus.lastHealthCheck.checkedAt).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Replace Key Form */}
                {showReplaceForm && (
                  <form onSubmit={handleSaveNewKey} className={`p-5 rounded-xl border space-y-4 animate-fade-in ${
                    theme === 'dark' ? 'bg-[#0a0b0d]/80 border-neutral-800' : 'bg-gray-50/50 border-gray-200'
                  }`}>
                    <div>
                      <h4 className="text-xs font-black">Configure AI Provider Connection</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Your key is decrypted only during model requests and is encrypted server-side.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Searchable Dropdown Selector */}
                      <div className="space-y-1.5 relative">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">AI Provider</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-xs outline-none cursor-pointer ${
                              theme === 'dark'
                                ? 'border-neutral-800 bg-[#0c0d12] text-white focus:border-indigo-500'
                                : 'border-gray-200 bg-white text-gray-900 focus:border-black'
                            }`}
                          >
                            <span>{PROVIDER_METADATA[aiProvider]?.name || 'Select...'}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                          </button>

                          {isDropdownOpen && (
                            <div className={`absolute z-50 mt-1.5 w-60 rounded-xl border shadow-xl p-2.5 space-y-2 ${
                              theme === 'dark' ? 'bg-[#0e0f13] border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                            }`}>
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Search providers..."
                                  className={`w-full rounded-lg border pl-8 pr-3 py-1 text-[11px] outline-none ${
                                    theme === 'dark' ? 'bg-[#18191e] border-neutral-800 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-black'
                                  }`}
                                />
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-0.5">
                                {Object.entries(PROVIDER_METADATA)
                                  .filter(([_, meta]) => meta.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                  .map(([key, meta]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => {
                                        setAiProvider(key);
                                        setSelectedModel(meta.defaultModel);
                                        setIsDropdownOpen(false);
                                        setSearchQuery('');
                                      }}
                                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors ${
                                        aiProvider === key ? 'bg-indigo-500/10 text-indigo-400 font-bold' : ''
                                      }`}
                                    >
                                      <span>{meta.name}</span>
                                      {aiProvider === key && <Check className="h-3 w-3" />}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Model Select */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block font-sans">Active Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className={`w-full rounded-lg border p-2.5 text-xs outline-none cursor-pointer ${
                            theme === 'dark'
                              ? 'border-neutral-800 bg-[#0c0d12] text-white focus:border-indigo-500'
                              : 'border-gray-200 bg-white text-gray-900 focus:border-black'
                          }`}
                        >
                          {PROVIDER_METADATA[aiProvider]?.models.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* API Key */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">New API Key *</label>
                        <input
                          type="password"
                          required
                          value={newKey}
                          onChange={(e) => setNewKey(e.target.value)}
                          placeholder={`Secret key for ${PROVIDER_METADATA[aiProvider]?.name}`}
                          className={`w-full rounded-lg border p-2.5 text-xs outline-none ${
                            theme === 'dark'
                              ? 'border-neutral-800 bg-[#0c0d12] text-white focus:border-indigo-500'
                              : 'border-gray-200 bg-white text-gray-900 focus:border-black'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 justify-between items-center text-[10px]">
                      <div className="text-indigo-400/90 leading-relaxed max-w-[65%]">
                        Official {PROVIDER_METADATA[aiProvider]?.name} keys can be generated from their developer console.
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={PROVIDER_METADATA[aiProvider]?.getKeyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          Get API Key <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReplaceForm(false);
                          setNewKey('');
                          setValidationError(null);
                        }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingKey}
                        className={`flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-black hover:bg-gray-800 text-white'
                        }`}
                      >
                        {savingKey ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Validating...</span>
                          </>
                        ) : (
                          <span>Save & Connect</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className={`flex items-start justify-between gap-4 p-3.5 border rounded-xl transition-all ${
                theme === 'dark' ? 'border-neutral-900 hover:bg-neutral-950/40' : 'border-gray-200 hover:bg-gray-50/50'
              }`}>
                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Proactive Concept Suggestion</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                    Automatically recommend linked articles and weak-topics material in your dashboard based on note contexts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={proactive}
                  onChange={(e) => setProactive(e.target.checked)}
                  className={`rounded h-4.5 w-4.5 mt-0.5 accent-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'border-neutral-700 bg-neutral-900 text-indigo-600' : 'border-gray-300 text-black'
                  }`}
                />
              </div>

              <div className={`flex items-start justify-between gap-4 p-3.5 border rounded-xl transition-all ${
                theme === 'dark' ? 'border-neutral-900 hover:bg-neutral-950/40' : 'border-gray-200 hover:bg-gray-50/50'
              }`}>
                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Automated Bibliography Generation</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                    Precompile standard LaTeX style citations references for uploaded PDFs or external research paper URLs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={bibliography}
                  onChange={(e) => setBibliography(e.target.checked)}
                  className={`rounded h-4.5 w-4.5 mt-0.5 accent-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'border-neutral-700 bg-neutral-900 text-indigo-600' : 'border-gray-300 text-black'
                  }`}
                />
              </div>

              <div className={`flex items-start justify-between gap-4 p-3.5 border rounded-xl transition-all ${
                theme === 'dark' ? 'border-neutral-900 hover:bg-neutral-950/40' : 'border-gray-200 hover:bg-gray-50/50'
              }`}>
                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>High-Intensity Synthesis Engine</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                    Apply deeper token-scanning parameters for massive 100+ page textbook outlines. (Requires Premium tier subscription).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={synthesis}
                  disabled={settings.subscription.planName === 'BYOK'}
                  onChange={(e) => setSynthesis(e.target.checked)}
                  className={`rounded h-4.5 w-4.5 mt-0.5 accent-indigo-500 cursor-pointer disabled:opacity-50 ${
                    theme === 'dark' ? 'border-neutral-700 bg-neutral-900 text-indigo-600' : 'border-gray-300 text-black'
                  }`}
                />
              </div>
            </div>

            <div className={`pt-4 border-t flex justify-end ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              <button
                onClick={handleSaveAISettings}
                className={`rounded-xl px-4.5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Save Parameters
              </button>
            </div>
          </div>
        )}

        {activeTab === 'lms' && (
          <div className="space-y-5">
            <div>
              <h3 className={`font-sans font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>Canvas LMS Sync Portal</h3>
              <p className="text-xs text-gray-400 mt-1">Interfacing Note-IT AI with Canvas allows automated downloading of semester presentations, homework documents, and syllabi.</p>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">INSTITUTION CANVAS HOSTING DOMAIN</label>
                <div className="flex gap-2 mt-1">
                  <span className={`inline-flex items-center rounded-l-lg border border-r-0 px-3 text-xs text-gray-400 ${
                    theme === 'dark' ? 'bg-[#0a0a0c] border-neutral-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    https://
                  </span>
                  <input
                    type="text"
                    value={canvasUrl}
                    onChange={(e) => setCanvasUrl(e.target.value)}
                    placeholder="e.g. camb-uni.instructure.com"
                    className={`flex-1 rounded-r-lg border p-2.5 text-xs font-medium outline-none ${
                      theme === 'dark'
                        ? 'border-neutral-800 bg-[#0a0a0c] text-white focus:border-indigo-500 focus:bg-neutral-900'
                        : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase">CANVAS API DEVELOPER ACCESS KEY</label>
                <input
                  type="password"
                  value={canvasToken}
                  onChange={(e) => setCanvasToken(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-xs font-mono mt-1 outline-none ${
                    theme === 'dark'
                      ? 'border-neutral-800 bg-[#0a0a0c] text-white focus:border-indigo-500 focus:bg-neutral-900'
                      : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-black focus:bg-white'
                  }`}
                />
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  Generated inside Settings &gt; Approved Integrations inside your student Canvas account profile. We encrypt keys before local caching.
                </p>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                theme === 'dark' ? 'bg-[#08090c]/40 border-neutral-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <div className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>Integration Status</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {settings.integrations.canvasConnected 
                      ? `Last synchronized: ${settings.integrations.lastSynced || 'Never'}` 
                      : 'Not connected'}
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  settings.integrations.canvasConnected 
                    ? 'bg-green-500/10 text-green-400' 
                    : theme === 'dark' ? 'bg-neutral-900 text-neutral-500' : 'bg-gray-100 text-gray-500'
                }`}>
                  {settings.integrations.canvasConnected ? 'ACTIVE CANAL' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <div className={`pt-4 border-t flex justify-end gap-2 ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              <button
                  onClick={handleTriggerLmsSync}
                  disabled={isLmsSyncing || !canvasUrl}
                  className={`flex items-center gap-1.5 rounded-xl px-4.5 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
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
              <h3 className={`font-sans font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>Plan & Subscription Overview</h3>
              <p className="text-xs text-gray-400 mt-1">Review active tiers, billing periods, and features limits.</p>
            </div>

            <div className={`border rounded-2xl p-5 space-y-4 ${
              theme === 'dark' ? 'bg-[#08090c]/40 border-neutral-900' : 'bg-gray-50/50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#2563EB] dark:text-indigo-400 bg-[#EFF6FF] dark:bg-indigo-950/30 px-2.5 py-0.5 rounded tracking-wide uppercase font-mono">
                    ACTIVE PLAN
                  </span>
                  <h4 className={`font-sans font-bold text-lg mt-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Note-IT {settings.subscription.planName} Tier</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Renews automatically on <strong className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>{settings.subscription.nextBillDate}</strong></p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-extrabold font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{settings.subscription.price}</div>
                  <div className="text-[10px] font-medium text-gray-400 mt-0.5">billed {settings.subscription.billingCycle}</div>
                </div>
              </div>

              <div className={`border-t pt-3.5 space-y-2 ${theme === 'dark' ? 'border-neutral-900' : 'border-gray-200'}`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">FEATURES INCLUDED:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium font-sans">
                  {settings.subscription.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`rounded-full h-4 w-4 flex items-center justify-center p-0.5 flex-shrink-0 ${
                        theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className={theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              <span className="text-xs text-gray-400 font-semibold text-center sm:text-left">Want to scale up with collaborative research workspaces?</span>
              <button
                onClick={() => setActivePage('pricing')}
                className={`flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
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
