/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Trash2, Sparkles, Upload, Check, User } from 'lucide-react';

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
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadLoading(true);
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        onSelectAvatar(reader.result as string);
        setUploadLoading(false);
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] p-5 shadow-paper-sm text-[var(--text-primary)] text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
        <div>
          <span className="text-[10px] font-mono font-extrabold text-[#38BDF8] uppercase tracking-[2px] block">
            CUSTOMIZATION
          </span>
          <h4 className="font-heading font-extrabold text-base text-[var(--text-primary)] uppercase tracking-tight mt-0.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFC400]" />
            PROFILE AVATAR & MASCOTS
          </h4>
        </div>

        {/* Current Active Preview Pill */}
        <div className="flex items-center gap-2">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Current Avatar"
              className="h-10 w-10 rounded-[6px] border-2 border-[var(--border-main)] object-cover shadow-paper-xs"
            />
          ) : (
            <div className="h-10 w-10 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] flex items-center justify-center font-bold text-sm text-[#111111] uppercase shadow-paper-xs">
              {userInitial}
            </div>
          )}
        </div>
      </div>

      {/* 1. Official Mascots Section */}
      <div className="space-y-2">
        <label className="block text-[10px] font-mono font-extrabold text-[var(--text-secondary)] uppercase">
          CHOOSE AN OFFICIAL NOTEIT MASCOT
        </label>
        
        <div className="grid grid-cols-5 gap-2.5">
          {OFFICIAL_MASCOTS.map((mascot) => {
            const isSelected = currentAvatarUrl === mascot.url;
            return (
              <button
                key={mascot.id}
                type="button"
                onClick={() => onSelectAvatar(mascot.url)}
                className={`relative group rounded-[6px] border-2 p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FFC400] bg-[#FFC400]/15 ring-2 ring-[#FFC400] shadow-paper-sm scale-105'
                    : 'border-[var(--border-main)] bg-[var(--card-bg)] hover:border-[#FFC400] hover:-translate-y-0.5'
                }`}
                title={`${mascot.name} (${mascot.role})`}
              >
                <div className="relative overflow-hidden rounded-[4px]">
                  <img
                    src={mascot.url}
                    alt={mascot.name}
                    className="h-12 w-12 object-cover rounded-[4px]"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#FFC400]/40 flex items-center justify-center">
                      <Check className="h-5 w-5 text-[#111111] stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono font-bold truncate max-w-full text-[var(--text-primary)]">
                  {mascot.name.split(' ')[1] || mascot.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Photo Upload Section */}
      <div className="space-y-2 pt-2 border-t border-[var(--border-main)]/40">
        <label className="block text-[10px] font-mono font-extrabold text-[var(--text-secondary)] uppercase">
          OR UPLOAD YOUR OWN CUSTOM PHOTO
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] font-mono text-xs font-bold uppercase hover:bg-[#FFC400] hover:text-[#111111] transition-all cursor-pointer shadow-paper-sm">
            <Upload className="h-4 w-4" />
            <span>{uploadLoading ? 'Uploading...' : 'Upload Custom Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {currentAvatarUrl && (
            <button
              type="button"
              onClick={() => onSelectAvatar('')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] border-2 border-[#FF4D4D] text-[#FF4D4D] font-mono text-xs font-bold uppercase hover:bg-[#FF4D4D] hover:text-white transition-all cursor-pointer shadow-paper-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Avatar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
