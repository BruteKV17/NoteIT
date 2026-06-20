import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Phone, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface OnboardingViewProps {
  userId: string;
  email: string;
  fullName: string;
  theme: 'light' | 'dark';
  onComplete: (userData: any) => void;
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
  onComplete
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

  // Step state (1: Personal, 2: Academic, 3: Contact)
  const [step, setStep] = useState(1);

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

  const handleNextStep = (e: React.MouseEvent) => {
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
    }
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Final validations
    if (!firstName.trim() || !lastName.trim() || !school.trim() || !email.trim() || !countryCode || !phoneNumber.trim()) {
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
      setLoading(false);
      onComplete(profileData);
    } catch (err: any) {
      console.error("Onboarding Save Failed:", {
        currentUserUID: userId,
        authenticatedState: !!userId,
        firestoreDocumentPath: `users/${userId}`,
        writeRequestPayload: profileData,
        exactFirestoreError: err
      });
      setError(err.message || 'Failed to save onboarding settings. Please try again.');
      setLoading(false);
    }
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
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : isDark ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' : 'bg-gray-100 text-gray-450 border border-gray-200'
                }`}>
                  {s}
                </div>
                {s < 3 && (
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
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {step === 1 && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="border-b border-neutral-900/10 dark:border-neutral-850/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Personal Identity</h3>
                  <p className="text-[10px] text-gray-450">Let's register your scholarly name.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 block">
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
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-455 block">
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
                <div className="border-b border-neutral-900/10 dark:border-neutral-850/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Academic Profile</h3>
                  <p className="text-[10px] text-gray-455">Tell us where you pursue your research or learning.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 block">
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
                <div className="border-b border-neutral-900/10 dark:border-neutral-850/40 pb-2 mb-2">
                  <h3 className="text-sm font-black">Contact Channels</h3>
                  <p className="text-[10px] text-gray-455">Verify your academic mail and sync communication nodes.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 block">
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
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 block truncate">
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
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 block">
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

            {/* Buttons Navigation bar */}
            <div className="flex gap-3 pt-4 border-t border-neutral-900/10 dark:border-neutral-850/40">
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

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                    isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all active:scale-98 relative flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                    isDark
                      ? 'bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-700 disabled:text-neutral-500'
                      : 'bg-black text-white hover:bg-neutral-800 disabled:bg-gray-200 disabled:text-gray-500'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving profile...</span>
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
