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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
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
  ArrowLeft,
  Building,
  BookOpen,
  Phone,
  Briefcase
} from 'lucide-react';
import AILogo from './AILogo';
import { Button, Card, Badge, Input } from './bauhaus';

interface AuthViewProps {
  onLoginSuccess: (userData: { fullName: string; emailAddress: string; role?: string }) => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'verify' | 'faculty';
  theme: 'light' | 'dark';
  onNavigateToLanding?: () => void;
}

export default function AuthView({
  onLoginSuccess,
  initialMode = 'login',
  theme,
  onNavigateToLanding
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>(
    initialMode === 'faculty' ? 'login' : initialMode
  );
  const [isFacultyMode, setIsFacultyMode] = useState(initialMode === 'faculty');
  
  // Student & Common Field values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Faculty-specific fields
  const [university, setUniversity] = useState('Chandigarh University');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Associate Professor');
  const [subjectsInput, setSubjectsInput] = useState('Operating Systems, Data Structures');
  const [whatsappNumber, setWhatsappNumber] = useState('919876543210');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const saveFacultyProfile = async (uid: string, userEmail: string, userDisplayName?: string) => {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};

    await setDoc(userDocRef, {
      ...existingData,
      role: 'faculty',
      first_name: (userDisplayName || fullName).split(' ')[0] || 'Dr.',
      last_name: (userDisplayName || fullName).split(' ').slice(1).join(' ') || 'Faculty',
      fullName: userDisplayName || fullName || 'Faculty Member',
      email: userEmail,
      onboarding_completed: existingData.onboarding_completed ?? false,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

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
        
        const detectedRole: 'student' | 'faculty' = isFacultyMode ? 'faculty' : 'student';
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, { 
          role: detectedRole,
          email: userCredential.user.email || email,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (isFacultyMode) {
          await saveFacultyProfile(userCredential.user.uid, userCredential.user.email || email, userCredential.user.displayName || fullName);
        }

        setSuccessMsg(
          detectedRole === 'faculty'
            ? 'Faculty credentials authenticated! Entering Faculty Academic Portal...'
            : 'Token validated! Connecting to research workspace...'
        );

        setTimeout(() => {
          onLoginSuccess({
            fullName: userCredential.user.displayName || fullName || email.split('@')[0],
            emailAddress: userCredential.user.email || email,
            role: detectedRole
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
        
        if (isFacultyMode) {
          await saveFacultyProfile(userCredential.user.uid, email, fullName);
          setSuccessMsg('Faculty academic identity created! Redirecting to Faculty Portal...');
        } else {
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userDocRef, {
            role: 'student',
            fullName: fullName,
            email: email,
            onboarding_completed: false,
            createdAt: serverTimestamp()
          }, { merge: true });
          setSuccessMsg('Academic identity registered successfully! Logging you in...');
        }

        setTimeout(() => {
          onLoginSuccess({
            fullName: fullName,
            emailAddress: email,
            role: isFacultyMode ? 'faculty' : 'student'
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

      const detectedRole: 'student' | 'faculty' = isFacultyMode ? 'faculty' : 'student';
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, { 
        role: detectedRole,
        fullName: userCredential.user.displayName || 'Google User',
        email: userCredential.user.email || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (isFacultyMode) {
        await saveFacultyProfile(
          userCredential.user.uid, 
          userCredential.user.email || '', 
          userCredential.user.displayName || 'Faculty Member'
        );
      }

      onLoginSuccess({
        fullName: userCredential.user.displayName || 'Google User',
        emailAddress: userCredential.user.email || '',
        role: detectedRole
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

      const detectedRole: 'student' | 'faculty' = isFacultyMode ? 'faculty' : 'student';
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, { 
        role: detectedRole,
        fullName: userCredential.user.displayName || 'GitHub User',
        email: userCredential.user.email || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (isFacultyMode) {
        await saveFacultyProfile(
          userCredential.user.uid, 
          userCredential.user.email || '', 
          userCredential.user.displayName || 'Faculty Member'
        );
      }

      onLoginSuccess({
        fullName: userCredential.user.displayName || 'GitHub User',
        emailAddress: userCredential.user.email || '',
        role: detectedRole
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'GitHub Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans bg-grid-paper select-none text-[var(--text-primary)]">
      
      {/* LEFT COLUMN: Product Branding & Showcase */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative border-r-2 border-[var(--border-main)] bg-[var(--sidebar-bg)]">
        
        {/* Brand Header */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={onNavigateToLanding}
        >
          <div className="p-1 rounded-[6px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm">
            <AILogo size={32} theme="light" />
          </div>
          <div>
            <div className="font-heading font-extrabold text-lg text-[var(--text-primary)] tracking-tight">NOTEIT</div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[2px]">
              {isFacultyMode ? 'FACULTY ACADEMIC PORTAL' : 'SCHOLAR WORKSPACE'}
            </div>
          </div>
        </div>

        {/* Tagline & Showcase Card */}
        <div className="space-y-6 my-auto max-w-lg text-left">
          <Badge variant={isFacultyMode ? 'blue' : 'yellow'} size="md">
            {isFacultyMode ? 'FACULTY MANAGEMENT SYSTEM' : 'COGNITIVE AI PLATFORM'}
          </Badge>
          <h1 className="text-4xl font-heading font-extrabold tracking-tight uppercase leading-tight text-[var(--text-primary)]">
            {isFacultyMode ? (
              <>
                ACADEMIC & FACULTY <br />
                <span className="bg-[#38BDF8] text-[#111111] px-2 py-0.5 border-2 border-[var(--border-main)] inline-block shadow-paper-sm mt-1">
                  PORTAL WORKSPACE
                </span>
              </>
            ) : (
              <>
                AI THAT THINKS <br />
                <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 border-2 border-[var(--border-main)] inline-block shadow-paper-sm mt-1">
                  WHILE YOU LEARN
                </span>
              </>
            )}
          </h1>
          <p className="text-sm font-mono text-[var(--text-secondary)] leading-relaxed border-l-4 border-[#FFC400] pl-3 py-1">
            {isFacultyMode
              ? 'Empower your teaching with live course metrics, student doubt management, real-time quiz performance analytics, and AI-driven Class Learning Alerts.'
              : 'NoteIT captures lectures, extracts structural text, generates dynamic notes, flashcards, interactive quizzes, and designs beautiful presentation decks in one unified workspace.'}
          </p>

          {/* Preview Card */}
          <Card shadow="md" className="p-5 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                {isFacultyMode ? 'FACULTY DASHBOARD • LIVE FEED' : 'SPEAKER 1 • ACTIVE SYNTHESIS'}
              </span>
              <Badge variant={isFacultyMode ? 'blue' : 'green'} size="sm">
                {isFacultyMode ? 'FACULTY' : 'COMPLETED'}
              </Badge>
            </div>
            
            <p className="text-xs font-mono text-[var(--text-primary)] leading-relaxed italic">
              {isFacultyMode
                ? '"Class Learning Alert: 14 students raised doubts on Deadlock Prevention. Quiz accuracy: 54%. Recommendation: Revise topic in next lecture."'
                : '"Gradient descent scaling parameters decrease exponentially when optimization adaptive weights are scaled with moving averages of gradients..."'}
            </p>

            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] font-bold">
              <span className="rounded-[4px] bg-[#FFC400] text-[#111111] px-2 py-0.5 border border-[var(--border-main)]">
                {isFacultyMode ? 'Operating Systems' : 'Adam Optimizer'}
              </span>
              <span className="rounded-[4px] bg-[var(--card-bg)] text-[var(--text-primary)] px-2 py-0.5 border border-[var(--border-main)]">
                {isFacultyMode ? '12 Pending Doubts' : 'Gradient Descent'}
              </span>
            </div>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-xs font-mono text-[var(--text-secondary)]">
          © 2026 NoteIT Labs. Powered by BRUTE.
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto bg-[var(--bg-paper)]">
        
        <div className="w-full max-w-md space-y-6">
          {/* Navigation trigger */}
          <div className="flex items-center justify-between">
            {onNavigateToLanding && (
              <button
                onClick={onNavigateToLanding}
                className="text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[#FFC400] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Landing</span>
              </button>
            )}

            {isFacultyMode && (
              <button
                onClick={() => { setIsFacultyMode(false); setMode('login'); }}
                className="text-xs font-mono font-bold text-[#FFC400] hover:underline flex items-center gap-1 cursor-pointer ml-auto"
              >
                <GraduationCap className="h-4 w-4" />
                <span>← Switch to Student Login</span>
              </button>
            )}
          </div>

          <Card shadow="lg" className="p-8 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-6">
            <header className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">
                  {isFacultyMode ? (
                    mode === 'login' ? 'FACULTY PORTAL LOGIN' : 'FACULTY REGISTRATION'
                  ) : (
                    mode === 'login' ? 'ACCESS AI WORKSPACE' : mode === 'signup' ? 'CREATE ACADEMIC IDENTITY' : 'DISCHARGE RESET TOKEN'
                  )}
                </h2>
              </div>
              <p className="text-xs font-mono text-[var(--text-secondary)]">
                {isFacultyMode 
                  ? 'Authenticate with your official university credentials to enter the Teacher Portal.'
                  : (mode === 'login' ? 'Authenticate to enter your research workspace.' : mode === 'signup' ? 'Register your scholar account to begin.' : 'Enter your email to receive a password reset link.')
                }
              </p>
            </header>

            {error && (
              <div className="p-3 rounded-[4px] bg-[#FF4D4D]/10 border-2 border-[#FF4D4D] text-[#FF4D4D] text-xs font-mono font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-[4px] bg-[#19B56B]/15 border-2 border-[#19B56B] text-[var(--text-primary)] text-xs font-mono font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#19B56B] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="FULL NAME & TITLE"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isFacultyMode ? "Dr. Sharma" : "Kishan Verma"}
                />
              )}



              <Input
                label={isFacultyMode ? "FACULTY EMAIL ADDRESS" : "ACADEMIC EMAIL ADDRESS"}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isFacultyMode ? "faculty@university.edu" : "scholar@university.edu"}
              />

              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="section-label text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[2px]">
                      SECURITY PASSWORD
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[10px] font-mono font-bold text-[#38BDF8] hover:underline cursor-pointer"
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
                      className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] p-3 text-xs font-mono font-bold text-[var(--text-primary)] outline-none shadow-paper-sm focus:border-[#FFC400]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                className={`w-full justify-center text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm ${
                  isFacultyMode ? 'bg-[#38BDF8] hover:bg-[#7dd3fc]' : 'bg-[#FFC400] hover:bg-[#ffe066]'
                }`}
              >
                {loading 
                  ? 'AUTHENTICATING...' 
                  : isFacultyMode 
                    ? (mode === 'login' ? 'ENTER FACULTY PORTAL →' : 'REGISTER FACULTY IDENTITY →')
                    : (mode === 'login' ? 'AUTHENTICATE & ENTER →' : mode === 'signup' ? 'CREATE IDENTITY →' : 'SEND RESET LINK')
                }
              </Button>
            </form>

            <div className="relative border-t-2 border-[var(--border-main)] pt-4 text-center">
              <span className="bg-[var(--card-bg)] px-3 text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] absolute -top-2.5 left-1/2 -translate-x-1/2 border border-[var(--border-main)] rounded-[3px]">
                OR CONNECT WITH
              </span>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{ color: 'var(--text-primary)' }}
                  className="social-auth-btn flex items-center justify-center gap-2 p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] font-mono text-xs font-bold uppercase shadow-paper-sm transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                  </svg>
                  <span style={{ color: 'var(--text-primary)' }} className="font-bold">Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGithubSignIn}
                  style={{ color: 'var(--text-primary)' }}
                  className="social-auth-btn flex items-center justify-center gap-2 p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] font-mono text-xs font-bold uppercase shadow-paper-sm transition-colors cursor-pointer"
                >
                  <Github className="h-4 w-4 shrink-0" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-primary)' }} className="font-bold">GitHub</span>
                </button>
              </div>
            </div>

            {/* FACULTY ENTRY POINT BUTTON (PHASE 3) */}
            {!isFacultyMode && (
              <div className="pt-3 border-t border-[var(--border-main)]">
                <button
                  type="button"
                  onClick={() => { setIsFacultyMode(true); setMode('login'); }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-[6px] border-2 border-[#38BDF8] bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] font-mono text-xs font-extrabold uppercase tracking-wide transition-colors cursor-pointer shadow-paper-sm"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>[ FACULTY LOGIN → ]</span>
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t border-[var(--border-main)]">
              {mode === 'login' ? (
                <p className="text-xs font-mono text-[var(--text-secondary)]">
                  New to the platform?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-[var(--text-primary)] underline hover:text-[#38BDF8] cursor-pointer"
                  >
                    {isFacultyMode ? 'Create faculty identity' : 'Create academic identity'}
                  </button>
                </p>
              ) : (
                <p className="text-xs font-mono text-[var(--text-secondary)]">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-[var(--text-primary)] underline hover:text-[#38BDF8] cursor-pointer"
                  >
                    Sign in to workspace
                  </button>
                </p>
              )}
            </div>
          </Card>

          <p className="text-center text-[10px] font-mono text-[var(--text-secondary)]">
            Private academic workspace protected by decentralized key signatures.<br />Powered by NoteIT Labs.
          </p>
        </div>
      </div>
    </div>
  );
}
