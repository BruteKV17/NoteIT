import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Phone, 
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Search,
  Check,
  ExternalLink,
  Lock
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

const PROVIDER_METADATA: Record<string, {
  name: string;
  description: string;
  defaultModel: string;
  docLink: string;
  getKeyLink: string;
  models: string[];
}> = {
  gemini: {
    name: 'Google Gemini',
    description: 'Highly capable multimodal model for fast note synthesis, quizzes, and mind maps.',
    defaultModel: 'gemini-2.5-flash',
    docLink: 'https://ai.google.dev/gemini-api/docs',
    getKeyLink: 'https://aistudio.google.com/apikey',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-low latency open models. Excellent for speedy revision synthesis.',
    defaultModel: 'llama-3.3-70b-versatile',
    docLink: 'https://console.groq.com/docs',
    getKeyLink: 'https://console.groq.com/keys',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it']
  },
  openai: {
    name: 'OpenAI',
    description: 'Industry-standard general purpose models with high accuracy and speed.',
    defaultModel: 'gpt-4o-mini',
    docLink: 'https://platform.openai.com/docs',
    getKeyLink: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'o3-mini', 'o1-mini']
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Advanced reasoning and writing capabilities. Top-tier notes output quality.',
    defaultModel: 'claude-3-5-sonnet-latest',
    docLink: 'https://docs.anthropic.com',
    getKeyLink: 'https://console.anthropic.com/settings/keys',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-20240229']
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'High-performance cost-effective reasoning and general-purpose models.',
    defaultModel: 'deepseek-chat',
    docLink: 'https://api-docs.deepseek.com',
    getKeyLink: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access any open or closed model through a single unified API key.',
    defaultModel: 'google/gemini-2.5-flash',
    docLink: 'https://openrouter.ai/docs',
    getKeyLink: 'https://openrouter.ai/keys',
    models: ['google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini']
  },
  mistral: {
    name: 'Mistral',
    description: 'Sovereign European open-source models with high academic synthesis reasoning.',
    defaultModel: 'mistral-large-latest',
    docLink: 'https://docs.mistral.ai',
    getKeyLink: 'https://console.mistral.ai/api-keys',
    models: ['mistral-large-latest', 'mistral-small-latest', 'open-mixtral-8x22b', 'codestral-latest']
  },
  xai: {
    name: 'xAI Grok',
    description: 'Advanced reasoning, vision, and real-time knowledge capabilities from xAI.',
    defaultModel: 'grok-2',
    docLink: 'https://docs.x.ai',
    getKeyLink: 'https://console.x.ai',
    models: ['grok-2', 'grok-2-latest', 'grok-beta']
  }
};


interface OnboardingViewProps {
  userId: string;
  email: string;
  fullName: string;
  theme: 'light' | 'dark';
  onComplete: (userData: any) => void;
  initialStep?: number;
}

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

export default function OnboardingView({
  userId,
  email: initialEmail,
  fullName: initialFullName,
  theme,
  onComplete,
  initialStep
}: OnboardingViewProps) {
  
  // Split initialFullName if possible for convenience
  const names = initialFullName ? initialFullName.trim().split(/\s+/) : ['', ''];
  const initialFirstName = names[0] || '';
  const initialLastName = names.slice(1).join(' ') || '';

  // Form Fields
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // AI Provider configuration state
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Step state (1: Personal, 2: Academic, 3: Contact, 4: AI Config)
  const [step, setStep] = useState(initialStep || 1);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Background particles to match AuthView exactly
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; s: number; d: number }[]>([]);

  useEffect(() => {
    const items = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 3 + 1,
      d: Math.random() * 15 + 10
    }));
    setParticles(items);
  }, []);

  // Sync step with initialStep prop if changed
  useEffect(() => {
    if (initialStep) {
      setStep(initialStep);
    }
  }, [initialStep]);

  // Load existing profile data on mount or when userId changes
  useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
          if (data.school_or_university) setSchool(data.school_or_university);
          if (data.email) setEmail(data.email);
          if (data.country_code) setCountryCode(data.country_code);
          if (data.phone_number) setPhoneNumber(data.phone_number);
        }
      } catch (err) {
        console.error("Error loading user profile in OnboardingView:", err);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleNextStep = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!school.trim()) {
        setError('Please enter your school or university name.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!email.trim() || !countryCode || !phoneNumber.trim()) {
        setError('All fields are required. Please verify all onboarding steps.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^\d{7,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setError('Please enter a valid phone number (digits only, at least 7 digits).');
        return;
      }

      setLoading(true);

      const profileData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        school_or_university: school.trim(),
        email: email.trim(),
        country_code: countryCode,
        phone_number: cleanPhone,
        profile_image_url: null,
        onboarding_completed: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      console.log("Onboarding Save Attempt:", {
        currentUserUID: userId,
        authenticatedState: !!userId,
        firestoreDocumentPath: `users/${userId}`,
        writeRequestPayload: profileData
      });

      try {
        if (!userId) {
          throw new Error("User authentication context is missing. Please log in again.");
        }
        
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, profileData, { merge: true });
        
        console.log("Onboarding Save Succeeded! Document created at path users/" + userId);
        setStep(4);
      } catch (err: any) {
        console.error("Onboarding Save Failed:", {
          currentUserUID: userId,
          authenticatedState: !!userId,
          firestoreDocumentPath: `users/${userId}`,
          writeRequestPayload: profileData,
          exactFirestoreError: err
        });
        setError(err.message || 'Failed to save onboarding settings. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleValidateAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationSuccess(false);

    if (!apiKey.trim()) {
      setError(`Please enter an API Key for ${PROVIDER_METADATA[selectedProvider]?.name || 'the selected provider'}.`);
      return;
    }

    setIsValidatingKey(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User is not authenticated. Please log in again.');
      }
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/ai/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          key: apiKey.trim(),
          provider: selectedProvider,
          model: selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Validation failed with status ${response.status}`);
      }

      setValidationSuccess(true);
      
      // Complete setup and trigger callback
      setTimeout(() => {
        onComplete({
          first_name: firstName,
          last_name: lastName,
          email: email,
          school_or_university: school,
          country_code: countryCode,
          phone_number: phoneNumber,
          onboarding_completed: true,
          providerConfigured: true
        });
      }, 1000);
    } catch (err: any) {
      console.error("Validation error:", err);
      setError(err.message || 'Failed to validate API key. Please check your key and network connection.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden font-sans ${
      isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#FAF9F5] text-gray-900'
    }`}>
      
      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.s}px`,
              height: `${p.s}px`,
              animation: `float ${p.d}s infinite ease-in-out`
            }}
            className={`rounded-full ${
              isDark ? 'bg-indigo-500/40' : 'bg-indigo-600/20'
            }`}
          />
        ))}

        {/* Ambient colored glowing clouds */}
        <div className={`absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] pointer-events-none ${
          isDark ? 'bg-indigo-950/20' : 'bg-indigo-100/30'
        }`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] pointer-events-none ${
          isDark ? 'bg-purple-950/25' : 'bg-purple-100/25'
        }`} />
      </div>

      <div className="w-full max-w-md p-6 relative z-10">
        <header className="text-center mb-8 space-y-3 animate-fade-in">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-lg">
            <GraduationCap className="h-6 w-6 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight font-sans text-gray-900 dark:text-white">
              Welcome to NoteIT AI
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Let's set up your learning workspace in a few simple steps.
            </p>
          </div>
        </header>

        {/* Main Card */}
        <div className={`rounded-2xl border p-6 md:p-8 space-y-6 shadow-xl transition-all animate-fade-in ${
          isDark ? 'bg-[#121318]/90 border-neutral-800' : 'bg-white border-gray-200'
        }`}>
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : isDark ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' : 'bg-gray-100 text-neutral-500 border border-gray-200'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${
                    step > s ? 'bg-indigo-500' : isDark ? 'bg-neutral-800' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-500 font-semibold">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            
            {step === 1 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-neutral-900/10 dark:border-neutral-800/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Personal Identity</h3>
                  <p className="text-[10px] text-neutral-400">Let's register your scholarly name.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                          isDark
                            ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                          isDark
                            ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-neutral-900/10 dark:border-neutral-800/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Academic Profile</h3>
                  <p className="text-[10px] text-neutral-400">Tell us where you pursue your research or learning.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                    University / Institution Name
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Stanford University"
                      className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                        isDark
                          ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-neutral-900/10 dark:border-neutral-800/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Contact Channels</h3>
                  <p className="text-[10px] text-neutral-400">Verify your academic mail and sync communication nodes.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@university.edu"
                      className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                        isDark
                          ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                      Code
                    </label>
                    <select
                      required
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-3 text-xs outline-none transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                      }`}
                    >
                      <option value="" disabled>Select</option>
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.name.split(' ')[0]})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="555-0199"
                        className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                          isDark
                            ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-neutral-900/10 dark:border-neutral-800/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Configure Your AI Provider</h3>
                  <p className="text-[10px] text-neutral-400">Bring Your Own Key (BYOK) - connect and validate your preferred LLM provider.</p>
                </div>

                {/* Searchable Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Select Provider *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-xs outline-none cursor-pointer transition-all ${
                        isDark
                          ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                      }`}
                    >
                      <span>{PROVIDER_METADATA[selectedProvider]?.name || 'Choose Provider...'}</span>
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    </button>

                    {isDropdownOpen && (
                      <div className={`absolute z-50 mt-1.5 w-full rounded-xl border shadow-xl p-2.5 space-y-2 ${
                        isDark ? 'bg-[#0e0f13] border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search providers..."
                            className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs outline-none ${
                              isDark ? 'bg-[#18191e] border-neutral-800 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-black'
                            }`}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {Object.entries(PROVIDER_METADATA)
                            .filter(([_, meta]) => meta.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(([key, meta]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setSelectedProvider(key);
                                  setSelectedModel(meta.defaultModel);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors ${
                                  selectedProvider === key ? 'bg-indigo-500/10 text-indigo-400 font-bold' : ''
                                }`}
                              >
                                <span>{meta.name}</span>
                                {selectedProvider === key && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Provider Details */}
                <div className={`p-4 rounded-xl border space-y-3.5 ${
                  isDark ? 'bg-[#0f1015]/60 border-neutral-800/80' : 'bg-gray-50/70 border-gray-200/80'
                }`}>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400">{PROVIDER_METADATA[selectedProvider]?.name}</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">{PROVIDER_METADATA[selectedProvider]?.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Default Model</span>
                      <div className="font-semibold text-neutral-200">{PROVIDER_METADATA[selectedProvider]?.defaultModel}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Choose Model</span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`w-full rounded-lg border p-1 px-2 text-xs outline-none cursor-pointer ${
                          isDark ? 'border-neutral-800 bg-[#0c0d12] text-white focus:border-indigo-500' : 'border-gray-200 bg-white text-gray-900 focus:border-black'
                        }`}
                      >
                        {PROVIDER_METADATA[selectedProvider]?.models.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1 border-t border-neutral-800/40">
                    <a
                      href={PROVIDER_METADATA[selectedProvider]?.getKeyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-neutral-600">•</span>
                    <a
                      href={PROVIDER_METADATA[selectedProvider]?.docLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-neutral-300 transition-colors"
                    >
                      Documentation <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                    API Key *
                  </label>
                  <input
                    type="password"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Paste your secret API key for ${PROVIDER_METADATA[selectedProvider]?.name}`}
                    className={`w-full rounded-xl border px-4 py-3 text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                    }`}
                  />
                </div>

                <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3 mt-1.5 flex gap-2">
                  <Lock className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-indigo-400/90">
                    Your key is securely encrypted server-side using AES-256-GCM and is never transmitted or exposed to the frontend.
                  </p>
                </div>
              </div>
            )}

            {/* Buttons Navigation bar */}
            <div className="flex gap-3 pt-4 border-t border-neutral-900/10 dark:border-neutral-800/40">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer border ${
                    isDark 
                      ? 'border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:bg-neutral-800' 
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleValidateAndComplete}
                  disabled={isValidatingKey || validationSuccess}
                  className={`flex-1 py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all active:scale-98 relative flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                    validationSuccess
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : isDark
                        ? 'bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-700 disabled:text-neutral-500'
                        : 'bg-black text-white hover:bg-neutral-800 disabled:bg-gray-200 disabled:text-gray-500'
                  }`}
                >
                  {isValidatingKey ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Validating key...</span>
                    </span>
                  ) : validationSuccess ? (
                    <span className="flex items-center gap-2">
                      <span>✓ Connected!</span>
                    </span>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-500" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
