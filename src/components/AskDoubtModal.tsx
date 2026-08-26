/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, HelpCircle, Send, Paperclip, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { Button, Card, Badge } from './bauhaus';
import { validateAttachment, getAssignedFacultyForSubject, createDoubtInFirestore, getWhatsAppDeepLink, getFacultyByTeacherCode } from '../services/teacherDoubtService';
import { DoubtItem } from '../types';

interface AskDoubtModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedText?: string;
  initialSubject?: string;
  initialLectureTitle?: string;
  initialTopic?: string;
  studentUser: { uid: string; fullName: string; emailAddress: string; institution?: string };
}

export default function AskDoubtModal({
  isOpen,
  onClose,
  initialSelectedText = '',
  initialSubject = 'Operating Systems',
  initialLectureTitle = '',
  initialTopic = '',
  studentUser
}: AskDoubtModalProps) {
  const [subject, setSubject] = useState(initialSubject || 'Operating Systems');
  const [lectureTitle, setLectureTitle] = useState(initialLectureTitle || '');
  const [topic, setTopic] = useState(initialTopic || '');
  const [question, setQuestion] = useState('');
  const [selectedText, setSelectedText] = useState(initialSelectedText || '');
  
  // Teacher Code search state
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [matchedTeacher, setMatchedTeacher] = useState<{ teacherId: string; teacherName: string; whatsappNumber: string; teacherCode: string } | null>(null);
  const [searchingCode, setSearchingCode] = useState(false);
  const [codeSearchResult, setCodeSearchResult] = useState<string | null>(null);
  
  // Attachment file state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedDoubt, setSubmittedDoubt] = useState<DoubtItem | null>(null);

  if (!isOpen) return null;

  const handleTeacherCodeSearch = async (code: string) => {
    setTeacherCodeInput(code);
    setCodeSearchResult(null);
    if (code.trim().length >= 4) {
      setSearchingCode(true);
      const res = await getFacultyByTeacherCode(code);
      setSearchingCode(false);
      if (res) {
        setMatchedTeacher(res);
        setCodeSearchResult(`✓ Connected: ${res.teacherName} (${res.teacherCode})`);
      } else {
        setMatchedTeacher(null);
        if (code.trim().length >= 8) {
          setCodeSearchResult(`No faculty found with code "${code.toUpperCase()}". Default subject teacher will be assigned.`);
        }
      }
    } else {
      setMatchedTeacher(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validation = validateAttachment(selectedFile);
      if (!validation.valid) {
        setFileError(validation.error || 'Invalid file.');
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!question.trim() && !selectedText.trim()) {
      setError('Please provide a question or select text for your doubt.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. If teacher matched by Teacher Code, use them; else fallback to assigned subject faculty
      const faculty = matchedTeacher 
        ? { teacherId: matchedTeacher.teacherId, teacherName: matchedTeacher.teacherName, whatsappNumber: matchedTeacher.whatsappNumber }
        : await getAssignedFacultyForSubject(subject, studentUser.institution);

      // 2. Prepare metadata reference for attachment if present
      let attachmentUrl = '';
      let attachmentType = '';
      let attachmentName = '';
      let attachmentSize = 0;

      if (file) {
        attachmentName = file.name;
        attachmentType = file.type;
        attachmentSize = file.size;
        attachmentUrl = `file_placeholder_${Date.now()}_${file.name}`;
      }

      // 3. Save doubt to Firestore
      const newDoubtData: Omit<DoubtItem, 'id' | 'createdAt' | 'status'> = {
        studentId: studentUser.uid || 'student_demo',
        studentName: studentUser.fullName || 'Student Scholar',
        studentUniversity: studentUser.institution || 'Chandigarh University',
        studentClass: 'B.Tech CSE AI/ML',
        subjectId: subject.toLowerCase().replace(/\s+/g, '_'),
        subjectName: subject,
        teacherId: faculty.teacherId,
        teacherName: faculty.teacherName,
        lectureTitle: lectureTitle || 'Lecture Note',
        topic: topic || (selectedText ? 'Highlighted Concept' : 'General Query'),
        question: question.trim() || `Clarification needed on: "${selectedText.slice(0, 60)}..."`,
        selectedText: selectedText || '',
        attachmentUrl: attachmentUrl || '',
        attachmentType: attachmentType || '',
        attachmentName: attachmentName || '',
        attachmentSize: attachmentSize || 0,
        priority: 'medium'
      };

      const docId = await createDoubtInFirestore(newDoubtData);

      const completeDoubt: DoubtItem = {
        ...newDoubtData,
        id: docId,
        createdAt: new Date(),
        status: 'NEW'
      };

      setSubmittedDoubt(completeDoubt);
    } catch (err: any) {
      console.error('Error submitting doubt:', err);
      setError(err.message || 'Failed to submit doubt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card shadow="lg" className="w-full max-w-lg bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-5 p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[4px] bg-[#FFC400] text-[#111111] border border-[var(--border-main)] shadow-paper-sm font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)]">
                {submittedDoubt ? 'DOUBT SUBMITTED' : 'ASK ACADEMIC DOUBT'}
              </h2>
              <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                {submittedDoubt ? 'Assigned to Subject Faculty' : 'Direct Academic Communication'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-main)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-[4px] bg-[#FF4D4D]/15 border-2 border-[#FF4D4D] text-[#FF4D4D] text-xs font-mono font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {submittedDoubt ? (
          /* SUCCESS SUBMISSION CARD WITH STUDENT-TRIGGERED WHATSAPP BUTTON (SAFEGUARD #5 & PHASE 12) */
          <div className="space-y-5 py-2 text-center">
            <div className="w-12 h-12 rounded-[6px] bg-[#19B56B]/20 text-[#19B56B] border-2 border-[#19B56B] flex items-center justify-center mx-auto">
              <CheckCircle size={24} />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-lg text-[var(--text-primary)] uppercase">
                Doubt Submitted Successfully!
              </h3>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                Assigned to: <strong className="text-[var(--text-primary)]">{submittedDoubt.teacherName || 'Subject Faculty'}</strong>
              </p>
            </div>

            <div className="p-4 rounded-[6px] bg-[var(--panel-bg)] border-2 border-[var(--border-main)] text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-[var(--border-main)] pb-1.5">
                <span className="text-[var(--text-secondary)]">Subject:</span>
                <span className="font-bold text-[var(--text-primary)]">{submittedDoubt.subjectName}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-main)] pb-1.5">
                <span className="text-[var(--text-secondary)]">Doubt ID:</span>
                <span className="font-bold text-[var(--text-primary)]">{submittedDoubt.id}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Question / Context:</span>
                <p className="text-[var(--text-primary)] font-semibold mt-1">
                  {submittedDoubt.question}
                </p>
              </div>
            </div>

            {/* STUDENT-TRIGGERED WHATSAPP BUTTON */}
            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                You can optionally notify your faculty member on WhatsApp with your prefilled doubt details:
              </p>
              
              <a
                href={getWhatsAppDeepLink(submittedDoubt)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-[6px] bg-[#25D366] text-[#111111] font-mono font-extrabold text-xs uppercase tracking-wide border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#22bf5b] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={16} />
                <span>[ 💬 Open WhatsApp Chat ]</span>
              </a>

              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="w-full justify-center mt-2"
              >
                Done / Close Modal
              </Button>
            </div>
          </div>
        ) : (
          /* DOUBT CREATION FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Highlighted text preview */}
            {selectedText && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  HIGHLIGHTED NOTE TEXT
                </label>
                <div className="p-3 rounded-[6px] bg-[#FFC400]/15 border-2 border-[#FFC400] text-xs font-mono italic text-[var(--text-primary)] leading-relaxed">
                  "{selectedText}"
                </div>
              </div>
            )}

            {/* CONNECT BY TEACHER CODE */}
            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)] uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>CONNECT TO PROFESSOR (TEACHER CODE)</span>
                <span className="text-[#38BDF8]">Optional (e.g. KISHVERM)</span>
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="Enter Teacher Code (e.g. KISHVERM)"
                value={teacherCodeInput}
                onChange={(e) => handleTeacherCodeSearch(e.target.value)}
                className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-mono font-bold text-xs uppercase tracking-widest outline-none shadow-paper-sm focus:border-[#38BDF8]"
              />
              {codeSearchResult && (
                <div className={`text-[11px] font-mono font-bold mt-1 ${
                  matchedTeacher ? 'text-[#19B56B]' : 'text-[var(--text-secondary)]'
                }`}>
                  {codeSearchResult}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase text-[10px] tracking-wider block">SUBJECT</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none shadow-paper-sm"
                >
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Data Structures & Algorithms">Data Structures</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Database Management">Database Management</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase text-[10px] tracking-wider block">TOPIC / MODULE</label>
                <input
                  type="text"
                  placeholder="e.g. Deadlock Prevention"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none shadow-paper-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)] uppercase text-[10px] tracking-wider block">YOUR QUESTION / EXPLANATION NEEDED</label>
              <textarea
                rows={3}
                required={!selectedText}
                placeholder="Explain what specific part you found confusing..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-xs font-mono text-[var(--text-primary)] font-bold outline-none shadow-paper-sm resize-none focus:border-[#FFC400]"
              />
            </div>

            {/* FILE ATTACHMENT WITH VALIDATION (SAFEGUARD #6 & PHASE 9) */}
            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)] uppercase text-[10px] tracking-wider block">
                ATTACHMENT (Max 10MB - PDF, Images, Docs)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="w-full p-2 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-xs font-mono text-[var(--text-primary)] outline-none shadow-paper-sm file:mr-3 file:py-1 file:px-3 file:rounded-[4px] file:border-2 file:border-[var(--border-main)] file:bg-[#FFC400] file:text-[#111111] file:font-mono file:font-bold file:text-xs"
                />
              </div>
              {fileError && <p className="text-[10px] font-mono text-[#FF4D4D] font-bold">{fileError}</p>}
              {file && <p className="text-[10px] font-mono text-[#19B56B] font-bold">✓ Attached: {file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center bg-[#FFC400] text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm"
            >
              {isSubmitting ? 'SUBMITTING DOUBT...' : 'SUBMIT DOUBT TO FACULTY →'}
            </Button>
          </form>
        )}

      </Card>
    </div>
  );
}
