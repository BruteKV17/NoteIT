/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle, Bug, Sparkles, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

interface FeedbackWidgetProps {
  theme: 'light' | 'dark';
}

export default function FeedbackWidget({ theme }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Please complete all requested feedback fields.');
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      const feedbackData = {
        type,
        subject: subject.trim(),
        description: description.trim(),
        email: currentUser?.email || email.trim() || 'anonymous@noteit.ai',
        userId: currentUser?.uid || 'anonymous',
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`
        },
        createdAt: serverTimestamp()
      };

      const feedbackRef = collection(db, 'feedback');
      await addDoc(feedbackRef, feedbackData);
      
      setSubmitted(true);
      setSubject('');
      setDescription('');
      setEmail('');
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setErrorMsg(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setSubmitted(false);
            setErrorMsg(null);
          }}
          className={`h-11 w-11 rounded-full flex items-center justify-center shadow-2xl border transition-all hover:scale-108 hover:rotate-6 active:scale-95 focus:outline-none cursor-pointer ${
            isDark
              ? 'bg-indigo-600 hover:bg-indigo-505 border-indigo-500/35 text-white shadow-indigo-950/45'
              : 'bg-black hover:bg-neutral-850 border-neutral-800 text-white shadow-gray-400/30'
          }`}
          title="Send Feedback"
        >
          <MessageSquare className="h-5.5 w-5.5 text-indigo-200" />
        </button>
      )}

      {/* Expandable Feedback Modal Dialog */}
      {isOpen && (
        <div className={`w-80 rounded-2xl border p-5 shadow-2xl space-y-4 animate-fade-in relative z-50 ${
          isDark ? 'bg-[#121318]/95 border-neutral-800 text-white backdrop-blur-md' : 'bg-white border-gray-200 text-gray-900 shadow-xl'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-900/10 dark:border-neutral-850/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 text-[8.5px] font-bold text-indigo-400 font-mono">
                TELEMETRY REPORT
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-black">Feedback Transmitted</h4>
              <p className="text-[10px] text-neutral-450 leading-relaxed max-w-[220px] mx-auto">
                Thank you! Our engineering team has received your telemetry data and will analyze it shortly.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer focus:outline-none ${
                  isDark ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Close Gateway
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] text-red-500 font-medium leading-normal">{errorMsg}</span>
                </div>
              )}

              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${
                    type === 'bug'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                      : isDark
                        ? 'border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:border-neutral-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Bug className="h-3.5 w-3.5" />
                  <span>Report Bug</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('feature')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${
                    type === 'feature'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                      : isDark
                        ? 'border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:border-neutral-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Suggest Feature</span>
                </button>
              </div>

              {/* Email (only shown if not logged in) */}
              {!auth.currentUser && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-450 block">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                    }`}
                  />
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-450 block">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={type === 'bug' ? 'e.g. Audio recording fails on Safari' : 'e.g. Dark Mode contrast improvements'}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition-all ${
                    isDark
                      ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                  }`}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-450 block">
                  Description Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'bug' ? 'Describe the issue, step-by-step to reproduce, or any error messages.' : 'Describe your feature idea and how it would improve NoteIT.'}
                  className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-[#18191e] border-neutral-800 text-white placeholder-neutral-500 focus:border-indigo-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                  }`}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-700 disabled:text-neutral-500'
                    : 'bg-black text-white hover:bg-neutral-800 disabled:bg-gray-200 disabled:text-gray-500'
                }`}
              >
                {loading ? (
                  <span>Transmitting...</span>
                ) : (
                  <>
                    <span>Submit Telemetry</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
