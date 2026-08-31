/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Building, 
  BookOpen, 
  Phone, 
  CheckCircle, 
  Save, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Award, 
  MessageSquare, 
  Plus, 
  X, 
  Star, 
  ShieldCheck, 
  GraduationCap,
  Mail,
  User,
  Camera,
  Share2
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { generateTeacherCode } from '../../services/teacherDoubtService';

interface FacultyProfileSettingsProps {
  user: { uid: string; fullName: string; emailAddress: string; teacherCode?: string };
}

export default function FacultyProfileSettings({ user }: FacultyProfileSettingsProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('Chandigarh University');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Associate Professor');
  const [officeHours, setOfficeHours] = useState('Mon - Fri, 2:00 PM - 5:00 PM');
  const [officeLocation, setOfficeLocation] = useState('Academic Block 3, Room 402');
  const [whatsappNumber, setWhatsappNumber] = useState('9876543210');
  const [bio, setBio] = useState('Specializing in Operating Systems, Distributed Computing, and System Architecture.');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Subjects chip list
  const [subjectList, setSubjectList] = useState<string[]>(['Operating Systems', 'Data Structures']);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Preferences & Toggles
  const [autoAssignDoubts, setAutoAssignDoubts] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);

  // System states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculated names
  const fullNameCalculated = `${firstName.trim()} ${lastName.trim()}`.trim() || user.fullName;
  const currentTeacherCode = user.teacherCode || generateTeacherCode(fullNameCalculated);

  useEffect(() => {
    if (!user.uid) {
      setLoadingProfile(false);
      return;
    }

    const fetchFacultyData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
          if (data.school_or_university) setUniversity(data.school_or_university);
          if (data.department) setDepartment(data.department);
          if (data.designation) setDesignation(data.designation);
          if (data.office_hours) setOfficeHours(data.office_hours);
          if (data.office_location) setOfficeLocation(data.office_location);
          if (data.whatsapp_number || data.phone_number) {
            let clean = (data.whatsapp_number || data.phone_number).replace(/\D/g, '');
            if (clean.length === 12 && clean.startsWith('91')) clean = clean.slice(2);
            if (clean.length > 10) clean = clean.slice(0, 10);
            setWhatsappNumber(clean);
          }
          if (data.bio) setBio(data.bio);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (Array.isArray(data.subjects)) setSubjectList(data.subjects);
          if (typeof data.auto_assign_doubts === 'boolean') setAutoAssignDoubts(data.auto_assign_doubts);
          if (typeof data.whatsapp_notifications === 'boolean') setWhatsappNotifications(data.whatsapp_notifications);
        }
      } catch (err) {
        console.error('Failed to load faculty profile in settings:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchFacultyData();
  }, [user.uid]);

  const handleAddSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubjectInput.trim()) return;
    if (subjectList.includes(newSubjectInput.trim())) {
      setNewSubjectInput('');
      return;
    }
    setSubjectList([...subjectList, newSubjectInput.trim()]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subToRemove: string) => {
    setSubjectList(subjectList.filter(s => s !== subToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number (without country code).');
      return;
    }

    setSaving(true);
    setSavedSuccess(false);

    try {
      if (user.uid) {
        try {
          const usersRef = collection(db, 'users');

          // Phone Uniqueness Check
          const phoneQ1 = query(usersRef, where('phone_number', '==', cleanPhone));
          const phoneSnap1 = await getDocs(phoneQ1);
          const dup1 = phoneSnap1.docs.some(docSnap => docSnap.id !== user.uid);

          const phoneQ2 = query(usersRef, where('whatsapp_number', '==', cleanPhone));
          const phoneSnap2 = await getDocs(phoneQ2);
          const dup2 = phoneSnap2.docs.some(docSnap => docSnap.id !== user.uid);

          if (dup1 || dup2) {
            setErrorMessage('This phone number is already registered with another account. Each account must have a unique phone number.');
            setSaving(false);
            return;
          }
        } catch (checkErr) {
          console.warn('Phone uniqueness query skipped due to Firestore security rule restrictions:', checkErr);
        }

        const userRef = doc(db, 'users', user.uid);
        const generatedCode = generateTeacherCode(fullNameCalculated);

        await setDoc(userRef, {
          role: 'faculty',
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          fullName: fullNameCalculated,
          email: user.emailAddress.trim().toLowerCase(),
          school_or_university: university.trim(),
          department: department.trim(),
          designation: designation.trim(),
          office_hours: officeHours.trim(),
          office_location: officeLocation.trim(),
          subjects: subjectList,
          whatsapp_number: cleanPhone,
          phone_number: cleanPhone,
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          teacherCode: generatedCode,
          auto_assign_doubts: autoAssignDoubts,
          whatsapp_notifications: whatsappNotifications,
          onboarding_completed: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error updating faculty profile:', err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(currentTeacherCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loadingProfile) {
    return (
      <div className="p-8 text-center font-mono text-xs text-[var(--app-muted)] space-y-2">
        <div className="w-6 h-6 border-2 border-[var(--app-brand)] border-t-transparent rounded-full animate-spin mx-auto" />
        <div>Loading Faculty Profile & Preferences...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#38BDF8] uppercase block">
            FACULTY IDENTITY & PREFERENCES
          </span>
          <h1 className="text-2xl font-black text-[var(--app-text)] tracking-tight">
            Profile & Academic Settings
          </h1>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 text-xs font-mono font-bold flex items-center gap-3 animate-fade-in shadow-md">
          <CheckCircle size={20} className="shrink-0" />
          <div>
            <div className="font-extrabold uppercase">PROFILE SAVED SUCCESSFULLY!</div>
            <div className="text-[11px] font-normal">Your teacher profile and Student Connect UID ({currentTeacherCode}) are updated in Firestore.</div>
          </div>
        </div>
      )}

      {/* HEADER CARD WITH TEACHER CODE & STATS */}
      <div className="p-6 rounded-2xl bg-[var(--app-surface)] border-2 border-[var(--app-border)] shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Avatar & Name Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#38BDF8] text-white font-mono font-black flex items-center justify-center text-3xl shadow-lg border-2 border-[var(--app-border)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Faculty Avatar" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  firstName.charAt(0).toUpperCase() || 'F'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-brand)]">
                <GraduationCap size={14} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[var(--app-text)]">{fullNameCalculated}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-mono font-bold uppercase border border-emerald-500/30">
                  VERIFIED FACULTY
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--app-muted)] mt-0.5">{designation} • {department}</p>
              <p className="text-xs font-mono text-[var(--app-brand)] font-bold">{university}</p>
            </div>
          </div>

          {/* Teacher Code Display Card */}
          <div className="p-4 rounded-xl bg-[#FFC400]/10 border-2 border-[#FFC400] text-left md:text-right space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--app-muted)]">
              STUDENT CONNECT TEACHER CODE
            </div>
            <div className="flex items-center md:justify-end gap-2">
              <span className="text-2xl font-mono font-black text-[#FFC400] tracking-widest">
                {currentTeacherCode}
              </span>
              <button
                onClick={copyCodeToClipboard}
                className="p-2 rounded-lg bg-[#FFC400] text-[#111111] font-mono text-xs font-bold hover:bg-[#ffe066] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                title="Copy Teacher Code for students"
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? 'COPIED!' : 'COPY'}</span>
              </button>
            </div>
            <div className="text-[10px] font-mono text-[var(--app-muted)]">
              Share with students to connect directly for doubts
            </div>
          </div>
        </div>

        {/* Quick KPI Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--app-border)] text-xs font-mono">
          <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-center">
            <div className="text-[10px] text-[var(--app-muted)] uppercase">ENROLLED STUDENTS</div>
            <div className="text-lg font-bold text-[var(--app-text)] mt-0.5">441 Scholars</div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-center">
            <div className="text-[10px] text-[var(--app-muted)] uppercase">ACTIVE COURSES</div>
            <div className="text-lg font-bold text-[var(--app-brand)] mt-0.5">{subjectList.length} Subjects</div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-center">
            <div className="text-[10px] text-[var(--app-muted)] uppercase">DOUBTS RESOLVED</div>
            <div className="text-lg font-bold text-emerald-500 mt-0.5">142 Answered</div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-center">
            <div className="text-[10px] text-[var(--app-muted)] uppercase">RATING & FEEDBACK</div>
            <div className="text-lg font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-1">
              <Star size={14} className="fill-current text-amber-500" />
              <span>4.9 / 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSave} className="space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-500 text-xs font-mono font-bold">
            {errorMessage}
          </div>
        )}
        
        {/* Personal & Academic Details Section */}
        <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-[var(--app-text)] flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
            <User size={18} className="text-[var(--app-brand)]" />
            Personal & Academic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">FIRST NAME *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Kishan"
                className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">SURNAME / LAST NAME *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Verma"
                className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">OFFICIAL EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="email"
                  value={user.emailAddress}
                  disabled
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-muted)] font-mono text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">WHATSAPP / PHONE NUMBER *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                    if (val.length > 10) val = val.slice(0, 10);
                    setWhatsappNumber(val);
                  }}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--app-muted)] mt-1 block">
                Enter 10-digit mobile number (without country code). Used for student doubt alerts.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">UNIVERSITY / COLLEGE *</label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Chandigarh University"
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">DEPARTMENT *</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">ACADEMIC DESIGNATION *</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Associate Professor"
                className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">OFFICE / CABIN LOCATION</label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="Academic Block 3, Room 402"
                className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">OFFICE HOURS (STUDENT CONSULTATION)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="Mon - Fri, 2:00 PM - 5:00 PM"
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--app-text)] uppercase mb-1">PROFILE PHOTO / AVATAR URL</label>
              <div className="relative">
                <Camera className="absolute left-3 top-3.5 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
                />
              </div>
            </div>
          </div>

          <div className="text-xs font-mono">
            <label className="block font-bold text-[var(--app-text)] uppercase mb-1">TEACHING BIO & SPECIALIZATION</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your research interests, teaching philosophy, or office hours..."
              className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)] resize-none"
            />
          </div>
        </div>

        {/* Assigned Subjects Manager */}
        <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-[var(--app-text)] flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
            <BookOpen size={18} className="text-[var(--app-brand)]" />
            Assigned Subjects & Automatic Doubt Routing
          </h3>

          <p className="text-xs font-mono text-[var(--app-muted)] leading-relaxed">
            Students asking doubts in these subjects will automatically have doubts assigned to your portal feed and WhatsApp notifications.
          </p>

          {/* Chips list */}
          <div className="flex flex-wrap gap-2 pt-1">
            {subjectList.map((sub, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--app-brand)]/10 text-[var(--app-brand)] border border-[var(--app-brand)]/30 font-mono text-xs font-bold">
                <span>{sub}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(sub)}
                  className="p-0.5 rounded hover:bg-rose-500/20 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add Subject Input */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
              placeholder="Add new subject (e.g. Cloud Computing)..."
              className="flex-1 p-2.5 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="px-4 py-2.5 rounded-xl bg-[var(--app-brand)] text-white font-mono text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-90"
            >
              <Plus size={14} />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Communication & Notification Preferences */}
        <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-[var(--app-text)] flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
            <MessageSquare size={18} className="text-[var(--app-brand)]" />
            Communication & Routing Preferences
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] cursor-pointer">
              <div>
                <div className="font-bold text-[var(--app-text)]">Automatic Student Doubt Assignment</div>
                <div className="text-[10px] text-[var(--app-muted)]">Automatically route subject doubts to my Faculty Portal</div>
              </div>
              <input
                type="checkbox"
                checked={autoAssignDoubts}
                onChange={(e) => setAutoAssignDoubts(e.target.checked)}
                className="w-4 h-4 accent-[var(--app-brand)] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] cursor-pointer">
              <div>
                <div className="font-bold text-[var(--app-text)]">WhatsApp Notification Alerts</div>
                <div className="text-[10px] text-[var(--app-muted)]">Allow students to trigger prefilled WhatsApp chat for urgent doubts</div>
              </div>
              <input
                type="checkbox"
                checked={whatsappNotifications}
                onChange={(e) => setWhatsappNotifications(e.target.checked)}
                className="w-4 h-4 accent-[var(--app-brand)] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--app-muted)]">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Profile stored securely in Firestore users collection</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-white font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? 'SAVING PROFILE...' : 'SAVE ALL PROFILE CHANGES'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
