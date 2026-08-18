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
import { Button, Card, Badge, Input } from './bauhaus';
import { MascotAvatarPicker } from './bauhaus/MascotAvatarPicker';

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
  
  const [firstName, setFirstName] = useState(settings.profile.firstName || '');
  const [lastName, setLastName] = useState(settings.profile.lastName || '');
  const [school, setSchool] = useState(settings.profile.institution || '');
  const [email, setEmail] = useState(settings.profile.emailAddress || '');
  const [countryCode, setCountryCode] = useState(settings.profile.countryCode || '+91');
  const [phoneNumber, setPhoneNumber] = useState(settings.profile.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(settings.profile.avatarUrl || '');
  
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

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
        }, 1200);
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
    <div className="max-w-5xl mx-auto pb-16 space-y-6 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* Save Success Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#19B56B] text-white rounded-[6px] p-4 border-2 border-[#111111] shadow-paper-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-white" />
          <div>
            <h4 className="text-xs font-heading font-extrabold uppercase">PROFILE UPDATED SUCCESSFULLY</h4>
            <p className="text-[10px] font-mono mt-0.5">Recalibrating academic identity...</p>
          </div>
        </div>
      )}

      {/* Header Page row */}
      <div className="rounded-[6px] border-2 border-[#111111] bg-white p-6 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1 text-xs font-mono font-bold text-[#666666] hover:text-[#111111] transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>BACK TO DASHBOARD</span>
          </button>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#111111] uppercase tracking-tight">
            ACADEMIC IDENTITY
          </h1>
          <p className="text-xs text-[#666666] font-mono mt-1">
            {firstName && lastName ? `${firstName} ${lastName}` : 'Scholar Profile'} • IDENTITY MANAGEMENT
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={handleSaveChanges}
          icon={<Save className="h-4 w-4" />}
          className="bg-[#FFC400]"
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSaveChanges} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Summary */}
        <div className="space-y-6 w-full">
          <Card shadow="md" className="p-4 sm:p-5 bg-[var(--card-bg)] border-2 border-[var(--border-main)] flex flex-col items-center text-center space-y-4 w-full overflow-hidden">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="h-28 w-28 rounded-[6px] border-2 border-[var(--border-main)] object-cover shadow-paper-sm"
                />
              ) : (
                <div className="h-28 w-28 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] flex items-center justify-center text-[#111111] font-heading font-bold text-3xl shadow-paper-sm">
                  {firstName ? firstName.charAt(0) : 'U'}
                </div>
              )}
              {uploadLoading && (
                <div className="absolute inset-0 bg-[#111111]/70 rounded-[6px] flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1 w-full overflow-hidden">
              <h3 className="font-heading font-extrabold text-base text-[var(--text-primary)] uppercase truncate px-2">
                {firstName && lastName ? `${firstName} ${lastName}` : 'Anonymous Scholar'}
              </h3>
              <p className="text-xs font-mono text-[var(--text-secondary)] truncate max-w-[220px] mx-auto">
                {school || 'Institutional workspace'}
              </p>
            </div>

            <div className="w-full">
              <MascotAvatarPicker
                currentAvatarUrl={avatarUrl}
                onSelectAvatar={(url) => setAvatarUrl(url)}
                userInitial={firstName ? firstName.charAt(0) : 'U'}
              />
            </div>
          </Card>
        </div>

        {/* Right Columns: Form Fields */}
        <div className="md:col-span-2 space-y-6">
          <Card shadow="md" className="p-6 bg-white border-2 border-[#111111] space-y-5">
            <h3 className="section-label text-xs font-bold text-[#111111] uppercase tracking-[3px] border-b-2 border-[#111111] pb-3">
              PERSONAL CREDENTIALS
            </h3>
            
            {error && (
              <div className="rounded-[4px] bg-[#FF4D4D]/10 border-2 border-[#FF4D4D] p-3.5 flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-[#FF4D4D] shrink-0 mt-0.5" />
                <div className="text-xs text-[#FF4D4D] font-mono font-bold">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="FIRST NAME"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />

              <Input
                label="LAST NAME"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>

            <Input
              label="UNIVERSITY / SCHOOL NAME"
              type="text"
              required
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Chandigarh University"
            />

            <Input
              label="EMAIL ADDRESS"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scholar@university.edu"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[2px]">
                  COUNTRY CODE
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full rounded-[6px] border-2 border-[#111111] bg-white p-3 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.name.split('(')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="PHONE NUMBER"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="7471111980"
                />
              </div>
            </div>
          </Card>
        </div>

      </form>
    </div>
  );
}
