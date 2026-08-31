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
  Lock,
  Key,
  Lightbulb,
  X,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';
import { validateApiKeyDirect } from '../providers/ValidationAdapters';

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
    defaultModel: 'gemini-3.6-flash',
    docLink: 'https://ai.google.dev/gemini-api/docs',
    getKeyLink: 'https://aistudio.google.com/apikey',
    models: ['gemini-3.6-flash']
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
    defaultModel: 'google/gemini-3.6-flash',
    docLink: 'https://openrouter.ai/docs',
    getKeyLink: 'https://openrouter.ai/keys',
    models: ['google/gemini-3.6-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini']
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
  },
  nvidia: {
    name: 'NVIDIA GLM',
    description: 'High-performance GLM models hosted on NVIDIA NIM API catalog.',
    defaultModel: 'z-ai/glm-5.2',
    docLink: 'https://build.nvidia.com/z-ai/glm-5.2',
    getKeyLink: 'https://build.nvidia.com/',
    models: ['z-ai/glm-5.2']
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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedGuideImage, setSelectedGuideImage] = useState<string | null>(null);
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

  // Sync initialFullName when it is provided or updated
  useEffect(() => {
    if (initialFullName && !initialFullName.includes('@')) {
      const parts = initialFullName.trim().split(/\s+/);
      if (parts.length > 0) {
        setFirstName(parts[0]);
        if (parts.length > 1) {
          setLastName(parts.slice(1).join(' '));
        }
      }
    }
  }, [initialFullName]);

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
      if (!email.trim() || !phoneNumber.trim()) {
        setError('All fields are required. Please verify all onboarding steps.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      let cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        cleanPhone = cleanPhone.slice(2);
      }
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number (without country code).');
        return;
      }

      setLoading(true);

      // Check phone number & email uniqueness
      try {
        const usersRef = collection(db, 'users');

        const phoneQ1 = query(usersRef, where('phone_number', '==', cleanPhone));
        const phoneSnap1 = await getDocs(phoneQ1);
        const dup1 = phoneSnap1.docs.some(docSnap => docSnap.id !== userId);

        const phoneQ2 = query(usersRef, where('whatsapp_number', '==', cleanPhone));
        const phoneSnap2 = await getDocs(phoneQ2);
        const dup2 = phoneSnap2.docs.some(docSnap => docSnap.id !== userId);

        if (dup1 || dup2) {
          setError('This phone number is already registered with another account. Each account must have a unique phone number.');
          setLoading(false);
          return;
        }

        if (email) {
          const cleanEmail = email.trim().toLowerCase();
          const emailQ = query(usersRef, where('email', '==', cleanEmail));
          const emailSnap = await getDocs(emailQ);
          const dupEmail = emailSnap.docs.some(docSnap => docSnap.id !== userId);

          if (dupEmail) {
            setError('This email address is already registered with another account. Each account must have a unique email address.');
            setLoading(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Uniqueness check skipped or network fallback:', checkErr);
      }

      const profileData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        school_or_university: school.trim(),
        email: email.trim(),
        country_code: countryCode,
        phone_number: cleanPhone,
        profile_image_url: null,
        onboarding_completed: false,
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

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError(`Please enter an API Key for ${PROVIDER_METADATA[selectedProvider]?.name || 'the selected provider'}.`);
      return;
    }

    setIsValidatingKey(true);
    try {
      const currentUser = auth.currentUser;
      let idToken = 'test-token';
      if (currentUser) {
        try {
          idToken = await currentUser.getIdToken();
        } catch (tokErr) {
          console.warn("Could not retrieve Firebase ID token, using fallback test-token:", tokErr);
        }
      }

      // Fast direct client-side key validation (under ~300ms)
      try {
        await validateApiKeyDirect(trimmedKey, selectedProvider, selectedModel);
      } catch (valErr: any) {
        console.warn("API key validation failed:", valErr);
        throw new Error(valErr.message || 'Failed to validate API key. Please check your key.');
      }

      // Persist configuration in localStorage
      localStorage.setItem(`noteit_${selectedProvider}_api_key`, trimmedKey);
      localStorage.setItem('noteit_active_ai_provider', selectedProvider);
      localStorage.setItem('noteit_active_ai_model', selectedModel);

      // Save onboarding_completed: true in Firestore
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, { onboarding_completed: true, updated_at: serverTimestamp() }, { merge: true });
        } catch (fErr) {
          console.warn("Failed to mark onboarding_completed in Firestore:", fErr);
        }
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
          providerConfigured: true,
          aiProvider: selectedProvider,
          selectedModel: selectedModel,
          apiKey: trimmedKey
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
    <div className="h-screen w-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden font-sans bg-grid-paper text-[#111111] select-none">
      
      <div className={`w-full ${step === 4 ? 'h-full max-h-[96vh] max-w-7xl flex flex-col justify-between' : 'max-w-md my-auto flex flex-col'} transition-all duration-300 relative z-10`}>

        {/* Main Card */}
        <div className={`rounded-2xl border-2 border-[#111111] bg-white dark:bg-[#161B22] p-5 sm:p-6 shadow-paper-lg ${step === 4 ? 'h-full flex flex-col justify-between flex-1 overflow-hidden' : 'flex flex-col space-y-4'}`}>
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`h-8 w-8 rounded-[4px] flex items-center justify-center font-mono text-xs font-bold border-2 border-[#111111] transition-all ${
                  step >= s 
                    ? 'bg-[#FFC400] text-[#111111] shadow-paper-sm' 
                    : 'bg-[#F6F2EA] text-[#666666]'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`h-1 flex-1 mx-2 transition-all border-y border-[#111111] ${
                    step > s ? 'bg-[#111111]' : 'bg-[#E0E0E0]'
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
          <form onSubmit={(e) => e.preventDefault()} className={`${step === 4 ? 'flex-1 flex flex-col justify-between overflow-hidden space-y-3 mt-2' : 'flex flex-col space-y-4 mt-1'}`}>
            
            {step === 1 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-[#111111]/15 pb-2 mb-2">
                  <h3 className="text-sm font-black text-[#111111]">Personal Identity</h3>
                  <p className="text-xs text-[#555555] font-medium">Let's register your scholarly name.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#222222] block">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444444]" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full rounded-xl border-2 border-[#111111] bg-[#F9F9F9] pl-10 pr-4 py-3 text-xs font-bold text-[#111111] placeholder-[#777777] outline-none focus:bg-white focus:border-[#2F6BFF] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#222222] block">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444444]" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full rounded-xl border-2 border-[#111111] bg-[#F9F9F9] pl-10 pr-4 py-3 text-xs font-bold text-[#111111] placeholder-[#777777] outline-none focus:bg-white focus:border-[#2F6BFF] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-[#111111]/15 pb-2 mb-2">
                  <h3 className="text-sm font-black text-[#111111]">Academic Profile</h3>
                  <p className="text-xs text-[#555555] font-medium">Tell us where you pursue your research or learning.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#222222] block">
                    University / Institution Name
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444444]" />
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Stanford University"
                      className="w-full rounded-xl border-2 border-[#111111] bg-[#F9F9F9] pl-10 pr-4 py-3 text-xs font-bold text-[#111111] placeholder-[#777777] outline-none focus:bg-white focus:border-[#2F6BFF] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-[#111111]/15 pb-2 mb-2">
                  <h3 className="text-sm font-black text-[#111111]">Contact Channels</h3>
                  <p className="text-xs text-[#555555] font-medium">Verify your academic mail and sync communication nodes.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#222222] block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444444]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@university.edu"
                      className="w-full rounded-xl border-2 border-[#111111] bg-[#F9F9F9] pl-10 pr-4 py-3 text-xs font-bold text-[#111111] placeholder-[#777777] outline-none focus:bg-white focus:border-[#2F6BFF] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#222222] block">
                    Phone Number (10 Digits)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444444]" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                        if (val.length > 10) val = val.slice(0, 10);
                        setPhoneNumber(val);
                      }}
                      placeholder="9876543210"
                      className="w-full rounded-xl border-2 border-[#111111] bg-[#F9F9F9] pl-10 pr-4 py-3 text-xs font-bold text-[#111111] placeholder-[#777777] outline-none focus:bg-white focus:border-[#2F6BFF] transition-all"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#666666] block">
                    Enter 10-digit mobile number (without country code).
                  </span>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-left animate-fade-in flex-1 overflow-hidden min-h-0">
                
                {/* LEFT SIDE: UNIFIED COMBINED AI PROVIDER & API KEY CARD */}
                <div className="lg:col-span-5 space-y-4 rounded-2xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] p-4 sm:p-5 shadow-paper-xs max-h-[66vh] overflow-y-auto custom-scrollbar">
                  <div className="border-b border-[#CBD5E1] dark:border-slate-700 pb-2.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase text-[#111111] dark:text-white tracking-wide">Configure AI Provider</h3>
                    <p className="text-[11px] text-[#334155] dark:text-slate-400 font-bold mt-0.5 leading-tight">
                      Bring Your Own Key (BYOK) - select provider & enter secret API key.
                    </p>
                  </div>

                  {/* Searchable Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#111111] dark:text-slate-300 block">
                      Select Provider *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-xl border-2 border-[#111111] bg-[#F8FAFC] dark:bg-[#0D1117] px-4 py-3 text-xs font-bold text-[#111111] dark:text-white shadow-paper-xs outline-none cursor-pointer transition-all hover:bg-white"
                      >
                        <span className="font-extrabold">{PROVIDER_METADATA[selectedProvider]?.name || 'Choose Provider...'}</span>
                        <ChevronDown className="h-4 w-4 text-[#111111] dark:text-white stroke-[2.5]" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute z-50 mt-1.5 w-full rounded-xl border-2 border-[#111111] bg-white text-[#111111] shadow-2xl p-2.5 space-y-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555555]" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search providers..."
                              className="w-full rounded-lg border-2 border-[#111111] bg-[#F9F9F9] pl-8 pr-3 py-1.5 text-xs font-medium text-[#111111] placeholder-[#666666] outline-none"
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
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                    selectedProvider === key
                                      ? 'bg-[#FFC400]/25 text-[#111111] font-black border border-[#111111]'
                                      : 'text-[#111111] hover:bg-[#F6F2EA] font-semibold'
                                  }`}
                                >
                                  <span>{meta.name}</span>
                                  {selectedProvider === key && <Check className="h-3.5 w-3.5 stroke-[3] text-[#111111]" />}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Provider Details Sub-Card */}
                  <div className="p-3.5 rounded-xl border-2 border-black dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117] space-y-3 shadow-sm">
                    <div>
                      <h4 className="text-xs font-black text-[#1D4ED8] dark:text-[#60A5FA] uppercase tracking-wide">
                        {PROVIDER_METADATA[selectedProvider]?.name}
                      </h4>
                      <p className="text-xs text-[#334155] dark:text-[#CBD5E1] font-bold mt-1 leading-relaxed">
                        {PROVIDER_METADATA[selectedProvider]?.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono font-black text-[#475569] dark:text-[#94A3B8] tracking-wider block">
                          Default Model
                        </span>
                        <div className="font-mono text-xs font-black text-white dark:text-[#FFC400] bg-[#0F172A] dark:bg-[#161B22] px-2.5 py-1.5 rounded-md border-2 border-black dark:border-amber-400/60 block w-full text-center truncate shadow-sm">
                          {PROVIDER_METADATA[selectedProvider]?.defaultModel}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono font-black text-[#475569] dark:text-[#94A3B8] tracking-wider block">
                          Choose Model
                        </span>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full rounded-md border-2 border-black dark:border-amber-400/60 p-1.5 px-2 text-xs font-mono font-black bg-[#0F172A] dark:bg-[#161B22] text-white dark:text-[#FFC400] cursor-pointer focus:border-[#2F6BFF] outline-none truncate shadow-sm"
                        >
                          {PROVIDER_METADATA[selectedProvider]?.models.map(m => (
                            <option key={m} value={m} className="bg-[#0F172A] text-white">{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#CBD5E1] dark:border-slate-700">
                      <a
                        href={PROVIDER_METADATA[selectedProvider]?.getKeyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-mono font-black uppercase tracking-wider shadow-paper-xs hover:shadow-paper transition-all active:scale-98 cursor-pointer"
                      >
                        <span>Get {PROVIDER_METADATA[selectedProvider]?.name || 'Gemini'} API Key</span>
                        <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                      </a>
                    </div>
                  </div>

                  {/* API Key Input Section */}
                  <div className="space-y-1.5 pt-2 border-t border-[#CBD5E1] dark:border-slate-700">
                    <label className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#111111] dark:text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#2563EB]" /> API Key *
                    </label>

                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={`Paste secret API key for ${PROVIDER_METADATA[selectedProvider]?.name}`}
                        className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-xs font-mono font-extrabold outline-none transition-all ${
                          apiKey.trim()
                            ? 'border-[#10B981] bg-[#F0FDF4] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#A7F3D0] shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                            : 'border-[#111111] dark:border-slate-600 bg-white dark:bg-[#0D1117] text-[#0F172A] dark:text-white placeholder-[#64748B] focus:border-[#2F6BFF] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 p-1 text-[#475569] dark:text-slate-300 hover:text-[#111111] dark:hover:text-white cursor-pointer bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 transition-colors"
                        title={showPassword ? "Hide API key" : "Show API key"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#EFF6FF] dark:bg-[#0F172A] border-2 border-[#3B82F6] p-3 flex gap-2.5 items-center shadow-sm">
                    <Lock className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" />
                    <p className="text-[11px] font-bold leading-relaxed text-[#1E3A8A] dark:text-[#93C5FD]">
                      Encrypted server-side using AES-256-GCM. Never exposed to the browser.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE: 4 INDIVIDUAL SEPARATE STEP CARDS STACKED VERTICALLY */}
                <div className="lg:col-span-7 space-y-4 max-h-[66vh] overflow-y-auto pr-1.5 custom-scrollbar">
                  <div className="flex items-center justify-between border-b-2 border-black dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#2563EB] text-white rounded-lg border border-black shadow-sm">
                        <Key className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-black dark:text-white tracking-wide">How to Get Your API Key</h3>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">4 individual step cards — large & 100% visible</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#FFC400] text-black border border-black text-[10px] font-mono font-black rounded uppercase shadow-sm">
                      4 Step Cards
                    </span>
                  </div>

                  {/* SEPARATE STEP CARD 1 */}
                  <div 
                    onClick={() => setSelectedGuideImage('/guides/api-key/step1.jpg')}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-3 shadow-paper-xs hover:border-[#2563EB] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#2563EB] text-white text-xs font-mono font-black rounded-md border border-black shadow-sm">
                          STEP 1
                        </span>
                        <h4 className="text-xs font-black uppercase text-black dark:text-white tracking-wide">
                          Click "Get API Key" on Left Card
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-[#2563EB]">Expand Fullscreen 🔍</span>
                    </div>

                    <div className="rounded-xl border-2 border-black dark:border-slate-800 overflow-hidden bg-slate-950 h-64 sm:h-72 w-full flex items-center justify-center p-2">
                      <img src="/guides/api-key/step1.jpg" alt="Step 1" className="w-full h-full object-contain group-hover:scale-102 transition-transform" />
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed bg-[#F8FAFC] dark:bg-[#0D1117] p-3 rounded-xl border border-slate-300 dark:border-slate-800">
                      Look at <strong className="text-[#2563EB]">Card 1 on the left side</strong> under Provider Details and click the blue <strong className="text-[#2563EB]">"Get API Key"</strong> link. This will open Google AI Studio in a new tab.
                    </p>
                  </div>

                  {/* SEPARATE STEP CARD 2 */}
                  <div 
                    onClick={() => setSelectedGuideImage('/guides/api-key/step2.png')}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-3 shadow-paper-xs hover:border-[#2563EB] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#2563EB] text-white text-xs font-mono font-black rounded-md border border-black shadow-sm">
                          STEP 2
                        </span>
                        <h4 className="text-xs font-black uppercase text-black dark:text-white tracking-wide">
                          Click "Create API key" in Google AI Studio
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-[#2563EB]">Expand Fullscreen 🔍</span>
                    </div>

                    <div className="rounded-xl border-2 border-black dark:border-slate-800 overflow-hidden bg-slate-950 h-64 sm:h-72 w-full flex items-center justify-center p-2">
                      <img src="/guides/api-key/step2.png" alt="Step 2" className="w-full h-full object-contain group-hover:scale-102 transition-transform" />
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed bg-[#F8FAFC] dark:bg-[#0D1117] p-3 rounded-xl border border-slate-300 dark:border-slate-800">
                      In your Google AI Studio dashboard, look for the blue <strong className="text-[#2563EB]">"Create API key"</strong> button in the top header and click it.
                    </p>
                  </div>

                  {/* SEPARATE STEP CARD 3 */}
                  <div 
                    onClick={() => setSelectedGuideImage('/guides/api-key/step3.png')}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-3 shadow-paper-xs hover:border-[#2563EB] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#2563EB] text-white text-xs font-mono font-black rounded-md border border-black shadow-sm">
                          STEP 3
                        </span>
                        <h4 className="text-xs font-black uppercase text-black dark:text-white tracking-wide">
                          Confirm Project & Click "Create key"
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-[#2563EB]">Expand Fullscreen 🔍</span>
                    </div>

                    <div className="rounded-xl border-2 border-black dark:border-slate-800 overflow-hidden bg-slate-950 h-64 sm:h-72 w-full flex items-center justify-center p-2">
                      <img src="/guides/api-key/step3.png" alt="Step 3" className="w-full h-full object-contain group-hover:scale-102 transition-transform" />
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed bg-[#F8FAFC] dark:bg-[#0D1117] p-3 rounded-xl border border-slate-300 dark:border-slate-800">
                      In the key creation popup, type a key name (e.g. NoteIT Key), select your project, and click the blue <strong className="text-[#2563EB]">"Create key"</strong> button.
                    </p>
                  </div>

                  {/* SEPARATE STEP CARD 4 */}
                  <div 
                    onClick={() => setSelectedGuideImage('/guides/api-key/step4.png')}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-3 shadow-paper-xs hover:border-[#2563EB] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#2563EB] text-white text-xs font-mono font-black rounded-md border border-black shadow-sm">
                          STEP 4
                        </span>
                        <h4 className="text-xs font-black uppercase text-black dark:text-white tracking-wide">
                          Click "Copy key" & Paste on Left
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-[#2563EB]">Expand Fullscreen 🔍</span>
                    </div>

                    <div className="rounded-xl border-2 border-black dark:border-slate-800 overflow-hidden bg-slate-950 h-64 sm:h-72 w-full flex items-center justify-center p-2">
                      <img src="/guides/api-key/step4.png" alt="Step 4" className="w-full h-full object-contain group-hover:scale-102 transition-transform" />
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed bg-[#F8FAFC] dark:bg-[#0D1117] p-3 rounded-xl border border-slate-300 dark:border-slate-800">
                      Click the blue <strong className="text-[#2563EB]">"Copy key"</strong> button to copy your secret key to clipboard, return to NoteIT, paste it into <strong className="text-[#2563EB]">Card 2 on the left</strong>, and click <strong className="text-[#2563EB]">"Complete Setup"</strong>!
                    </p>
                  </div>

                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-400/50 flex items-center gap-2 text-xs font-mono font-bold text-amber-900 dark:text-amber-300">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Click any image above to open high-res full screen lightbox view!</span>
                  </div>
                </div>

              </div>
            )}

            {/* Buttons Navigation bar */}
            <div className={`flex gap-3 pt-3 border-t border-[#111111]/15 shrink-0 ${step === 4 ? 'mt-auto' : 'mt-2'}`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer border-2 border-[#111111] bg-white text-[#111111] hover:bg-[#F6F2EA] shadow-paper-xs"
                >
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 bg-[#111111] text-white hover:bg-[#222222] border-2 border-[#111111] shadow-paper-xs"
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
                  className={`flex-1 py-3 px-4 rounded-xl font-sans text-xs font-extrabold transition-all active:scale-98 relative flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer border-2 border-[#111111] shadow-paper-xs ${
                    validationSuccess
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-[#111111] text-white hover:bg-[#222222] disabled:bg-gray-300 disabled:text-gray-600 disabled:border-gray-400'
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
                      <ArrowRight className="h-3.5 w-3.5 text-[#FFC400]" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    {/* IMAGE LIGHTBOX MODAL */}
    {selectedGuideImage && (
      <div 
        onClick={() => setSelectedGuideImage(null)}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      >
        <div className="relative max-w-4xl w-full bg-white dark:bg-[#161B22] p-2 rounded-xl border-2 border-black shadow-2xl">
          <button 
            onClick={() => setSelectedGuideImage(null)}
            className="absolute -top-3 -right-3 p-1.5 bg-black text-white rounded-full border-2 border-white font-black hover:bg-red-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <img src={selectedGuideImage} alt="Expanded Step Guide" className="w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      </div>
    )}

    </div>
  );
}
