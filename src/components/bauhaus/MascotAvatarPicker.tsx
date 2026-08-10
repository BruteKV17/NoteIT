/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Trash2, Sparkles, Upload, Check, X, Shield, ArrowRight } from 'lucide-react';

export interface MascotOption {
  id: string;
  name: string;
  role: string;
  url: string;
}

export const OFFICIAL_MASCOTS: MascotOption[] = [
  { id: 'fox', name: 'Spark Fox', role: 'Lightning Volt', url: '/mascots/mascot-fox.jpg' },
  { id: 'cat', name: 'Cyber Cat', role: 'LED Synth', url: '/mascots/mascot-cat.jpg' },
  { id: 'owl', name: 'Scholar Owl', role: 'Academic Dean', url: '/mascots/mascot-owl.jpg' },
  { id: 'monkey', name: 'Cyber Monkey', role: 'Matrix Hacker', url: '/mascots/mascot-monkey.jpg' },
  { id: 'husky', name: 'Astro Husky', role: 'Space Scholar', url: '/mascots/mascot-husky.jpg' }
];

interface MascotAvatarPickerProps {
  currentAvatarUrl: string;
  onSelectAvatar: (url: string) => void;
  userInitial?: string;
}

export function MascotAvatarPicker({
  currentAvatarUrl,
  onSelectAvatar,
  userInitial = 'U'
}: MascotAvatarPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUrl, setTempSelectedUrl] = useState(currentAvatarUrl);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Sync temp selection when modal opens
  const handleOpenModal = () => {
    setTempSelectedUrl(currentAvatarUrl);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    onSelectAvatar(tempSelectedUrl);
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadLoading(true);
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setTempSelectedUrl(reader.result as string);
        setUploadLoading(false);
      };

      reader.readAsDataURL(file);
    }
  };

  const activeMascot = OFFICIAL_MASCOTS.find(m => m.url === currentAvatarUrl);

  return (
    <div className="space-y-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] p-5 shadow-paper-sm text-[var(--text-primary)] text-left">
      {/* Header & Preview Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[var(--border-main)] pb-4">
        <div className="flex items-center gap-3">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Current Avatar"
              className="h-16 w-16 rounded-[8px] border-2 border-[var(--border-main)] object-cover shadow-paper-sm shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-[8px] border-2 border-[var(--border-main)] bg-[#FFC400] flex items-center justify-center font-bold text-2xl text-[#111111] uppercase shadow-paper-sm shrink-0">
              {userInitial}
            </div>
          )}

          <div>
            <span className="text-[10px] font-mono font-extrabold text-[#38BDF8] uppercase tracking-[2px] block">
              ACADEMIC IDENTITY AVATAR
            </span>
            <h4 className="font-heading font-extrabold text-base text-[var(--text-primary)] uppercase tracking-tight mt-0.5 flex items-center gap-1.5">
              {activeMascot ? activeMascot.name : (currentAvatarUrl ? 'Custom Photo Avatar' : 'Default Initial')}
            </h4>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              {activeMascot ? `Official Mascot • ${activeMascot.role}` : (currentAvatarUrl ? 'User Uploaded Photo' : 'No custom avatar selected')}
            </p>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-[4px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase hover:bg-[#ffe066] transition-all shadow-paper-sm flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>CHOOSE MASCOT OR PHOTO</span>
          </button>

          {currentAvatarUrl && (
            <button
              type="button"
              onClick={() => onSelectAvatar('')}
              className="p-2.5 rounded-[4px] border-2 border-[#FF4D4D] text-[#FF4D4D] font-mono text-xs font-bold uppercase hover:bg-[#FF4D4D] hover:text-white transition-all cursor-pointer shadow-paper-sm"
              title="Reset Avatar to Default Initial"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* MODAL POPUP OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-5xl rounded-[10px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 shadow-paper-lg space-y-6 text-[var(--text-primary)] my-8">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#38BDF8] uppercase tracking-[3px] block">
                  MASCOT GALLERY & AVATAR STUDIO
                </span>
                <h2 className="font-heading font-extrabold text-2xl text-[var(--text-primary)] uppercase tracking-tight mt-1 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-[#FFC400]" />
                  SELECT YOUR ACADEMIC AVATAR
                </h2>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                  Choose from our official NoteIT 3D mascot characters or upload your own high-resolution photo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] hover:bg-[#FF4D4D] hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 1. Official Mascots Grid (FULL ASPECT RATIO CARDS) */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                  OFFICIAL NOTEIT 3D MASCOTS
                </span>
                <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                  5 Characters Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {OFFICIAL_MASCOTS.map((mascot) => {
                  const isSelected = tempSelectedUrl === mascot.url;
                  return (
                    <div
                      key={mascot.id}
                      onClick={() => setTempSelectedUrl(mascot.url)}
                      className={`relative group rounded-[8px] border-2 p-3 flex flex-col justify-between transition-all cursor-pointer shadow-paper-sm ${
                        isSelected
                          ? 'border-[#FFC400] bg-[#FFC400]/15 ring-2 ring-[#FFC400] -translate-y-1'
                          : 'border-[var(--border-main)] bg-[var(--panel-bg)] hover:border-[#FFC400] hover:-translate-y-1'
                      }`}
                    >
                      {/* Full Mascot Image Container */}
                      <div className="relative w-full aspect-square overflow-hidden rounded-[6px] bg-[var(--card-bg)] border border-[var(--border-main)] mb-3">
                        <img
                          src={mascot.url}
                          alt={mascot.name}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 rounded-[4px] bg-[#FFC400] text-[#111111] p-1 border border-[#111111] shadow-paper-xs">
                            <Check className="h-4 w-4 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Character Details */}
                      <div className="space-y-1 text-center">
                        <h4 className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase truncate">
                          {mascot.name}
                        </h4>
                        <span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-mono text-[9px] font-bold uppercase truncate max-w-full">
                          {mascot.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Photo Upload Section */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--border-main)] text-left">
              <span className="text-xs font-mono font-extrabold text-[var(--text-primary)] uppercase tracking-wider block">
                OR UPLOAD YOUR OWN CUSTOM PHOTO
              </span>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[8px] border-2 border-dashed border-[var(--border-main)] bg-[var(--panel-bg)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400]/20 flex items-center justify-center shrink-0">
                    <Camera className="h-6 w-6 text-[#FFC400]" />
                  </div>
                  <div>
                    <h5 className="font-mono text-xs font-extrabold uppercase text-[var(--text-primary)]">
                      Upload Custom Picture File
                    </h5>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                      Supports JPG, PNG, WEBP formats up to 5MB.
                    </p>
                  </div>
                </div>

                <label className="px-5 py-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] font-mono text-xs font-extrabold uppercase hover:bg-[#FFC400] hover:text-[#111111] transition-all cursor-pointer shadow-paper-sm flex items-center gap-2 shrink-0">
                  <Upload className="h-4 w-4" />
                  <span>{uploadLoading ? 'Processing Image...' : 'Browse Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Modal Bottom Action Footer */}
            <div className="pt-4 border-t-2 border-[var(--border-main)] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] text-[var(--text-primary)] font-mono text-xs font-bold uppercase hover:bg-[var(--hover-bg)] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-[4px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase hover:bg-[#ffe066] transition-all shadow-paper-sm flex items-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>CONFIRM & APPLY AVATAR</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
