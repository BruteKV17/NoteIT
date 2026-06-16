/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Source, Lecture, WeakTopic, Quiz, NotificationItem, UserSettings, FAQItem, PricingPlan } from './types';

export const INITIAL_SOURCES: Source[] = [
  { id: '1', name: 'Lecture_BioGenetics_04.pdf', type: 'pdf', size: '4.2 MB', addedAt: '2 hours ago', wordCount: 3452 },
  { id: '2', name: 'Quantum_Entanglement_Theory.txt', type: 'text', size: '15 KB', addedAt: 'Yesterday', wordCount: 1200 },
  { id: '3', name: 'Economic_Models_Midterm_Review.pdf', type: 'pdf', size: '1.8 MB', addedAt: '3 days ago', wordCount: 2200 },
  { id: '4', name: 'Ethics_in_AI_Symposium_Record.wav', type: 'recording', size: '24.5 MB', addedAt: 'Oct 15, 2023', wordCount: 4500 }
];

export const INITIAL_LECTURES: Lecture[] = [
  { id: 'l1', title: 'Advanced Quantum Mechanics - L04', subject: 'Physics', duration: '42 mins', addedAt: '2 hours ago', status: 'transcribing', type: 'recording' },
  { id: 'l2', title: 'European Economic History 1945-2000', subject: 'Economics', pages: 12, addedAt: '5 hours ago', status: 'generated', type: 'pdf' },
  { id: 'l3', title: 'Neural Net Architectures & Optimization', subject: 'Computer Science', pages: 18, addedAt: 'Oct 18, 2023', status: 'generated', type: 'pdf' },
  { id: 'l4', title: 'Ethics in AI: Contemporary Symposium', subject: 'Philosophy', duration: '14 mins', addedAt: 'Oct 15, 2023', status: 'generated', type: 'recording' }
];

export const INITIAL_WEAK_TOPICS: WeakTopic[] = [
  {
    id: 'wt1',
    topicName: 'Calculus III: Triple Integrals',
    subject: 'Mathematics',
    masteryScore: 34,
    lastAttempt: 'Oct 24, 2023',
    aiDiagnosis: 'Difficulty identifying symmetry elements in 3D structures and choosing optimal coordinate systems.',
    actionPlan: [
      'Practice boundary mapping with spherical coordinate sheets.',
      'Solve Triple Integrals mock exercise 1-12.',
      'Consult AI Workspace on Jacobian transformation mechanics.'
    ]
  },
  {
    id: 'wt2',
    topicName: 'Organic Chemistry: Chirality',
    subject: 'Chemistry',
    masteryScore: 41,
    lastAttempt: 'Oct 22, 2023',
    aiDiagnosis: 'Persistent confusion between R/S configurations in complex multi-center Fischer projections.',
    actionPlan: [
      'Generate a focused interactive quiz on multi-center stereoisomers.',
      'Interactive 3D model visualizer consult on priority rules.',
      'Do custom flashcard run of 20 practice compounds.'
    ]
  },
  {
    id: 'wt3',
    topicName: 'Neural Networks: Backprop Algorithm',
    subject: 'Computer Science',
    masteryScore: 28,
    lastAttempt: 'Oct 28, 2023',
    aiDiagnosis: 'Mathematical derivation of chain rule in matrix form is incorrectly applied in recent synthesis notes.',
    actionPlan: [
      'Deconstruct the gradient descent updates for hidden layers manually.',
      'Re-watch neural lecture snippets between timestamp 14:02 - 18:45.',
      'Simplify Backpropagation concepts using simplified visual matrix shapes.'
    ]
  },
  {
    id: 'wt4',
    topicName: 'Quantum Mechanics: Wavefunctions',
    subject: 'Physics',
    masteryScore: 55,
    lastAttempt: 'Oct 15, 2023',
    aiDiagnosis: 'Incomplete normalization factors in critical boundary state calculations.',
    actionPlan: [
      'Revise infinite square well wavefunction properties.',
      'Review Hermitian operators and eigen value mappings.'
    ]
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'Neural Plasticity & Cognitive Recovery',
    topic: 'Neurobiology',
    questionsCount: 5,
    estimatedTime: '5 mins',
    status: 'available',
    questions: [
      {
        id: 'q1_1',
        question: 'Which of the following describes synaptic pruning?',
        options: [
          'A process in which unused synapses/connections are custom destroyed to increase network efficiency.',
          'The constant creation of brand new neurons in the central hippocampus.',
          'An abnormal clinical condition causing myelin sheath degradation.',
          'The integration of Google digital tools with human memory structures.'
        ],
        correctAnswerIndex: 0
      },
      {
        id: 'q1_2',
        question: 'What is neurogenesis and where does it occur prominently in adults?',
        options: [
          'The formation of astrocytes occurring inside the cerebellum.',
          'Generation of new active neurons occurring in the hippocampal subgranular zone.',
          'The synthesis of synaptic proteins inside myelinated nodes.',
          'Degeneration of old neural pathways within visual cortex layers.'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'q1_3',
        question: 'Which neurotransmitter plays the most central role in Long-Term Potentiation (LTP)?',
        options: [
          'Dopamine',
          'Serotonin',
          'Glutamate via NMDA receptors',
          'Acetylcholine'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'q1_4',
        question: 'What is meant by the concept "Hebbian Learning" within cognitive recovery?',
        options: [
          'Cells that fire together, wire together.',
          'The gradual death of idle neurons during aging cycles.',
          'Feedback propagation in modern digital neural nets.',
          'Artificial memory retrieval systems powered by Workspace'
        ],
        correctAnswerIndex: 0
      },
      {
        id: 'q1_5',
        question: 'Which factor is most potent at stimulating neuroplasticity according to latest research?',
        options: [
          'Passive screen consumption',
          'Active retrieval practice and focused cognitive effort',
          'Long intervals of isolation',
          'Unstructured sleep patterns'
        ],
        correctAnswerIndex: 1
      }
    ]
  },
  {
    id: 'q2',
    title: 'Chirality & Fischer Projections Review',
    topic: 'Organic Chemistry',
    questionsCount: 3,
    estimatedTime: '3 mins',
    status: 'available',
    questions: [
      {
        id: 'q2_1',
        question: 'What is the absolute configuration of a carbon center where priority groups 1 -> 2 -> 3 run clockwise with Hydrogen in the vertical position?',
        options: [
          'R configuration',
          'S configuration',
          'D configuration',
          'L configuration'
        ],
        correctAnswerIndex: 0
      },
      {
        id: 'q2_2',
        question: 'How are enantiomers distinguished physically?',
        options: [
          'They have entirely distinct boiling points and solubility ranges.',
          'They rotate plane-polarized light in opposite directions.',
          'They differ sharply in molecular mass measurements.',
          'They exhibit distinct atomic counts.'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'q2_3',
        question: 'A meso compound lacks which of the following characteristics?',
        options: [
          'Chiral centers',
          'Internal plane of symmetry',
          'Optical activity (meso compounds are optically inactive)',
          'Identical atoms'
        ],
        correctAnswerIndex: 2
      }
    ]
  },
  {
    id: 'q3',
    title: 'Calculus III: Triple Integrals',
    topic: 'Mathematics',
    questionsCount: 3,
    estimatedTime: '4 mins',
    status: 'available',
    questions: [
      {
        id: 'q3_1',
        question: 'What is the volume element dV in spherical coordinates?',
        options: [
          'dx dy dz',
          'r dr dθ dz',
          'ρ² sin(φ) dρ dθ dφ',
          'ρ sin(φ) dρ dθ dφ'
        ],
        correctAnswerIndex: 2
      },
      {
        id: 'q3_2',
        question: 'When is it highly advantageous to convert a triple integral into cylindrical coordinates?',
        options: [
          'When the integration domain has circular symmetry about the z-axis.',
          'When integrating over a perfect sphere centered at the origin.',
          'When the boundaries are random asymmetric planes.',
          'For flat rectilinear cubes only.'
        ],
        correctAnswerIndex: 0
      },
      {
        id: 'q3_3',
        question: 'What is the Jacobian for standard converting from Cartesian (x, y, z) to cylindrical (r, θ, z)?',
        options: [
          '1',
          'r',
          'r²',
          'ρ² sin(φ)'
        ],
        correctAnswerIndex: 1
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Quantum Mechanics synthesis complete',
    description: 'Our AI has mapped the core principles of Wave-Particle Duality and Entanglement from your recent lecture notes.',
    timeLabel: 'Today',
    category: 'ai-insights',
    read: false,
    timestamp: '2 hours ago',
    actionLabel: 'View Summary',
    actionPage: 'research-hub'
  },
  {
    id: 'n2',
    title: 'New Quiz generated: Calculus III',
    description: 'Strengthen your understanding of Triple Integrals. We identified this as a weak area based on your previous sessions.',
    timeLabel: 'Today',
    category: 'ai-insights',
    read: false,
    timestamp: '5 hours ago',
    actionLabel: 'Start Quiz',
    actionPage: 'quiz-mode'
  },
  {
    id: 'n3',
    title: 'Weekly mastery report available',
    description: 'Your knowledge retention has increased by 12% this week. View the full breakdown of mastered concepts.',
    timeLabel: 'Yesterday',
    category: 'system',
    read: true,
    timestamp: '1 day ago',
    actionLabel: 'View Report',
    actionPage: 'dashboard'
  },
  {
    id: 'n4',
    title: 'Collaborator joined: Dr. Aris Thorne',
    description: 'Dr. Thorne has accepted your invitation to the "Astrophysics Research" workspace.',
    timeLabel: 'Yesterday',
    category: 'collaboration',
    read: true,
    timestamp: '1 day ago'
  },
  {
    id: 'n5',
    title: 'Subscription renewed successfully',
    description: 'Your Note-IT AI Researcher plan has been renewed. Thank you for continuing your research journey with us.',
    timeLabel: '2 days ago',
    category: 'system',
    read: true,
    timestamp: '2 days ago'
  }
];

export const INITIAL_SETTINGS: UserSettings = {
  profile: {
    fullName: 'Julian Sterling',
    emailAddress: 'j.sterling@university.edu',
    bio: 'Synthesizing modern economic theories with historical data patterns. Focused on AI-assisted academic literature reviews.',
    avatarUrl: '',
    institution: 'Cambridge University',
    role: 'Senior Researcher'
  },
  subscription: {
    planName: 'Researcher',
    price: '$12',
    billingCycle: 'monthly',
    nextBillDate: 'Dec 15, 2026',
    features: [
      'Unlimited AI Synthesis',
      'Advanced PDF OCR Engine',
      'Instant Weak Topic Radar',
      'Persistent AI Knowledge Graphs'
    ]
  },
  integrations: {
    canvasConnected: true,
    blackboardConnected: false,
    canvasUrl: 'camb-uni.instructure.com',
    lastSynced: '2 hours ago'
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
    answer: 'Note-IT AI aggregates telemetry from your generated quizzes, lecture reviews, and recall sessions. It uses custom semantic mapping to trace concepts back to centralized fields (like Linear Algebra or Neurobiology), analyzes error rates, and identifies cognitive gaps, helping you schedule optimal review plans.'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Scholar',
    tierLabel: 'TIER 01',
    price: '$0',
    period: 'forever',
    tagline: 'Ideal for independent students beginning their academic reviews.',
    description: 'Essential research layout for individual review sessions.',
    ctaText: 'Get Started',
    features: [
      'Standard AI Synthesis (5 / mo)',
      '5 GB Encrypted Cloud Storage',
      'Familiar multi-source research hub',
      'Standard PDF Document Reader'
    ],
    isPopular: false,
    highlighted: false
  },
  {
    name: 'Researcher',
    tierLabel: 'TIER 02',
    price: '$12',
    period: 'month',
    tagline: 'The full power of cognitive AI models for serious researchers.',
    description: 'Our most sought-after plan for university and lab-scale work.',
    ctaText: 'Upgrade to Researcher',
    features: [
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Instant OCR & Math Formula Parsing',
      'Weak Topic Tracker Radar',
      'Proactive Concept Recommendations',
      'Priority Email Support'
    ],
    isPopular: true,
    highlighted: true
  },
  {
    name: 'Institution',
    tierLabel: 'TIER 03',
    price: 'Custom',
    period: 'enterprise',
    tagline: 'Team collaboration, SSO, and advanced academic model fine-tuning.',
    description: 'Engineered safely for full-scale universities, laboratories, or hospitals.',
    ctaText: 'Contact Sales',
    features: [
      'Everything in Researcher plus:',
      'SSO & SAML Security Auditing',
      'Dedicated Academic Success Manager',
      'Unlimited Shared Workspaces',
      'Custom LLM Fine-Tuning options'
    ],
    isPopular: false,
    highlighted: false
  }
];
