/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PageId =
  | 'landing'
  | 'dashboard'
  | 'research-hub'
  | 'academic-library'
  | 'quiz-mode'
  | 'notifications'
  | 'settings'
  | 'help-support'
  | 'pricing'
  | 'lecture-capture'
  | 'lecture-processing'
  | 'profile'
  | 'knowledge-studio'
  | 'auth';

export interface Citation {
  text: string;
  sourceId: string;
  page?: number;
  timestamp?: string;
  chapter?: string;
}

export interface ChatHistoryRecord {
  lectureId: string;
  chatHistory: { sender: 'user' | 'ai'; text: string; citations?: Citation[] }[];
}

export interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'recording' | 'video';
  size?: string;
  url?: string;
  addedAt: string;
  wordCount?: number;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  duration?: string;
  pages?: number;
  addedAt: string;
  status: 'recording' | 'uploading' | 'uploaded' | 'transcribing' | 'generating_notes' | 'generated' | 'failed' | 'extracting' | 'analyzing' | 'completed';
  type: 'recording' | 'pdf' | 'ppt' | 'text';
  audioUrl?: string;
  blobPath?: string;
  storageProvider?: string;
  storageVersion?: number;
  geminiModel?: string;
  processingTimeMs?: number;
  createdAt?: any;
  uploadedAt?: any;
  processingStartedAt?: any;
  processingCompletedAt?: any;
  transcript?: string;
  summary?: string;
  flashcards?: { q: string; a: string }[];
  quiz?: { question: string; options: string[]; correctAnswer: number; explanation: string }[];
  keyConcepts?: { id: string; label: string; desc: string; parent?: string; x: number; y: number; group: string }[];
  cleanTranscript?: string;
  sections?: { id: string; title: string; startTime: string; endTime: string; content: string }[];
  timeline?: { time: string; title: string; description: string }[];
  sourceIntelligence?: { keyPeople: string[]; keyTerms: string[]; formulas: string[]; dates: string[]; statistics: string[]; references: string[] };
}

export interface WeakTopic {
  id: string;
  topicName: string;
  subject: string;
  masteryScore: number; // percentage
  lastAttempt: string;
  aiDiagnosis: string;
  actionPlan: string[];
}

export interface QuizQuestion {
  id: string;
  type?: 'mcq' | 'true_false' | 'fill_blank' | 'match_following' | 'assertion_reason' | 'scenario_based';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  reason?: string;
  scenario?: string;
  matchLeft?: string[];
  matchRight?: string[];
  correctMatchPairs?: { [key: string]: string };
  explanation?: string;
  sourceCitation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questionsCount: number;
  estimatedTime: string;
  questions: QuizQuestion[];
  easyQuestions: QuizQuestion[];
  mediumQuestions: QuizQuestion[];
  hardQuestions: QuizQuestion[];
  score?: number;
  scores?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  status: 'available' | 'completed';
  contextText?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string; // 'Today' | 'Yesterday' | '2 days ago'
  category: 'ai-insights' | 'system' | 'collaboration';
  read: boolean;
  timestamp: string;
  actionLabel?: string;
  actionPage?: PageId;
}

export interface UserSettings {
  profile: {
    fullName: string;
    emailAddress: string;
    bio: string;
    avatarUrl: string;
    institution: string;
    role: string;
    degree?: string;
    semester?: string;
    subjects?: string[];
    theme?: 'light' | 'dark';
    firstName?: string;
    lastName?: string;
    countryCode?: string;
    phoneNumber?: string;
    onboardingCompleted?: boolean;
  };
  subscription: {
    planName: 'Scholar' | 'Researcher' | 'Institution';
    price: string;
    billingCycle: 'monthly' | 'yearly';
    nextBillDate: string;
    features: string[];
  };
  integrations: {
    canvasConnected: boolean;
    blackboardConnected: boolean;
    canvasUrl?: string;
    lastSynced?: string;
  };
  aiLevels: {
    proactiveConceptSuggestion: boolean;
    automatedBibliography: boolean;
    highIntensitySynthesis: boolean;
  };
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface PricingPlan {
  name: string;
  tierLabel: string;
  price: string;
  period: string;
  tagline: string;
  description: string;
  ctaText: string;
  features: string[];
  isPopular: boolean;
  highlighted: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lectureId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface StudioSlide {
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  visualSuggestions: string;
  keyTakeaways: string;
  references: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  type: 'document' | 'media' | 'online' | 'research';
  sourceType: string;
  status: 'processing' | 'indexed' | 'failed' | 'ready';
  content: string;
  url?: string;
  size?: string;
  createdAt: any;
  summary?: string;
  notes?: { title: string; content: string }[];
  flashcards?: { q: string; a: string }[];
  quiz?: { question: string; options: string[]; correctAnswer: number; explanation: string }[];
  keyConcepts?: { id: string; label: string; desc: string; parent?: string; x: number; y: number; group: string }[];
  slides?: StudioSlide[];
  podcastScript?: string;
  cleanTranscript?: string;
  sections?: { id: string; title: string; startTime: string; endTime: string; content: string }[];
  timeline?: { time: string; title: string; description: string }[];
  sourceIntelligence?: { keyPeople: string[]; keyTerms: string[]; formulas: string[]; dates: string[]; statistics: string[]; references: string[] };
}


