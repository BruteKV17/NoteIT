/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
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
  Github,
  ArrowLeft
} from 'lucide-react';
import AILogo from './AILogo';
import { Button, Card, Badge, Input } from './bauhaus';

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
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        setSuccessMsg('Token validated! Connecting to research workspace...');
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
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onLoginSuccess({
        fullName: userCredential.user.displayName || 'Google User',
        emailAddress: userCredential.user.email || ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onLoginSuccess({
        fullName: userCredential.user.displayName || 'GitHub User',
        emailAddress: userCredential.user.email || ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'GitHub Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans bg-grid-paper select-none text-[#111111]">
      
      {/* LEFT COLUMN: Product Branding & Showcase */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative border-r-2 border-[#111111] bg-white">
        
        {/* Brand Header */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={onNavigateToLanding}
        >
          <div className="p-1 rounded-[6px] bg-[#FFC400] border-2 border-[#111111] shadow-paper-sm">
            <AILogo size={32} theme="light" />
          </div>
          <div>
            <div className="font-heading font-extrabold text-lg text-[#111111] tracking-tight">NOTEIT AI</div>
            <div className="text-[10px] font-mono font-bold text-[#666666] uppercase tracking-[2px]">SCHOLAR WORKSPACE</div>
          </div>
        </div>

        {/* Tagline & Showcase Card */}
        <div className="space-y-6 my-auto max-w-lg text-left">
          <Badge variant="yellow" size="md">
            COGNITIVE AI PLATFORM
          </Badge>
          <h1 className="text-4xl font-heading font-extrabold tracking-tight uppercase leading-tight text-[#111111]">
            AI THAT THINKS <br />
            <span className="bg-[#FFC400] px-2 py-0.5 border-2 border-[#111111] inline-block shadow-paper-sm mt-1">
              WHILE YOU LEARN
            </span>
          </h1>
          <p className="text-sm font-mono text-[#666666] leading-relaxed border-l-4 border-[#111111] pl-3 py-1">
            NoteIT AI captures lectures, extracts structural text, generates dynamic notes, flashcards, interactive quizzes, and designs beautiful presentation decks in one unified workspace.
          </p>

          {/* Premium Preview Card */}
          <Card shadow="md" className="p-5 bg-[#F6F2EA] border-2 border-[#111111] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#666666]">
                SPEAKER 1 • ACTIVE SYNTHESIS
              </span>
              <Badge variant="green" size="sm">
                COMPLETED
              </Badge>
            </div>
            
            <p className="text-xs font-mono text-[#111111] leading-relaxed italic">
              "Gradient descent scaling parameters decrease exponentially when optimization adaptive weights are scaled with moving averages of gradients..."
            </p>

            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] font-bold">
              <span className="rounded-[4px] bg-[#FFC400] px-2 py-0.5 border border-[#111111]">
                Adam Optimizer
              </span>
              <span className="rounded-[4px] bg-white px-2 py-0.5 border border-[#111111]">
                Gradient Descent
              </span>
            </div>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-xs font-mono text-[#666666]">
          © 2026 NoteIT AI Labs. Powered by BRUTE.
        </div>
      </div>

      {/* RIGHT COLUMN: Bauhaus Login / Signup Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto">
        
        <div className="w-full max-w-md space-y-6">
          {/* Back Navigation trigger */}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="text-xs font-mono font-bold text-[#666666] hover:text-[#111111] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Landing</span>
            </button>
          )}

          <Card shadow="lg" className="p-8 bg-white border-2 border-[#111111] space-y-6">
            <header className="space-y-1">
              <h2 className="text-2xl font-heading font-extrabold uppercase text-[#111111] tracking-tight">
                {mode === 'login' && 'ACCESS AI WORKSPACE'}
                {mode === 'signup' && 'CREATE ACADEMIC IDENTITY'}
                {mode === 'forgot' && 'DISCHARGE RESET TOKEN'}
              </h2>
              <p className="text-xs font-mono text-[#666666]">
                {mode === 'login' && 'Authenticate to enter your research workspace.'}
                {mode === 'signup' && 'Register your scholar account to begin.'}
                {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
              </p>
            </header>

            {error && (
              <div className="p-3 rounded-[4px] bg-[#FF4D4D]/10 border-2 border-[#FF4D4D] text-[#FF4D4D] text-xs font-mono font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-[4px] bg-[#19B56B]/15 border-2 border-[#19B56B] text-[#111111] text-xs font-mono font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#19B56B] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="FULL NAME"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kishan Verma"
                />
              )}

              <Input
                label="ACADEMIC EMAIL ADDRESS"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@university.edu"
              />

              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[2px]">
                      SECURITY PASSWORD
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[10px] font-mono font-bold text-[#2F6BFF] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-[6px] border-2 border-[#111111] bg-white p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={loading}
                className="w-full justify-center"
              >
                {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'AUTHENTICATE & ENTER →' : mode === 'signup' ? 'CREATE IDENTITY →' : 'SEND RESET LINK'}
              </Button>
            </form>

            <div className="relative border-t-2 border-[#111111] pt-4 text-center">
              <span className="bg-white px-3 text-[10px] font-mono font-bold uppercase text-[#666666] absolute -top-2.5 left-1/2 -translate-x-1/2">
                OR CONNECT WITH
              </span>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] font-mono text-xs font-bold uppercase shadow-paper-sm hover:bg-[#FFC400] transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGithubSignIn}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] font-mono text-xs font-bold uppercase shadow-paper-sm hover:bg-[#FFC400] transition-colors cursor-pointer"
                >
                  <Github className="h-4 w-4 text-[#111111]" />
                  <span>GitHub</span>
                </button>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-gray-200">
              {mode === 'login' ? (
                <p className="text-xs font-mono text-[#666666]">
                  New to the platform?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-[#111111] underline hover:text-[#2F6BFF] cursor-pointer"
                  >
                    Create academic identity
                  </button>
                </p>
              ) : (
                <p className="text-xs font-mono text-[#666666]">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-[#111111] underline hover:text-[#2F6BFF] cursor-pointer"
                  >
                    Sign in to workspace
                  </button>
                </p>
              )}
            </div>
          </Card>

          <p className="text-center text-[10px] font-mono text-[#666666]">
            Private academic workspace protected by decentralized key signatures.<br />Powered by NoteIT AI Labs.
          </p>
        </div>
      </div>
    </div>
  );
}
