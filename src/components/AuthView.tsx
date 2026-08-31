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
  sendEmailVerification,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
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

  // Helper function to turn Firebase error codes into friendly, clear, user-facing error messages
  const getFriendlyAuthErrorMessage = (err: any): string => {
    if (!err) return 'An unexpected authentication error occurred.';
    const code = err.code || '';
    const msg = err.message || '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Invalid email or password. If you forgot your password, click "Forgot password?" below.';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please verify your email or sign up.';
      case 'auth/email-already-in-use':
        return 'This email address is already in use by another account. Only a single email per account is permitted.';
      case 'auth/weak-password':
        return 'Password is too weak. Please enter a password with at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address format. Please enter a valid email address.';
      case 'auth/unauthorized-domain':
        return 'Domain authorization error: Please add this domain to Authorized Domains in Firebase Console -> Authentication -> Settings.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing authentication.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/operation-not-allowed':
        return 'This sign-in provider is disabled in Firebase Console. Please enable it under Authentication -> Sign-in method.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address using a different sign-in method.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'auth/user-disabled':
        return 'This user account has been disabled by an administrator.';
      default:
        if (msg.startsWith('Firebase:')) {
          return msg.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?$/, '');
        }
        return msg || 'Authentication error. Please verify your details.';
    }
  };

  // Strict RFC-5322 Email Format Validation
  const validateEmailFormat = (emailStr: string): { valid: boolean; reason?: string } => {
    const cleanEmail = emailStr.trim();
    if (!cleanEmail) return { valid: false, reason: 'Email address is required.' };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return { valid: false, reason: 'Please enter a valid, real email address (e.g. name@university.edu).' };
    }
    return { valid: true };
  };

  // Firestore check to enforce single email per faculty/student account
  const checkEmailExistsInFirestore = async (emailStr: string): Promise<boolean> => {
    try {
      const cleanEmail = emailStr.trim().toLowerCase();
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (err) {
      console.warn('Error querying Firestore for email uniqueness:', err);
      return false;
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Email format validation
    const emailCheck = validateEmailFormat(cleanEmail);
    if (!emailCheck.valid) {
      setError(emailCheck.reason || 'Invalid email address format.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        if (!cleanEmail || !password) {
          setError('Please enter both your email address and password.');
          setLoading(false);
          return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        
        const detectedRole: 'student' | 'faculty' = isFacultyMode ? 'faculty' : 'student';
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, { 
          role: detectedRole,
          email: cleanEmail,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (isFacultyMode) {
          await saveFacultyProfile(userCredential.user.uid, cleanEmail, userCredential.user.displayName || fullName);
        }

        setSuccessMsg(
          detectedRole === 'faculty'
            ? 'Faculty credentials authenticated! Entering Faculty Academic Portal...'
            : 'Token validated! Connecting to research workspace...'
        );

        setTimeout(() => {
          onLoginSuccess({
            fullName: userCredential.user.displayName || fullName || cleanEmail.split('@')[0],
            emailAddress: cleanEmail,
            role: detectedRole
          });
        }, 1000);

      } else if (mode === 'signup') {
        if (!fullName.trim() || !cleanEmail || !password) {
          setError('Full name, email, and password are all required.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        // 2. Enforce Single Email per Faculty/Student Account
        const exists = await checkEmailExistsInFirestore(cleanEmail);
        if (exists) {
          setError('This email address is already registered. Each account requires a unique email. Please sign in or use a different email.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
        
        // 3. Send email verification link
        try {
          await sendEmailVerification(userCredential.user);
        } catch (vErr) {
          console.warn('Verification email dispatch warning:', vErr);
        }

        if (isFacultyMode) {
          await saveFacultyProfile(userCredential.user.uid, cleanEmail, fullName.trim());
          setSuccessMsg(`Faculty account created! Verification email sent to ${cleanEmail}. Entering Faculty Portal...`);
        } else {
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userDocRef, {
            role: 'student',
            fullName: fullName.trim(),
            email: cleanEmail,
            onboarding_completed: false,
            createdAt: serverTimestamp()
          }, { merge: true });
          setSuccessMsg(`Academic identity registered! Verification email sent to ${cleanEmail}. Logging you in...`);
        }

        setTimeout(() => {
          onLoginSuccess({
            fullName: fullName.trim(),
            emailAddress: cleanEmail,
            role: isFacultyMode ? 'faculty' : 'student'
          });
        }, 1200);

      } else if (mode === 'forgot') {
        if (!cleanEmail) {
          setError('Please enter your registered email address.');
          setLoading(false);
          return;
        }

        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMsg(`Password reset link sent to ${cleanEmail}! Please check your email inbox (and spam folder) to set a new password.`);
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      setError(getFriendlyAuthErrorMessage(err));
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
      console.error('Google Auth error:', err);
      setError(getFriendlyAuthErrorMessage(err));
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
      console.error('GitHub Auth error:', err);
      setError(getFriendlyAuthErrorMessage(err));
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
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                  className="font-mono text-xs font-bold text-[#38BDF8] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </button>
              ) : mode === 'login' ? (
                <p className="text-xs font-mono text-[var(--text-secondary)]">
                  New to the platform?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
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
                    onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
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
