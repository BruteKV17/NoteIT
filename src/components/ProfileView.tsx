/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Camera, 
  Trash2, 
  CheckCircle, 
  Save, 
  ArrowLeft,
  Phone,
  AlertCircle
} from 'lucide-react';
import { UserSettings } from '../types';

interface ProfileViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  setActivePage: (page: any) => void;
  theme: 'light' | 'dark';
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

export default function ProfileView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme
}: ProfileViewProps) {
  
  // Local editable fields initialized from global state settings
  const [firstName, setFirstName] = useState(settings.profile.firstName || '');
  const [lastName, setLastName] = useState(settings.profile.lastName || '');
  const [school, setSchool] = useState(settings.profile.institution || '');
  const [email, setEmail] = useState(settings.profile.emailAddress || '');
  const [countryCode, setCountryCode] = useState(settings.profile.countryCode || '');
  const [phoneNumber, setPhoneNumber] = useState(settings.profile.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(settings.profile.avatarUrl || '');
  
  // Feedback states
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Profile image mock upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadLoading(true);
      setError(null);
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setTimeout(() => {
          setAvatarUrl(reader.result as string);
          setUploadLoading(false);
        }, 1200); // realistic mock loading latency
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Field validations
    if (!firstName.trim() || !lastName.trim() || !school.trim() || !email.trim() || !countryCode || !phoneNumber.trim()) {
      setError('All fields are required.');
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

    // Construct updated settings object
    const updatedSettings: UserSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        emailAddress: email.trim(),
        avatarUrl,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        institution: school.trim(),
        countryCode,
        phoneNumber: cleanPhone,
        onboardingCompleted: true
      }
    };

    onUpdateSettings(updatedSettings);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      setActivePage('dashboard');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 md:space-y-8 animate-fade-in relative">
      
      {/* Save Success Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#121318] text-white rounded-2xl p-4.5 border border-neutral-800 shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans">Profile Updated successfully</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Recalibrating academic filters...</p>
          </div>
        </div>
      )}

      {/* Header Page row */}
      <div className="flex items-center justify-between border-b pb-5 border-gray-200/60 dark:border-neutral-800/65">
        <div className="space-y-1">
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors pb-1 focus:outline-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="font-sans font-extrabold text-2xl md:text-3.5xl tracking-tight">Academic Identity</h1>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider font-mono">
            {firstName && lastName ? `${firstName} ${lastName}` : 'Scholar Profile'} • Identity Management
          </p>
        </div>

        <button
          onClick={handleSaveChanges}
          className={`flex items-center gap-2 rounded-xl py-3 px-5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98 focus:outline-none ${
            theme === 'dark' 
              ? 'bg-[#2563EB] text-white hover:bg-indigo-505' 
              : 'bg-black text-white hover:bg-neutral-850'
          }`}
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSaveChanges} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Details */}
        <div className="space-y-6">
          <div className={`rounded-xl border p-6 flex flex-col items-center text-center space-y-4 shadow-xs ${
            theme === 'dark' ? 'bg-[#121318]/40 border-neutral-855' : 'bg-white border-gray-200'
          }`}>
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="h-28 w-28 rounded-full border-2 border-indigo-500 object-cover"
                />
              ) : (
                <div className="h-28 w-28 rounded-full border-2 border-dashed border-indigo-500/50 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-450 dark:text-neutral-500">
                  <User className="h-12 w-12" />
                </div>
              )}
              {uploadLoading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-sans font-bold text-base">
                {firstName && lastName ? `${firstName} ${lastName}` : 'Anonymous Scholar'}
              </h3>
              <p className="text-[11px] font-medium text-gray-405 leading-normal truncate max-w-[180px]">
                {school || 'Institutional workspace'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1 w-full items-center">
              {avatarUrl ? (
                <div className="flex flex-col sm:flex-row gap-2 justify-center w-full">
                  <label className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-all focus:outline-none cursor-pointer ${
                    theme === 'dark'
                      ? 'border-neutral-800 hover:bg-neutral-850 text-neutral-300'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>
                    <Camera className="h-3.5 w-3.5" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-all focus:outline-none ${
                      theme === 'dark'
                        ? 'border-neutral-800 hover:bg-red-500/15 hover:text-red-400 text-neutral-400'
                        : 'border-gray-200 hover:bg-red-50 text-red-650 text-gray-650'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-1.5 py-1.5 px-4.5 rounded-lg text-[11px] font-bold border transition-all focus:outline-none cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-850'
                    : 'bg-black hover:bg-neutral-850 text-white border-black'
                }`}>
                  <Camera className="h-3.5 w-3.5" />
                  <span>Upload Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Form Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className={`rounded-xl border p-6 space-y-5 ${
            theme === 'dark' ? 'bg-[#121318]/40 border-neutral-850' : 'bg-white border-gray-200'
          }`}>
            <h3 className="font-sans font-extrabold text-base border-b pb-3 border-gray-150/60 dark:border-neutral-800">
              Personal Credentials
            </h3>
            
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-500 font-semibold">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
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
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
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
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                University / School Name
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="University / school"
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                      : 'bg-gray-50 border-gray-200 text-gray-950 focus:border-black'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block truncate">
                  Country Code
                </label>
                <select
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                  }`}
                >
                  <option value="" disabled>Select</option>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number"
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#18191e] border-neutral-800 text-white focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-950 focus:border-black'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
