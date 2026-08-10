/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Source, Lecture, WeakTopic, Quiz, NotificationItem, UserSettings, FAQItem, PricingPlan } from './types';

export const INITIAL_SOURCES: Source[] = [];

export const INITIAL_LECTURES: Lecture[] = [];

export const INITIAL_WEAK_TOPICS: WeakTopic[] = [];

export const INITIAL_QUIZZES: Quiz[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_SETTINGS: UserSettings = {
  profile: {
    fullName: 'Academic Scholar',
    emailAddress: '',
    bio: 'Academic researcher utilizing cognitive AI synthesis.',
    avatarUrl: '',
    institution: '',
    role: 'Scholar'
  },
  subscription: {
    planName: 'BYOK',
    price: '₹0',
    billingCycle: 'monthly',
    nextBillDate: 'Dec 15, 2026',
    features: [
      'Bring Your Own Key (BYOK)',
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Academic Library & Quiz Workspace'
    ]
  },
  integrations: {
    canvasConnected: false,
    blackboardConnected: false,
    canvasUrl: '',
    lastSynced: 'Never'
  },
  aiLevels: {
    proactiveConceptSuggestion: true,
    automatedBibliography: true,
    highIntensitySynthesis: false
  }
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq1',
    question: 'How secure is my academic data and research outputs?',
    answer: 'We run isolated storage sandboxes. Your documents, transcripts, and session outputs are encrypted in transit and at rest using AES-256. We strictly enforce a proprietary policy: your uploaded papers and personal annotations are NEVER passed into public models for training.'
  },
  {
    id: 'faq2',
    question: 'Can I export my synthesized materials to standard formats like LaTeX or Markdown?',
    answer: 'Absolutely. Every note, summary, research outline, or flashcard deck you generate inside Note-IT AI is exportable. You can click "Export" on the workspace headers and select LaTeX (.tex) for mathematical typesetting or clean GitHub-flavored Markdown (.md).'
  },
  {
    id: 'faq3',
    question: 'Does Note-IT AI cite and match statements back to my exact source material?',
    answer: 'Yes! That is one of our fundamental design objectives. When you read an AI Summary or work through the Research Hub, any claims or synthesized bullet points generate clickable citation numbers. Clicking a number scrolls your file preview directly to the matching paragraph block or specific timestamp inside raw transcribing logs.'
  },
  {
    id: 'faq4',
    question: 'How does the "Weak Topic Tracking" radar work?',
    answer: 'Note-IT AI aggregates telemetry from your generated quizzes, lecture reviews, and recall sessions. It uses custom semantic mapping to trace concepts back to centralized fields, analyzes error rates, and identifies cognitive gaps, helping you schedule optimal review plans.'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'BYOK',
    tierLabel: 'TIER 01',
    price: '₹0',
    period: 'forever',
    tagline: 'Bring your own API key for unlimited analysis.',
    description: 'Use your own Gemini or OpenAI API keys directly.',
    ctaText: 'Get Started',
    features: [
      'Bring Your Own Key (BYOK)',
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Academic Library & Quiz Workspace'
    ],
    isPopular: false,
    highlighted: false
  },
  {
    name: 'Premium',
    tierLabel: 'TIER 02',
    price: '₹399',
    period: 'month',
    tagline: 'No API key needed. Managed high-speed academic AI model access.',
    description: 'We provide high-speed, managed Gemini API keys.',
    ctaText: 'Upgrade to Scholar Pro',
    features: [
      'Direct API access (We provide keys)',
      'Unlimited managed AI runs',
      '100 GB High-Speed Storage',
      'Instant OCR & Math Formula Parsing',
      'Weak Topic Tracker Radar',
      'Priority Email & Chat Support'
    ],
    isPopular: true,
    highlighted: true
  },
  {
    name: 'Institution',
    tierLabel: 'TIER 03',
    price: 'Locked',
    period: 'under work',
    tagline: 'Team collaboration & campus LMS sync under active development.',
    description: 'Institution campus features are currently under development.',
    ctaText: '🔒 Under Development',
    features: [
      'Canvas & Blackboard LMS Integration (In Progress)',
      'Department-wide Shared Workspaces',
      'SSO & SAML Security Auditing',
      'Custom LLM Fine-Tuning'
    ],
    isPopular: false,
    highlighted: false
  }
];
