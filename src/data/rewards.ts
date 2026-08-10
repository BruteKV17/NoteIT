/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RewardItem, UserRewardsState } from '../types';

// High-resolution crisp SVG Data URIs matching exact uploaded brand logos (fully visible, centered)
export const REWARD_BRAND_IMAGES: Record<string, string> = {
  amazon: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#FFFFFF"/>
      <!-- Official Amazon Logo (Image 1) -->
      <g transform="translate(45, 85)">
        <text x="0" y="55" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="76" fill="#232F3E" letter-spacing="-4px">amazon</text>
        <path d="M 42 72 Q 155 118 268 64" fill="none" stroke="#FF9900" stroke-width="11" stroke-linecap="round"/>
        <path d="M 252 54 L 278 65 L 260 86 Z" fill="#FF9900"/>
      </g>
    </svg>
  `)}`,

  croma: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#FFFFFF"/>
      <!-- Official Croma Logo (Image 2) -->
      <g transform="translate(45, 95)">
        <text x="0" y="50" font-family="'Space Grotesk', 'Playfair Display', serif" font-weight="900" font-size="76" fill="#00A79E" letter-spacing="-2px">cromā</text>
        <line x1="250" y1="-12" x2="315" y2="-12" stroke="#00A79E" stroke-width="10" stroke-linecap="round"/>
      </g>
    </svg>
  `)}`,

  claude: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#FFFFFF"/>
      <!-- Official Claude Logo (Image 3) -->
      <g transform="translate(40, 85)">
        <g fill="#D97757">
          <line x1="40" y1="5" x2="40" y2="75" stroke="#D97757" stroke-width="10" stroke-linecap="round"/>
          <line x1="5" y1="40" x2="75" y2="40" stroke="#D97757" stroke-width="10" stroke-linecap="round"/>
          <line x1="15" y1="15" x2="65" y2="65" stroke="#D97757" stroke-width="10" stroke-linecap="round"/>
          <line x1="15" y1="65" x2="65" y2="15" stroke="#D97757" stroke-width="10" stroke-linecap="round"/>
        </g>
        <text x="100" y="62" font-family="'Space Grotesk', 'Georgia', serif" font-weight="800" font-size="72" fill="#1C1917" letter-spacing="-2px">Claude</text>
      </g>
    </svg>
  `)}`,

  amazonPrime: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#00A8E1"/>
      <!-- Official Prime Video Logo (Image 4) -->
      <g transform="translate(45, 85)">
        <text x="0" y="55" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="62" fill="#000000" letter-spacing="-3px">prime video</text>
        <path d="M 90 70 Q 200 106 308 64" fill="none" stroke="#000000" stroke-width="9" stroke-linecap="round"/>
        <path d="M 294 54 L 316 64 L 302 82 Z" fill="#000000"/>
      </g>
    </svg>
  `)}`,

  canva: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <defs>
        <linearGradient id="canvaGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00C4CC"/>
          <stop offset="50%" stop-color="#4B40E0"/>
          <stop offset="100%" stop-color="#7D2AE8"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" rx="12" fill="url(#canvaGradFull)"/>
      <!-- Official Canva Logo (Image 5) -->
      <g transform="translate(55, 75)">
        <text x="0" y="75" font-family="'Brush Script MT', 'Dancing Script', 'Space Grotesk', cursive, sans-serif" font-style="italic" font-weight="800" font-size="94" fill="#FFFFFF" letter-spacing="-1px">Canva</text>
      </g>
    </svg>
  `)}`,

  scribd: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#FFFFFF"/>
      <!-- Official Scribd Logo (Uploaded Image 1) -->
      <g transform="translate(25, 75)">
        <path d="M 50 15 C 22 15 12 38 38 52 C 64 64 54 88 26 88 C 16 88 8 82 4 75" fill="none" stroke="#1F6F74" stroke-width="12" stroke-linecap="round"/>
        <circle cx="50" cy="15" r="7" fill="#1F6F74"/>
        <circle cx="4" cy="75" r="7" fill="#1F6F74"/>
        <text x="85" y="64" font-family="'Space Grotesk', 'Inter', system-ui, sans-serif" font-weight="700" font-size="58" fill="#0B3C3E" letter-spacing="3px">SCRIBD</text>
      </g>
    </svg>
  `)}`,

  gemini: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#FFFFFF"/>
      <!-- Official Google Gemini Logo (Uploaded Image 2) -->
      <g transform="translate(45, 75)">
        <defs>
          <linearGradient id="geminiStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EA4335"/>
            <stop offset="30%" stop-color="#FBBC04"/>
            <stop offset="70%" stop-color="#34A853"/>
            <stop offset="100%" stop-color="#4285F4"/>
          </linearGradient>
        </defs>
        <path d="M 45 0 C 45 25 25 45 0 45 C 25 45 45 65 45 90 C 45 65 65 45 90 45 C 65 45 45 25 45 0 Z" fill="url(#geminiStarGrad)"/>
        <text x="110" y="64" font-family="'Product Sans', 'Inter', system-ui, sans-serif" font-weight="700" font-size="68" fill="#1F1F1F" letter-spacing="-1px">Gemini</text>
      </g>
    </svg>
  `)}`,

  notion: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="400" height="240" rx="12" fill="#FFFFFF"/>
      <!-- Orange Frame matching Uploaded Image 3 -->
      <rect x="10" y="10" width="380" height="220" rx="8" fill="none" stroke="#FF6B00" stroke-width="8"/>
      <!-- Official Notion Cube Logo -->
      <g transform="translate(35, 75)">
        <rect x="5" y="5" width="70" height="70" rx="14" fill="#000000"/>
        <text x="22" y="58" font-family="'Inter', sans-serif" font-weight="900" font-size="52" fill="#FFFFFF">N</text>
        <text x="100" y="62" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="66" fill="#000000" letter-spacing="-2px">Notion</text>
      </g>
    </svg>
  `)}`
};

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'amazon-500',
    name: '₹500 Amazon Gift Card',
    provider: 'Amazon',
    description: 'Digital shopping voucher for books, study electronics, and supplies.',
    xpCost: 2000,
    image: REWARD_BRAND_IMAGES.amazon,
    status: 'active',
    category: 'voucher',
    valueLabel: '₹500'
  },
  {
    id: 'croma-500',
    name: '₹500 Croma Gift Card',
    provider: 'Croma',
    description: 'Digital electronics voucher for tech gadgets, headphones, and accessories.',
    xpCost: 2200,
    image: REWARD_BRAND_IMAGES.croma,
    status: 'active',
    category: 'voucher',
    valueLabel: '₹500'
  },
  {
    id: 'scribd-unlimited',
    name: 'Scribd Unlimited Subscription',
    provider: 'Scribd',
    description: '1-Month membership for unlimited digital books, academic papers, and audiobooks.',
    xpCost: 2500,
    image: REWARD_BRAND_IMAGES.scribd,
    status: 'active',
    category: 'tool',
    valueLabel: '1 Month'
  },
  {
    id: 'gemini-advanced',
    name: 'Google Gemini Advanced Subscription',
    provider: 'Google Gemini',
    description: '1-Month Google One AI Premium membership with Gemini Advanced (Ultra 1.5/2.0).',
    xpCost: 3200,
    image: REWARD_BRAND_IMAGES.gemini,
    status: 'active',
    category: 'ai',
    valueLabel: '1 Month'
  },
  {
    id: 'notion-plus',
    name: 'Notion Plus Subscription',
    provider: 'Notion',
    description: '1-Month Notion Plus subscription for unlimited student workspace storage and AI features.',
    xpCost: 2700,
    image: REWARD_BRAND_IMAGES.notion,
    status: 'active',
    category: 'tool',
    valueLabel: '1 Month'
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime Video Subscription',
    provider: 'Prime Video',
    description: '1-Month membership for fast delivery, movie streaming, and prime reading.',
    xpCost: 2400,
    image: REWARD_BRAND_IMAGES.amazonPrime,
    status: 'active',
    category: 'subscription',
    valueLabel: '1 Month'
  },
  {
    id: 'claude-pro',
    name: 'Claude AI Pro Subscription',
    provider: 'Anthropic Claude',
    description: '1-Month Claude Pro subscription for advanced academic synthesis and reasoning.',
    xpCost: 3000,
    image: REWARD_BRAND_IMAGES.claude,
    status: 'active',
    category: 'ai',
    valueLabel: '1 Month'
  },
  {
    id: 'canva-pro',
    name: 'Canva Pro Subscription',
    provider: 'Canva',
    description: '1-Month Pro access for high-impact academic presentation decks and graphics.',
    xpCost: 2800,
    image: REWARD_BRAND_IMAGES.canva,
    status: 'active',
    category: 'tool',
    valueLabel: '1 Month'
  }
];

export const INITIAL_USER_REWARDS_STATE: UserRewardsState = {
  xp: 0,
  level: 1,
  levelTitle: 'COGNITIVE INITIATE',
  nextLevelXp: 1000,
  lifetimeXp: 0,
  redeemedRewards: []
};

export const XP_EARNING_RULES = [
  { step: '01', activity: 'CAPTURE LIVE LECTURE', xp: '+50 XP', desc: 'Record audio or stream classroom sessions' },
  { step: '02', activity: 'COMPLETE TRANSCRIPTION', xp: '+40 XP', desc: 'Process speech-to-text verbatim transcript' },
  { step: '03', activity: 'GENERATE STUDY NOTES', xp: '+30 XP', desc: 'Synthesize structured markdown outlines' },
  { step: '04', activity: 'COMPLETE QUIZ MODE', xp: '+30 XP', desc: 'Score high accuracy on active recall quizzes' },
  { step: '05', activity: 'REVIEW PINNED NOTES', xp: '+20 XP', desc: 'Revisit saved notes in Research Hub' },
  { step: '06', activity: 'MAINTAIN LEARNING STREAK', xp: '+25 XP', desc: 'Log learning activity 3 consecutive days' },
  { step: '07', activity: 'DAILY LEARNING GOALS', xp: '+50 XP', desc: 'Complete 3 daily cognitive activities' }
];
