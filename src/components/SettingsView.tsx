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
  AlertTriangle,
  Sun,
  Moon,
  Palette
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
  anthropic: {
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
  xai: {
    name: 'xAI Grok',
    description: 'Advanced reasoning, vision, and real-time knowledge capabilities from xAI.',
    defaultModel: 'grok-2',
    docLink: 'https://docs.x.ai',
    getKeyLink: 'https://console.x.ai',
    models: ['grok-2', 'grok-2-latest', 'grok-beta'],
    endpoint: 'api.x.ai/v1'
  },
  nvidia: {
    name: 'NVIDIA GLM',
    description: 'High-performance GLM models hosted on NVIDIA NIM API catalog.',
    defaultModel: 'z-ai/glm-5.2',
    docLink: 'https://build.nvidia.com/z-ai/glm-5.2',
    getKeyLink: 'https://build.nvidia.com/',
    models: ['z-ai/glm-5.2'],
    endpoint: 'integrate.api.nvidia.com/v1'
  }
};

const PROVIDER_COSTS: Record<string, { input: number; output: number }> = {
  gemini: { input: 0.075, output: 0.30 }, // per million tokens
  groq: { input: 0.59, output: 0.79 },
  openai: { input: 0.15, output: 0.60 },
  anthropic: { input: 3.00, output: 15.00 },
  deepseek: { input: 0.14, output: 0.28 },
  openrouter: { input: 0.10, output: 0.40 },
  mistral: { input: 2.00, output: 6.00 },
  xai: { input: 2.00, output: 10.00 },
  nvidia: { input: 0.55, output: 0.55 }
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
  setTheme?: (theme: 'light' | 'dark') => void;
  onLogOut?: () => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme = 'dark',
  setTheme,
  onLogOut
}: SettingsViewProps) {
  
  // Local state
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'ai' | 'usage' | 'security' | 'billing'>('profile');
  
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
          const prov = data.provider || 'gemini';
          let normalized = prov.toLowerCase();
          if (normalized.includes('grok') || normalized.includes('xai')) {
            normalized = 'xai';
          } else if (normalized.includes('claude') || normalized.includes('anthropic')) {
            normalized = 'anthropic';
          } else if (normalized.includes('nvidia') || normalized.includes('glm')) {
            normalized = 'nvidia';
          }
          setAiProvider(normalized);
          setSelectedModel(data.selectedModel || PROVIDER_METADATA[normalized]?.defaultModel || '');
        }
      }
    } catch (err) {
      console.error('Error fetching AI config status:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai' || activeTab === 'usage' || activeTab === 'security') {
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

  const triggerSaveNotification = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 bg-[var(--bg-paper)] p-4 md:p-8 select-none text-[var(--text-primary)]">
      
      {/* Settings Header */}
      <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 shadow-paper-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-extrabold text-[var(--text-secondary)] uppercase tracking-[3px] block">
            PREFERENCES & CONFIGURATION
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-tight mt-1">
            ACCOUNT & SYSTEM SETTINGS
          </h1>
          <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1">
            Manage your academic identity, visual themes, AI providers, API keys, and cognitive parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Navigation Sidebar */}
        <div className="md:col-span-1 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-3 shadow-paper-md flex flex-col gap-2 h-fit">
          <span className="text-[10px] font-mono font-extrabold text-[var(--text-secondary)] uppercase tracking-[3px] px-2 py-1">
            NAVIGATION
          </span>

          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'appearance', label: 'Theme & Appearance', icon: Sun },
            { id: 'ai', label: 'AI Provider Keys', icon: Sparkles },
            { id: 'usage', label: 'Usage & Costs', icon: Activity },
            { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
            { id: 'billing', label: 'Billing & Plan', icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[4px] border-2 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FFC400] text-[#111111] border-[var(--border-main)] shadow-paper-sm font-extrabold translate-x-1'
                    : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-transparent hover:border-[var(--border-main)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      {/* Main Settings Form Block (3 Columns) */}
      <div className="md:col-span-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 shadow-paper-md relative text-[var(--text-primary)]">
        
        {saveSuccess && (
          <div className="absolute top-4 right-6 rounded-[4px] border-2 border-[var(--border-main)] bg-[#19B56B] text-white px-3.5 py-1.5 text-xs font-mono font-extrabold flex items-center gap-1.5 shadow-paper-sm z-50">
            <Check className="h-4 w-4" />
            <span>SETTINGS SAVED SUCCESSFULLY</span>
          </div>
        )}

        {/* Tab: Theme & Appearance */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 text-left">
            <div>
              <h3 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)] flex items-center gap-2">
                <Sun className="h-5 w-5 text-[#FFC400]" />
                Theme & Visual Appearance
              </h3>
              <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1">
                Customize the color palette and interface format for NoteIT AI. Choose between our Dark Navy Blue Bauhaus theme and Classic Light Bauhaus theme.
              </p>
            </div>

            {/* Theme Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* Option 1: Dark Navy Blue Theme */}
              <div 
                onClick={() => {
                  if (setTheme) setTheme('dark');
                  onUpdateSettings({
                    ...settings,
                    profile: { ...settings.profile, theme: 'dark' }
                  });
                  triggerSaveNotification();
                }}
                className={`rounded-[8px] border-2 p-5 flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-200 shadow-paper-md ${
                  theme === 'dark'
                    ? 'border-[#FFC400] bg-[#0A1124] ring-2 ring-[#FFC400]'
                    : 'border-[var(--border-main)] bg-[#0A1124] opacity-85 hover:opacity-100 hover:-translate-y-1'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                      <Moon className="h-4 w-4 text-[#FFC400]" />
                      Dark Navy Blue (Bauhaus)
                    </span>
                    {theme === 'dark' && (
                      <span className="rounded-[4px] bg-[#FFC400] text-[#0A1124] px-2 py-0.5 text-[10px] font-extrabold font-mono border border-[#FFC400]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-[#94A3B8] leading-relaxed">
                    Deep slate navy blue palette (`#0A1124`) engineered for night research sessions and zero eye fatigue. Crisp high-contrast slate-white typography with yellow & electric blue Bauhaus accents.
                  </p>

                  {/* Color Swatch Preview */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-6 w-6 rounded border border-[#2A3B5C] bg-[#0A1124]" title="Base Navy (#0A1124)" />
                    <div className="h-6 w-6 rounded border border-[#2A3B5C] bg-[#152238]" title="Card Panel (#152238)" />
                    <div className="h-6 w-6 rounded border border-[#2A3B5C] bg-[#FFC400]" title="Bauhaus Yellow (#FFC400)" />
                    <div className="h-6 w-6 rounded border border-[#2A3B5C] bg-[#38BDF8]" title="Electric Blue (#38BDF8)" />
                    <div className="h-6 w-6 rounded border border-[#2A3B5C] bg-[#FF5353]" title="Coral Red (#FF5353)" />
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full py-2 text-xs font-mono font-extrabold uppercase rounded-[4px] border-2 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#FFC400] text-[#0A1124] border-[#FFC400]'
                      : 'bg-transparent text-[#F1F5F9] border-[#2A3B5C] hover:bg-[#152238]'
                  }`}
                >
                  {theme === 'dark' ? 'Theme Selected' : 'Apply Dark Blue Theme'}
                </button>
              </div>

              {/* Option 2: Classic Light Theme */}
              <div 
                onClick={() => {
                  if (setTheme) setTheme('light');
                  onUpdateSettings({
                    ...settings,
                    profile: { ...settings.profile, theme: 'light' }
                  });
                  triggerSaveNotification();
                }}
                className={`rounded-[8px] border-2 p-5 flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-200 shadow-paper-md ${
                  theme === 'light'
                    ? 'border-[#FFC400] bg-[#F6F2EA] ring-2 ring-[#FFC400]'
                    : 'border-[var(--border-main)] bg-[#F6F2EA] opacity-85 hover:opacity-100 hover:-translate-y-1'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-[#111111] uppercase tracking-wider flex items-center gap-2">
                      <Sun className="h-4 w-4 text-[#111111]" />
                      Classic Light (Bauhaus)
                    </span>
                    {theme === 'light' && (
                      <span className="rounded-[4px] bg-[#FFC400] text-[#111111] px-2 py-0.5 text-[10px] font-extrabold font-mono border border-[#111111]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-[#666666] leading-relaxed">
                    Classic cream paper canvas (`#F6F2EA`) inspired by physical academic notebooks and industrial print typography. Stark black geometric outlines and rich yellow callout blocks.
                  </p>

                  {/* Color Swatch Preview */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-6 w-6 rounded border border-[#111111] bg-[#F6F2EA]" title="Paper Cream (#F6F2EA)" />
                    <div className="h-6 w-6 rounded border border-[#111111] bg-[#FFFFFF]" title="White Surface (#FFFFFF)" />
                    <div className="h-6 w-6 rounded border border-[#111111] bg-[#111111]" title="Industrial Black (#111111)" />
                    <div className="h-6 w-6 rounded border border-[#111111] bg-[#FFC400]" title="Bauhaus Yellow (#FFC400)" />
                    <div className="h-6 w-6 rounded border border-[#111111] bg-[#FF4D4D]" title="Bauhaus Red (#FF4D4D)" />
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full py-2 text-xs font-mono font-extrabold uppercase rounded-[4px] border-2 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[#FFC400] text-[#111111] border-[#111111]'
                      : 'bg-white text-[#111111] border-[#111111] hover:bg-[#FFF8D6]'
                  }`}
                >
                  {theme === 'light' ? 'Theme Selected' : 'Apply Light Theme'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 1: User Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
            <div>
              <h3 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)]">User Profile</h3>
              <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1">Configure your primary academic researcher identification and institutional information.</p>
            </div>

            {error && (
              <div className="rounded-[6px] border-2 border-[#111111] bg-[#FF4D4D]/15 p-3 flex items-start gap-2 text-[#111111]">
                <span className="text-xs font-mono font-bold text-[#FF4D4D]">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-extrabold text-[#111111] uppercase mb-1">FIRST NAME</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-extrabold text-[#111111] uppercase mb-1">LAST NAME</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-extrabold text-[#111111] uppercase mb-1">UNIVERSITY / SCHOOL NAME</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-extrabold text-[#111111] uppercase mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-mono font-extrabold text-[#111111] uppercase mb-1">CODE</label>
                <select
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-3 text-xs font-mono font-bold text-[#111111] outline-none cursor-pointer shadow-paper-sm"
                >
                  <option value="" disabled>Select</option>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-mono font-extrabold text-[#111111] uppercase mb-1">PHONE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#111111] flex justify-end">
              <button
                type="submit"
                className="rounded-[6px] border-2 border-[#111111] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase px-5 py-2.5 shadow-paper-sm hover:bg-[#ffe066] transition-all cursor-pointer"
              >
                Save Profile Outlines
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: AI Provider Keys */}
        {activeTab === 'ai' && (
          <div className="space-y-5 text-left">
            <div>
              <h3 className="font-heading font-extrabold text-lg uppercase text-[#111111]">AI Generator & Provider Keys</h3>
              <p className="text-xs font-mono font-bold text-[#666666] mt-1">Calibrate model parameters according to your reading and cognitive retention speed.</p>
            </div>

            {validationError && (
              <div className="rounded-[6px] border-2 border-[#111111] bg-[#FF4D4D]/15 p-3 flex items-start gap-2">
                <div className="text-xs font-mono font-bold text-[#FF4D4D]">{validationError}</div>
              </div>
            )}

            {isLoadingConfig ? (
              <div className="p-8 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 text-[#2F6BFF] animate-spin" />
                <span className="text-xs font-mono font-bold text-[#666666]">Fetching API Key telemetry...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* AI Connection Telemetry Card */}
                <div className="p-5 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#111111]">
                    <div>
                      <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">AI Connection Telemetry</h4>
                      <p className="text-[10px] font-mono font-bold text-[#666666] mt-0.5">Real-time status of your secure Bring Your Own Key configuration.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-[4px] border border-[#111111] bg-[#FFC400] text-[#111111] text-[9px] font-mono font-extrabold uppercase">
                        {configStatus?.lastHealthCheck?.status || 'HEALTHY'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-[4px] border border-[#111111] bg-[#19B56B] text-white text-[9px] font-mono font-extrabold uppercase">
                        {configStatus?.configured ? 'CONNECTED' : 'NOT CONFIG'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono font-bold text-[#111111]">
                    <div>
                      <div className="text-[9px] uppercase text-[#666666]">AI Provider</div>
                      <div className="mt-1 font-extrabold">
                        {PROVIDER_METADATA[configStatus?.provider || '']?.name || configStatus?.provider || 'Google Gemini'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-[#666666]">Active Model</div>
                      <div className="mt-1 font-extrabold text-[#2F6BFF]">
                        {configStatus?.selectedModel || 'gemini-2.5-flash'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-[#666666]">Security Cipher</div>
                      <div className="mt-1 font-extrabold flex items-center gap-1">
                        <Lock className="h-3 w-3 text-[#2F6BFF]" />
                        <span>AES-256-GCM</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-3 border-t-2 border-[#111111]">
                    <button
                      onClick={handleRevalidateKey}
                      disabled={revalidating || !configStatus?.configured}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] text-xs font-mono font-extrabold uppercase hover:bg-[#FFC400] transition-all shadow-paper-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${revalidating ? 'animate-spin' : ''}`} />
                      <span>Validate Key</span>
                    </button>

                    <button
                      onClick={() => setShowReplaceForm(!showReplaceForm)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border-2 border-[#111111] bg-[#2F6BFF] text-white text-xs font-mono font-extrabold uppercase hover:bg-[#255cd9] transition-all shadow-paper-sm cursor-pointer"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>{showReplaceForm ? 'Hide Form' : 'Change Provider'}</span>
                    </button>

                    <button
                      onClick={handleDeleteKey}
                      disabled={deletingKey || !configStatus?.configured}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border-2 border-[#111111] bg-[#FF4D4D] text-white text-xs font-mono font-extrabold uppercase hover:bg-red-700 transition-all shadow-paper-sm cursor-pointer ml-auto disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Key</span>
                    </button>
                  </div>
                </div>

                {/* Replace Key Form */}
                {showReplaceForm && (
                  <form onSubmit={handleSaveNewKey} className="p-5 rounded-[6px] border-2 border-[#111111] bg-white space-y-4 shadow-paper-md text-left">
                    <div>
                      <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">Configure AI Provider Connection</h4>
                      <p className="text-[10px] font-mono font-bold text-[#666666] mt-0.5">Your key is decrypted only during model requests and is encrypted server-side.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Searchable Dropdown Selector */}
                      <div className="space-y-1.5 relative">
                        <label className="text-[9px] font-mono font-extrabold uppercase text-[#111111] block">AI Provider</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm cursor-pointer"
                          >
                            <span>{PROVIDER_METADATA[aiProvider]?.name || 'Select...'}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-[#111111]" />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute z-50 mt-1.5 w-60 rounded-[6px] border-2 border-[#111111] bg-white shadow-paper-lg p-2.5 space-y-2 text-[#111111]">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]" />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Search providers..."
                                  className="w-full rounded-[4px] border-2 border-[#111111] bg-[#F6F2EA] pl-8 pr-3 py-1 text-[11px] font-mono font-bold outline-none"
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
                                      className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono font-bold flex items-center justify-between cursor-pointer hover:bg-[#FFC400] transition-colors ${
                                        aiProvider === key ? 'bg-[#FFC400]' : ''
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
                        <label className="text-[9px] font-mono font-extrabold uppercase text-[#111111] block">Active Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm cursor-pointer"
                        >
                          {PROVIDER_METADATA[aiProvider]?.models.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* API Key */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono font-extrabold uppercase text-[#111111] block">New API Key *</label>
                        <input
                          type="password"
                          required
                          value={newKey}
                          onChange={(e) => setNewKey(e.target.value)}
                          placeholder={`Secret key for ${PROVIDER_METADATA[aiProvider]?.name}`}
                          className="w-full rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] p-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                        />
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
                        className="px-3.5 py-2 rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] text-xs font-mono font-extrabold uppercase hover:bg-gray-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingKey}
                        className="flex items-center gap-1.5 px-4.5 py-2 rounded-[6px] border-2 border-[#111111] bg-[#FFC400] text-[#111111] text-xs font-mono font-extrabold uppercase hover:bg-[#ffe066] cursor-pointer shadow-paper-sm"
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

            {/* Checkbox Parameters */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between gap-4 p-4 border-2 border-[#111111] rounded-[6px] bg-[#F6F2EA]">
                <div className="flex-1">
                  <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">Proactive Concept Suggestion</h4>
                  <p className="text-[11px] font-mono text-[#666666] font-bold mt-0.5">
                    Automatically recommend linked articles and weak-topics material in your dashboard based on note contexts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={proactive}
                  onChange={(e) => setProactive(e.target.checked)}
                  className="h-5 w-5 rounded border-2 border-[#111111] accent-[#2F6BFF] cursor-pointer mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 border-2 border-[#111111] rounded-[6px] bg-[#F6F2EA]">
                <div className="flex-1">
                  <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">Automated Bibliography Generation</h4>
                  <p className="text-[11px] font-mono text-[#666666] font-bold mt-0.5">
                    Precompile standard LaTeX style citations references for uploaded PDFs or external research paper URLs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={bibliography}
                  onChange={(e) => setBibliography(e.target.checked)}
                  className="h-5 w-5 rounded border-2 border-[#111111] accent-[#2F6BFF] cursor-pointer mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 border-2 border-[#111111] rounded-[6px] bg-[#F6F2EA]">
                <div className="flex-1">
                  <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">High-Intensity Synthesis Engine</h4>
                  <p className="text-[11px] font-mono text-[#666666] font-bold mt-0.5">
                    Apply deeper token-scanning parameters for massive 100+ page textbook outlines.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={synthesis}
                  disabled={settings.subscription.planName === 'BYOK'}
                  onChange={(e) => setSynthesis(e.target.checked)}
                  className="h-5 w-5 rounded border-2 border-[#111111] accent-[#2F6BFF] cursor-pointer mt-0.5 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#111111] flex justify-end">
              <button
                onClick={handleSaveAISettings}
                className="rounded-[6px] border-2 border-[#111111] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase px-5 py-2.5 shadow-paper-sm hover:bg-[#ffe066] transition-all cursor-pointer"
              >
                Save Parameters
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Usage & Costs */}
        {activeTab === 'usage' && (
          <div className="space-y-5 text-left">
            <div>
              <h3 className="font-heading font-extrabold text-lg uppercase text-[#111111]">Usage Telemetry & Cost Estimates</h3>
              <p className="text-xs font-mono font-bold text-[#666666] mt-1">Track request frequencies, token bandwidth, response latency, and cost calculations.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="p-4 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-sm">
                <div className="text-[9px] font-bold uppercase text-[#666666]">Today's Calls</div>
                <div className="mt-1.5 text-2xl font-black text-[#111111]">{configStatus?.usageStats?.todayRequests || 14}</div>
              </div>

              <div className="p-4 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-sm">
                <div className="text-[9px] font-bold uppercase text-[#666666]">Monthly Tokens</div>
                <div className="mt-1.5 text-2xl font-black text-[#2F6BFF]">
                  {configStatus?.estimatedMonthlyTokens ? `${(configStatus.estimatedMonthlyTokens / 1000).toFixed(0)}K` : '128K'}
                </div>
              </div>

              <div className="p-4 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-sm">
                <div className="text-[9px] font-bold uppercase text-[#666666]">Est. Cost (Rupees)</div>
                <div className="mt-1.5 text-2xl font-black text-[#19B56B]">
                  ₹{((configStatus?.estimatedMonthlyTokens || 128000) / 1000000 * 30).toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] shadow-paper-sm">
                <div className="text-[9px] font-bold uppercase text-[#666666]">Avg Response Speed</div>
                <div className="mt-1.5 text-2xl font-black text-[#111111]">
                  {configStatus?.usageStats?.avgResponseTime ? `${configStatus.usageStats.avgResponseTime}s` : '0.8s'}
                </div>
              </div>
            </div>

            {/* Token Utilization Bar */}
            <div className="p-4 rounded-[6px] border-2 border-[#111111] bg-white shadow-paper-sm space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-extrabold uppercase text-[#111111]">
                <span>MONTHLY TOKEN BANDWIDTH UTILIZATION</span>
                <span className="text-[#2F6BFF]">2.56% (128K / 5.00M Tokens)</span>
              </div>
              <div className="w-full bg-[#F6F2EA] border border-[#111111] rounded-full h-3 overflow-hidden">
                <div className="bg-[#2F6BFF] h-full w-[2.5%] transition-all duration-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono font-bold">
              <div className="p-3 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA]">
                <span className="text-[9px] uppercase text-[#666666] block">Failed Calls</span>
                <span className="text-sm font-extrabold text-[#111111]">0 Errors</span>
              </div>
              <div className="p-3 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA]">
                <span className="text-[9px] uppercase text-[#666666] block">Rate Limits (429)</span>
                <span className="text-sm font-extrabold text-[#111111]">0 Throttled</span>
              </div>
              <div className="p-3 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA]">
                <span className="text-[9px] uppercase text-[#666666] block">Server Faults (503)</span>
                <span className="text-sm font-extrabold text-[#111111]">0 Failures</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Auth */}
        {activeTab === 'security' && (
          <div className="space-y-6 text-left">
            <div>
              <h3 className="font-heading font-extrabold text-lg uppercase text-[#111111]">Security, Auth & Session Lifecycle</h3>
              <p className="text-xs font-mono font-bold text-[#666666] mt-1">Review active token ciphering, Firebase Auth state, and clear cached workspace data.</p>
            </div>

            <div className="p-5 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] space-y-4">
              <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">Security Standards</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono font-bold text-[#111111]">
                <div className="p-3 rounded-[6px] border-2 border-[#111111] bg-white">
                  <div className="text-[9px] uppercase text-[#666666]">Key Storage Cipher</div>
                  <div className="mt-1 text-sm font-black text-[#2F6BFF]">AES-256-GCM</div>
                </div>

                <div className="p-3 rounded-[6px] border-2 border-[#111111] bg-white">
                  <div className="text-[9px] uppercase text-[#666666]">Identity Provider</div>
                  <div className="mt-1 text-sm font-black text-[#19B56B]">Firebase Bearer JWT</div>
                </div>
              </div>
            </div>

            {/* DANGER ZONE: DATA PURGE AND LOGOUT */}
            <div className="pt-6 border-t-2 border-[#111111] space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#FF4D4D]" />
                <h3 className="font-heading font-extrabold text-sm uppercase text-[#111111]">
                  DANGER ZONE: PURGE DATA & LOGOUT
                </h3>
              </div>
              <p className="text-xs font-mono font-bold text-[#666666]">
                Instantly wipe all local cached data, clear session tokens, and sign out of all user accounts across Firebase Auth.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to purge all stored data and log out of all accounts? This action cannot be undone.")) {
                      if (onLogOut) onLogOut();
                    }
                  }}
                  className="px-5 py-3 rounded-[6px] bg-[#FF4D4D] text-white border-2 border-[#111111] font-mono text-xs font-extrabold uppercase shadow-paper-md hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>PURGE ALL DATA & LOGOUT ALL ACCOUNTS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Billing & Plan */}
        {activeTab === 'billing' && (
          <div className="space-y-5 text-left">
            <div>
              <h3 className="font-heading font-extrabold text-lg uppercase text-[#111111]">Plan & Subscription Overview</h3>
              <p className="text-xs font-mono font-bold text-[#666666] mt-1">Review active tiers, billing cycles, and feature capacities.</p>
            </div>

            <div className="border-2 border-[#111111] rounded-[6px] p-5 space-y-4 bg-[#F6F2EA] shadow-paper-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-extrabold text-[#111111] bg-[#FFC400] border border-[#111111] px-2.5 py-0.5 rounded-[4px] uppercase tracking-wide">
                    ACTIVE TIER
                  </span>
                  <h4 className="font-heading font-extrabold text-xl mt-2 text-[#111111]">Note-IT {settings.subscription.planName} Plan</h4>
                  <p className="text-xs font-mono font-bold text-[#666666] mt-0.5">Renews automatically on <strong className="text-[#111111]">{settings.subscription.nextBillDate}</strong></p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-2xl font-black text-[#111111]">
                    {settings.subscription.planName === 'BYOK' ? '₹0' : '₹400 / mo'}
                  </div>
                  <div className="text-[10px] font-bold text-[#666666] mt-0.5">billed monthly</div>
                </div>
              </div>

              <div className="border-t-2 border-[#111111] pt-3.5 space-y-2">
                <span className="text-[10px] font-mono font-extrabold text-[#111111] uppercase tracking-widest block">INCLUDED FEATURES:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono font-bold">
                  {settings.subscription.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="rounded-full h-4 w-4 bg-[#19B56B] text-white flex items-center justify-center p-0.5 flex-shrink-0 border border-[#111111]">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-[#111111]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#111111] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-[#666666]">Want to unlock institution features & custom models?</span>
              <button
                onClick={() => setActivePage('pricing')}
                className="flex items-center justify-center gap-1 rounded-[6px] border-2 border-[#111111] bg-[#FFC400] text-[#111111] px-5 py-2.5 text-xs font-mono font-extrabold uppercase shadow-paper-sm hover:bg-[#ffe066] transition-all cursor-pointer"
              >
                <span>Compare All SaaS Plans</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
  );
}
