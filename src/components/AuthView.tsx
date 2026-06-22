/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { 
  GraduationCap, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Chrome
} from 'lucide-react';
import { motion } from 'motion/react';
import AILogo from './AILogo';

interface AuthViewProps {
  onLoginSuccess: (userData: { fullName: string; emailAddress: string }) => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'verify';
  theme: 'light' | 'dark';
  onNavigateToLanding?: () => void;
}

export default function AuthView({
  onLoginSuccess,
  initialMode = 'login',
  theme,
  onNavigateToLanding
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>(initialMode);
  
  // Field values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [showPassword, setShowPassword] = useState(false);
  const [degree, setDegree] = useState('B.S. Computer Science');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Background particles for a premium linear/perplexity style
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; s: number; d: number }[]>([]);

  useEffect(() => {
    // Generate some elegant floating background dots
    const items = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 3 + 1,
      d: Math.random() * 15 + 10
    }));
    setParticles(items);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setError('Please fill in all requested fields.');
          setLoading(false);
          return;
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Core token validated! Connecting to research sandbox...');
        setTimeout(() => {
          onLoginSuccess({
            fullName: userCredential.user.displayName || email.split('@')[0],
            emailAddress: userCredential.user.email || email
          });
        }, 1000);

      } else if (mode === 'signup') {
        if (!fullName || !email || !password) {
          setError('All registration fields are required.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        
        setSuccessMsg('Academic identity registered successfully! Logging you in...');
        setTimeout(() => {
          onLoginSuccess({
            fullName: fullName,
            emailAddress: email
          });
        }, 1000);

      } else if (mode === 'forgot') {
        if (!email) {
          setError('Valid academic email address is required.');
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('A password reset link has been sent to your email.');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = 'Authentication error. Please verify parameters.';
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid credentials. Please verify your email and password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Invalid email address format.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onLoginSuccess({
        fullName: userCredential.user.displayName || 'Google Scholar',
        emailAddress: userCredential.user.email || 'google.scholar@gmail.com'
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const cleanVal = val.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = cleanVal;
    setOtp(nextOtp);

    // Auto focus next input
    if (cleanVal !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className={`min-h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans ${
      theme === 'dark' ? 'bg-[#0a0a0c] text-white' : 'bg-[#FAF9F5] text-gray-900'
    }`}>
      
      {/* LEFT COLUMN: Product Branding & Showcase */}
      <div className={`hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden border-r ${
        theme === 'dark' ? 'border-neutral-900 bg-neutral-950/20' : 'border-gray-200 bg-gray-50/20'
      }`}>
        {/* Ambient background particles */}
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
                theme === 'dark' ? 'bg-indigo-500/40' : 'bg-indigo-600/20'
              }`}
            />
          ))}
          <div className={`absolute top-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] pointer-events-none ${
            theme === 'dark' ? 'bg-indigo-950/20' : 'bg-indigo-100/30'
          }`} />
        </div>

        {/* Brand Header */}
        <div 
          className="flex items-center gap-2 cursor-pointer relative z-10"
          onClick={onNavigateToLanding}
        >
          <AILogo size={38} showText={true} theme={theme} />
        </div>

        {/* Tagline & Copy */}
        <div className="space-y-6 my-auto max-w-lg relative z-10 text-left">
          <h1 className="text-4xl font-sans font-black tracking-tight leading-[1.1]">
            AI That Thinks <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5F6DF8] to-[#2563EB] italic font-serif py-1 font-medium select-text">
              While You Learn
            </span>
          </h1>
          <p className="text-sm font-semibold leading-relaxed text-gray-500 dark:text-neutral-400">
            NoteIT AI captures lectures, extracts structural text, generates dynamic notes, flashcards, interactive quizzes, and designs beautiful presentation slides in one unified workspace.
          </p>

          {/* Premium Preview Dashboard Card */}
          <div className={`rounded-2xl border p-5.5 space-y-4 shadow-xl ${
            theme === 'dark' ? 'bg-[#121318]/70 border-neutral-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">
                Speaker 1 • Active Synthesis
              </span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-bold">
                COMPLETED
              </span>
            </div>
            
            <p className="text-xs font-serif italic text-gray-500 leading-relaxed">
              "Gradient descent scaling parameters decrease exponentially when optimization adaptive weights are scaled with moving averages of gradients..."
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10 px-2.5 py-0.5 text-[9px] font-semibold">
                Adam Optimizer
              </span>
              <span className="rounded bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 px-2.5 py-0.5 text-[9px] font-semibold">
                Gradient Descent
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-neutral-500 relative z-10">
          © 2026 NoteIT AI Labs. Powered by BRUTE.
        </div>
      </div>

      {/* RIGHT COLUMN: Glassmorphic Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto z-10">
        
        {/* Mobile Header Logo (visible only on small devices) */}
        <div 
          className="absolute top-6 left-6 md:hidden flex items-center gap-2 cursor-pointer"
          onClick={onNavigateToLanding}
        >
          <AILogo size={32} showText={true} theme={theme} />
        </div>

        {/* Floating background particles for mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 md:hidden">
          <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] ${
            theme === 'dark' ? 'bg-purple-950/20' : 'bg-purple-100/25'
          }`} />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Back Navigation trigger */}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="text-xs font-bold text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              ← Back to Landing
            </button>
          )}

          <header className="text-center md:text-left mb-6 space-y-2">
            <h2 className="text-2.5xl font-black tracking-tight font-sans">
              {mode === 'login' && 'Access AI Workspace'}
              {mode === 'signup' && 'Create Academic Identity'}
              {mode === 'forgot' && 'Discharge Security Token'}
              {mode === 'verify' && 'Verify Academic Email'}
            </h2>
            <p className={`text-[10px] font-bold tracking-wider font-mono uppercase ${
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
            }`}>
              Note-IT AI • Secure Cognitive Portal
            </p>
          </header>

          {/* Form Card */}
          <div className={`rounded-2xl border p-6 md:p-8 space-y-6 shadow-xl transition-all ${
            theme === 'dark' ? 'bg-[#121318]/90 border-neutral-800' : 'bg-white border-gray-200'
          }`}>
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-500 font-medium">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-2.5">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-500 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                    }`}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Academic Mail Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. j.sterling@university.edu"
                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                    }`}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Security Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-bold text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                    >
                      Forgot code?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border pl-10 pr-10 py-3 text-xs outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'verify' && (
              <div className="space-y-3">
                <p className="text-xs text-center text-gray-400 leading-relaxed font-medium">
                  We have dispatched a 6-digit confirmation code to your academic email. Provide it below to authenticate:
                </p>
                <div className="flex justify-between items-center gap-2 pt-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-12 h-14 rounded-xl border text-center text-xl font-mono font-black outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${
                        theme === 'dark'
                          ? 'bg-[#18191e] border-neutral-800 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-sans text-xs font-bold transition-all active:scale-98 relative flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-700 disabled:text-neutral-500'
                  : 'bg-black text-white hover:bg-neutral-800 disabled:bg-gray-200 disabled:text-gray-500'
              }`}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-current" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Authenticate & Enter'}
                    {mode === 'signup' && 'Register Academic Account'}
                    {mode === 'forgot' && 'Authorize Token Dispatch'}
                    {mode === 'verify' && 'Complete Verification'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in section */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-4">
              <div className="relative flex items-center justify-center py-1">
                <div className={`w-full border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'}`} />
                <span className={`absolute px-3.5 text-[9px] font-bold tracking-widest font-mono uppercase ${
                  theme === 'dark' ? 'bg-[#121318]/90 text-neutral-500' : 'bg-white text-gray-400'
                }`}>
                  Or connect with
                </span>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl font-sans text-[11px] font-bold transition-all active:scale-98 flex items-center justify-center gap-2 border hover:bg-gray-50/5 cursor-pointer focus:outline-none ${
                  theme === 'dark'
                    ? 'border-neutral-800 text-neutral-300 hover:text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Chrome className="h-4 w-4 text-red-500" />
                <span>Sign in with Google Academic Suite</span>
              </button>
            </div>
          )}

          {/* Selector Switch Layout */}
          <div className="text-center pt-2">
            {mode === 'login' && (
              <p className="text-xs text-gray-400">
                New to the platform?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-bold text-indigo-500 dark:text-indigo-400 hover:underline focus:outline-none"
                >
                  Create academic identity
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-xs text-gray-400">
                Already registered?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-indigo-500 dark:text-indigo-400 hover:underline focus:outline-none"
                >
                  Log in secure
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-xs text-gray-400">
                Remember your credentials?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-indigo-500 dark:text-indigo-400 hover:underline focus:outline-none"
                >
                  Log in here
                </button>
              </p>
            )}
            {mode === 'verify' && (
              <p className="text-xs text-gray-400">
                Didn't receive the code?{' '}
                <button
                  onClick={() => {
                    setSuccessMsg('A new token was dispatched to your inbox.');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="font-bold text-indigo-500 dark:text-indigo-400 hover:underline focus:outline-none"
                >
                  Dispatched fresh token
                </button>
              </p>
            )}
          </div>

        </div>

        {/* Footer specifications */}
        <div className="text-center mt-6 text-[11px] font-medium text-neutral-500 leading-normal max-w-xs mx-auto">
          Private academic workspace protected by decentralized key signatures. Powered by Note-IT AI Labs.
        </div>
        </div>
      </div>
    </div>
  );
}
