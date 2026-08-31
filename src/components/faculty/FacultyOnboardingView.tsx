import React, { useState } from 'react';
import { GraduationCap, ArrowRight, ArrowLeft, ShieldCheck, User, Phone, Building, BookOpen, Check, Award } from 'lucide-react';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { generateTeacherCode } from '../../services/teacherDoubtService';

interface FacultyOnboardingViewProps {
  userId: string;
  email: string;
  initialFullName?: string;
  onComplete: (facultyData: {
    fullName: string;
    phoneNumber: string;
    university: string;
    department: string;
    teacherCode: string;
  }) => void;
}

export default function FacultyOnboardingView({
  userId,
  email,
  initialFullName = '',
  onComplete
}: FacultyOnboardingViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState<'Prof.' | 'Dr.' | 'Mr.' | 'Ms.' | 'Mx.'>('Prof.');
  const [firstName, setFirstName] = useState(initialFullName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(initialFullName.split(' ').slice(1).join(' ') || '');
  const [designation, setDesignation] = useState('Assistant Professor');
  
  const [university, setUniversity] = useState('Chandigarh University');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [subjects, setSubjects] = useState('Operating Systems, Data Structures');

  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Live preview of Teacher Code
  const fullNameCalculated = `${title} ${firstName.trim()} ${lastName.trim()}`.trim();
  const liveTeacherCode = generateTeacherCode(`${firstName.trim()} ${lastName.trim()}` || 'Professor');

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your First Name and Surname.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!university.trim() || !department.trim()) {
      setError('Please enter your University and Department.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number (without country code).');
      return;
    }

    const activeUid = userId || auth.currentUser?.uid;
    if (!activeUid) {
      setError('Session user ID missing. Please refresh and log in again.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // 1. Uniqueness Checks wrapped in safe try-catch (falls back if query listing is restricted by Firestore security rules)
      try {
        const usersRef = collection(db, 'users');

        // Phone Uniqueness Check
        const phoneQ1 = query(usersRef, where('phone_number', '==', cleanPhone));
        const phoneSnap1 = await getDocs(phoneQ1);
        const isPhoneDup1 = phoneSnap1.docs.some(docSnap => docSnap.id !== activeUid);

        const phoneQ2 = query(usersRef, where('whatsapp_number', '==', cleanPhone));
        const phoneSnap2 = await getDocs(phoneQ2);
        const isPhoneDup2 = phoneSnap2.docs.some(docSnap => docSnap.id !== activeUid);

        if (isPhoneDup1 || isPhoneDup2) {
          setError('This phone number is already registered with another account. Each account must have a unique phone number.');
          setSaving(false);
          return;
        }

        // Email Uniqueness Check
        if (email && email.trim()) {
          const cleanEmail = email.trim().toLowerCase();
          const emailQ = query(usersRef, where('email', '==', cleanEmail));
          const emailSnap = await getDocs(emailQ);
          const isEmailDup = emailSnap.docs.some(docSnap => docSnap.id !== activeUid);

          if (isEmailDup) {
            setError('This email address is already registered with another account. Each account must have a unique email address.');
            setSaving(false);
            return;
          }
        }
      } catch (checkErr: any) {
        console.warn('Uniqueness query skipped due to Firestore security rule restrictions:', checkErr);
      }

      const generatedCode = generateTeacherCode(`${firstName.trim()} ${lastName.trim()}`);
      const subList = subjects.split(',').map(s => s.trim()).filter(Boolean);

      const userRef = doc(db, 'users', activeUid);
      await setDoc(userRef, {
        role: 'faculty',
        title,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        fullName: fullNameCalculated,
        email: email.trim().toLowerCase(),
        phone_number: cleanPhone,
        whatsapp_number: cleanPhone,
        school_or_university: university.trim(),
        department: department.trim(),
        designation: designation.trim(),
        subjects: subList,
        teacherCode: generatedCode,
        onboarding_completed: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      onComplete({
        fullName: fullNameCalculated,
        phoneNumber: cleanPhone,
        university: university.trim(),
        department: department.trim(),
        teacherCode: generatedCode
      });
    } catch (err: any) {
      console.error('Faculty onboarding error:', err);
      if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
        setError('Firestore Security Rule restriction: Please ensure rules permit write access to /users/{userId}.');
      } else {
        setError(err.message || 'Failed to initialize faculty workspace profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Header Badge & Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-[var(--app-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E] text-[#22C55E]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#22C55E] uppercase block">
                FACULTY REGISTRATION • STEP {step} OF 3
              </span>
              <h1 className="text-lg sm:text-xl font-black text-[var(--app-text)] tracking-tight">
                {step === 1 && 'Personal Identity'}
                {step === 2 && 'Academic Institution'}
                {step === 3 && 'Doubt Portal Setup'}
              </h1>
            </div>
          </div>

          {/* Teacher Code Badge */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-mono text-[var(--app-muted)] uppercase">Teacher Code</span>
            <span className="font-mono text-sm font-black text-[#F59E0B]">{liveTeacherCode}</span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--app-muted)] mb-2">
            <span className={step >= 1 ? 'text-[#22C55E]' : ''}>1. Identity</span>
            <span className={step >= 2 ? 'text-[#22C55E]' : ''}>2. Institution</span>
            <span className={step >= 3 ? 'text-[#22C55E]' : ''}>3. Doubt Portal</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--app-surface-alt)] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#22C55E] transition-all duration-500 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E] text-[#F43F5E] text-xs font-mono font-bold">
            {error}
          </div>
        )}

        {/* STEP 1 CARD: Personal & Academic Identity */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-5 animate-fade-in">
            {/* Title Selector */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                TITLE
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mx.'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className={`py-2 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                      title === t
                        ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] hover:bg-[var(--app-border)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                  FIRST NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[var(--app-muted)]" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Kishan"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                  SURNAME / LAST NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[var(--app-muted)]" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Verma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                DESIGNATION / POSITION
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-3 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Assistant Professor / Associate Professor"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            {/* Generated Code Preview Box */}
            <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--app-muted)] block">Generated Teacher Code</span>
                <span className="font-mono text-xl font-black text-[#F59E0B]">{liveTeacherCode}</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--app-muted)] text-right max-w-[120px]">
                Students use this UID code to connect with you
              </span>
            </div>

            <div className="pt-4 border-t border-[var(--app-border)] flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>NEXT: ACADEMIC DETAILS</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 CARD: Institution & Department */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                UNIVERSITY / INSTITUTION *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Chandigarh University"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                DEPARTMENT *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                ASSIGNED SUBJECTS (COMMA SEPARATED)
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  required
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="Operating Systems, Data Structures, Algorithms"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--app-muted)] mt-1 block">
                You can edit these anytime later in Profile Settings.
              </span>
            </div>

            <div className="pt-4 border-t border-[var(--app-border)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] hover:bg-[var(--app-border)] text-[var(--app-text)] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>BACK</span>
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>NEXT: DOUBT PORTAL SETUP</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 CARD: Doubt Portal & Contact Setup */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                WHATSAPP / PHONE NUMBER * (FOR STUDENT DOUBTS)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length === 12 && val.startsWith('91')) {
                      val = val.slice(2);
                    }
                    if (val.length > 10) {
                      val = val.slice(0, 10);
                    }
                    setPhoneNumber(val);
                  }}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--app-muted)] mt-1 block">
                Enter 10-digit mobile number (without country code). Used for WhatsApp doubt alerts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                FACULTY EMAIL ADDRESS
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)]/60 text-[var(--app-muted)] font-sans text-sm cursor-not-allowed"
              />
            </div>

            {/* Profile Summary Box */}
            <div className="p-4 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase text-[#22C55E] flex items-center justify-between">
                <span>Profile Overview</span>
                <span className="font-mono text-[#F59E0B]">{liveTeacherCode}</span>
              </div>
              <div className="text-sm font-bold text-[var(--app-text)]">
                {fullNameCalculated} ({designation})
              </div>
              <div className="text-xs text-[var(--app-muted)]">
                {department} · {university}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--app-border)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-alt)] hover:bg-[var(--app-border)] text-[var(--app-text)] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>BACK</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span>{saving ? 'INITIALIZING...' : 'ENTER TEACHER PORTAL'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
