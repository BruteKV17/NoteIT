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
  | 'rewards'
  | 'auth';

export interface RewardItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  xpCost: number;
  image: string;
  status: 'available' | 'locked' | 'coming_soon' | 'out_of_stock' | 'active';
  category?: 'voucher' | 'subscription' | 'ai' | 'tool';
  valueLabel?: string;
}

export interface UserRewardsState {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  lifetimeXp: number;
  redeemedRewards: string[];
}


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

export type RecordingStatus = 'recording' | 'uploaded' | 'failed';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ResourceGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ResourceGenerationError {
  code?: string;
  message?: string;
  provider?: string;
  timestamp?: any;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  duration?: string;
  pages?: number;
  addedAt: string;
  status: 'recording' | 'uploading' | 'uploaded' | 'transcribing' | 'generating_notes' | 'generated' | 'failed' | 'extracting' | 'analyzing' | 'completed';
  recordingStatus?: RecordingStatus;
  transcriptionStatus?: TranscriptionStatus;
  resourceGenerationStatus?: ResourceGenerationStatus;
  resourceGenerationError?: ResourceGenerationError | null;
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
  summaries?: { [key: string]: string };
  notes?: any;
  flashcards?: { q: string; a: string; category?: 'Basic Recall' | 'Concept Understanding' | 'Application Based' }[];
  quiz?: { question: string; options: string[]; correctAnswer: number; explanation: string; difficulty?: 'easy' | 'medium' | 'hard' | 'scenario' | 'application'; sourceCitation?: string }[];
  keyConcepts?: { id: string; label: string; desc: string; parent?: string; x: number; y: number; group: string; examples?: string; formula?: string; applications?: string }[];
  weakTopics?: WeakTopic[];
  cleanTranscript?: string;
  sections?: { id: string; title: string; startTime: string; endTime: string; content: string }[];
  timeline?: { time: string; title: string; description: string }[];
  sourceIntelligence?: { keyPeople: string[]; keyTerms: string[]; formulas: string[]; dates: string[]; statistics: string[]; references: string[] };
  presentationBlueprint?: {
    theme: string;
    purpose: string;
    regenerationLevel: 'quick' | 'balanced' | 'premium';
    qualityScore: number;
    slideCount: number;
    blueprint: any[];
  };
  lastGenerationProvider?: string;
  lastGenerationModel?: string;
  lastGeneratedAt?: any;
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
    planName: 'BYOK' | 'Premium' | 'Institution';
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
  presentationBlueprint?: {
    theme: string;
    purpose: string;
    regenerationLevel: 'quick' | 'balanced' | 'premium';
    qualityScore: number;
    slideCount: number;
    blueprint: any[];
  };
}

export interface SlideBlueprint {
  slideType: 'title' | 'hero' | 'timeline' | 'process' | 'comparison' | 'architecture' | 'hierarchy' | 'metrics' | 'quote' | 'case_study' | 'diagram' | 'mindmap' | 'conclusion';
  title: string;
  objective: string;
  keyPoints: string[];
  imageQuery: string;
  imageUrl?: string;
  layoutPriority: number;
  visualImportance: string;
  wordLimit: number;
  designNotes: string;
}


