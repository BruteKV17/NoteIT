/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Mic, 
  Sparkles, 
  BookOpen, 
  TrendingUp,
  Brain,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  User,
  Github,
  Linkedin,
  Mail,
  HelpCircle,
  ChevronDown,
  Globe,
  Award,
  Zap,
  Key,
  Trophy
} from 'lucide-react';
import AILogo from './AILogo';
import { Button, Card, Badge } from './bauhaus';

interface LandingViewProps {
  onEnterApp: () => void;
  onLoginSuccess: (user: { fullName: string; emailAddress: string }) => void;
  onNavigateToPricing: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingView({
  onEnterApp,
  onLoginSuccess,
  onNavigateToPricing,
  onGetStarted,
  onSignIn
}: LandingViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does NoteIT AI record and transcribe lectures?",
      a: "NoteIT AI uses browser-native WebAudio pipelines combined with custom Whisper and Gemini 2.5 audio processors to capture live spoken lectures or uploaded audio files, generating verbatim transcripts with speaker labels."
    },
    {
      q: "What is Bring Your Own Key (BYOK) mode?",
      a: "BYOK allows scholars to input their personal API keys (Google Gemini, Groq, OpenAI, Anthropic, DeepSeek, OpenRouter, Mistral, xAI, NVIDIA) to run unlimited AI note synthesis and quizzes at 0 extra platform markup."
    },
    {
      q: "Can I export my notes and presentation slides?",
      a: "Yes! All synthesized outlines, flashcard decks, and presentation decks can be exported as structured PDF documents, Markdown files, or raw text directly into Notion or Canvas."
    },
    {
      q: "Is my academic data and recorded audio secure?",
      a: "Absolutely. All audio data processing occurs locally in browser memory or encrypted temp blobs. Your personal study material is private to your authenticated user account."
    }
  ];

  return (
    <div className="bg-[var(--bg-paper)] text-[var(--text-primary)] min-h-screen overflow-x-hidden select-none relative font-sans transition-colors duration-200">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[var(--sidebar-bg)] border-b-2 border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGetStarted}>
          <div className="p-1 rounded-[4px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm">
            <AILogo size={32} theme="light" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg text-[var(--text-primary)] tracking-tight block leading-none">NOTEIT AI</span>
            <span className="font-mono text-[9px] text-[var(--text-secondary)] font-bold tracking-[2px] uppercase">COGNITIVE SCHOLAR</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider">
          <a href="#features" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Features</a>
          <a href="#workflow" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Workflow</a>
          <a href="#team" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Founders</a>
          <a href="#pricing" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Pricing</a>
          <a href="#faq" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="sm"
            onClick={onSignIn}
            className="border-2 border-[var(--border-main)] text-[var(--text-primary)] bg-[var(--card-bg)]"
          >
            Sign In
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onGetStarted}
            className="bg-[#FFC400] text-[#111111] border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066]"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* 2. Hero Presentation Area */}
      <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-grid-paper">
        {/* Left Side Copy */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm rounded-[4px] font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
            <span className="w-2.5 h-2.5 bg-[#FF4D4D] border border-[var(--border-main)]" />
            NEXT-GEN ACADEMIC AI WORKSPACE
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-6xl md:text-7xl text-[var(--text-primary)] tracking-tight leading-none uppercase">
            AI THAT THINKS <br />
            <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 border-2 border-[var(--border-main)] shadow-paper-sm inline-block mt-2">
              WHILE YOU LEARN
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-mono font-medium leading-relaxed max-w-xl border-l-4 border-[#FFC400] pl-3 py-1">
            NoteIT AI captures lectures live, extracts structural text, generates interactive quiz decks, builds weak topic radars, and synthesizes study decks with 9+ multi-LLM providers.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onGetStarted}
              className="bg-[#2F6BFF] text-white hover:bg-[#255cd9] border-2 border-[var(--border-main)] shadow-paper-md"
              icon={<Play className="h-4 w-4 fill-current text-white" />}
            >
              Start Learning for Free
            </Button>
            
            <Button
              variant="tertiary"
              size="lg"
              onClick={onSignIn}
              className="bg-[var(--card-bg)] text-[var(--text-primary)] border-2 border-[var(--border-main)] shadow-paper-md hover:bg-[var(--hover-bg)]"
              icon={<BookOpen className="h-4 w-4 text-[var(--text-primary)]" />}
            >
              Access Workspace
            </Button>
          </div>
        </div>

        {/* Right Side Live AI Node Callout Card */}
        <div className="lg:col-span-5 relative w-full flex justify-center">
          <Card shadow="lg" className="w-full max-w-[400px] p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
              <span className="font-mono text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#19B56B] border border-[var(--border-main)] animate-pulse" />
                ACTIVE COGNITIVE NODE
              </span>
              <Badge variant="yellow" size="sm">ONLINE</Badge>
            </div>

            <div className="p-3 bg-[var(--panel-bg)] rounded-[4px] border-2 border-[var(--border-main)] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-[var(--text-primary)]">
                <span>CONCEPT SYNTHESIS:</span>
                <span className="text-[#34D399]">OPTIMAL</span>
              </div>
              <div className="w-full bg-[var(--card-bg)] h-3.5 rounded-[3px] border-2 border-[var(--border-main)] overflow-hidden p-0.5">
                <div className="h-full bg-[#FFC400] w-[88%] rounded-[2px]" />
              </div>
            </div>

            <div className="space-y-2 pt-1 font-mono text-xs text-[var(--text-primary)]">
              <div className="p-2.5 rounded-[4px] bg-[var(--panel-bg)] border border-[var(--border-main)] shadow-paper-sm flex justify-between items-center">
                <span>🎙️ Speech Transcription</span>
                <span className="font-bold text-[#38BDF8]">99.4% Accuracy</span>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[var(--panel-bg)] border border-[var(--border-main)] shadow-paper-sm flex justify-between items-center">
                <span>⚡ Multi-LLM Provider</span>
                <span className="font-bold text-[#34D399]">Gemini 2.5 Flash</span>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[var(--panel-bg)] border border-[var(--border-main)] shadow-paper-sm flex justify-between items-center">
                <span>🧠 Weak Topic Radar</span>
                <span className="font-bold text-[#FF5353]">Calculus & Backprop</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="border-t-2 border-[var(--border-main)] bg-[var(--card-bg)] py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="yellow" size="md">ENGINEERED FOR SCHOLARS</Badge>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl uppercase text-[var(--text-primary)] tracking-tight">
              PRECISION KNOWLEDGE TOOLS
            </h2>
            <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)]">
              A complete cognitive stack designed to streamline high-level academic research and study retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[6px] bg-[#38BDF8]/20 border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#38BDF8]">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  LIVE LECTURE CAPTURE
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Real-time audio recording with live waveform display, multi-speaker segmentation, and instant verbatim transcript generation.
                </p>
              </div>
            </Card>

            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[6px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#111111]">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  KNOWLEDGE STUDIO
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  NotebookLM-inspired multi-document synthesis. Upload PDFs, PPTs, or audio recordings to generate structured outlines and flashcard decks.
                </p>
              </div>
            </Card>

            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[6px] bg-[#FF5353]/20 border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#FF5353]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  WEAK TOPIC RADAR
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Automated diagnosis of knowledge gaps based on interactive quiz performance, offering customized remediation study steps.
                </p>
              </div>
            </Card>

            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[6px] bg-[#34D399]/20 border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#34D399]">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  BYOK MULTI-LLM ARCHITECTURE
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Connect personal keys for 9+ providers including Gemini 2.5, Groq, OpenAI, Anthropic, DeepSeek, and OpenRouter.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW STEP-BY-STEP */}
      <section id="workflow" className="border-t-2 border-[var(--border-main)] bg-[var(--bg-paper)] py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl uppercase text-[var(--text-primary)]">
              HOW NOTEIT AI WORKS
            </h2>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              From raw acoustic soundwaves to structured academic mastery in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'CAPTURE', desc: 'Record live lectures or upload audio, PDF, and text study materials.' },
              { num: '02', title: 'INDEX', desc: 'Semantic OCR and acoustic speech indexing extract key definitions.' },
              { num: '03', title: 'SYNTHESIZE', desc: 'Generate multi-level outlines, flashcards, mind maps, and quiz decks.' },
              { num: '04', title: 'MASTER', desc: 'Review weak topics, practice interactive quizzes, and export presentation decks.' }
            ].map((step, i) => (
              <Card key={i} shadow="sm" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-3">
                <span className="font-mono text-2xl font-extrabold bg-[#FFC400] text-[#111111] px-2 py-0.5 border border-[var(--border-main)] inline-block shadow-paper-sm">
                  {step.num}
                </span>
                <h4 className="font-heading font-bold text-base uppercase text-[var(--text-primary)]">{step.title}</h4>
                <p className="text-xs font-mono text-[var(--text-secondary)]">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5. REWARDS PROMOTION SECTION (Requirements 12 & 13) */}
      <section id="rewards-promo" className="border-t-2 border-[var(--border-main)] bg-[var(--card-bg)] py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="yellow" size="md" icon={<Trophy className="h-3.5 w-3.5" />}>
              GAMIFIED ACADEMIC MASTERY
            </Badge>

            <h2 className="font-heading font-extrabold text-3xl md:text-5xl uppercase text-[var(--text-primary)] tracking-tight">
              LEARN. EARN. UNLOCK.
            </h2>

            <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)] max-w-2xl mx-auto">
              Your learning activity now has XP. Capture lectures, build knowledge, complete learning activities and level up.
            </p>
          </div>

          {/* Progression Visual */}
          <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] max-w-3xl mx-auto shadow-paper-sm">
            <div className="flex flex-wrap items-center justify-around gap-2 font-mono text-xs font-extrabold uppercase text-[var(--text-primary)]">
              <span className="bg-[var(--card-bg)] px-3 py-1.5 rounded-[4px] border border-[var(--border-main)] shadow-paper-sm">LEARN</span>
              <span className="text-[#FFC400]">→</span>
              <span className="bg-[#FFC400] text-[#111111] px-3 py-1.5 rounded-[4px] border border-[var(--border-main)] shadow-paper-sm">EARN XP</span>
              <span className="text-[#FFC400]">→</span>
              <span className="bg-[var(--card-bg)] px-3 py-1.5 rounded-[4px] border border-[var(--border-main)] shadow-paper-sm">LEVEL UP</span>
              <span className="text-[#FFC400]">→</span>
              <span className="bg-[#2F6BFF] text-white px-3 py-1.5 rounded-[4px] border border-[var(--border-main)] shadow-paper-sm">UNLOCK REWARDS</span>
            </div>
          </div>

          {/* Small Reward Preview Cards (Requirement 13) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { provider: 'AMAZON', title: '₹500 VOUCHER', xp: '8,000 XP', color: '#FF9900' },
              { provider: 'CROMA', title: '₹500 VOUCHER', xp: '8,050 XP', color: '#00E5D1' },
              { provider: 'AMAZON PRIME', title: 'SUBSCRIPTION', xp: '15,000 XP', color: '#00A8E1' },
              { provider: 'CLAUDE AI', title: 'SUBSCRIPTION', xp: '20,000 XP', color: '#D97757' },
              { provider: 'CANVA PRO', title: 'SUBSCRIPTION', xp: '20,000 XP', color: '#00C4CC' }
            ].map((card, idx) => (
              <Card 
                key={idx} 
                shadow="sm" 
                className="p-4 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] flex flex-col justify-between space-y-2 text-center hover:-translate-y-1 transition-transform"
              >
                <div className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-[3px] border border-[var(--border-main)] bg-[var(--card-bg)]" style={{ color: card.color }}>
                  {card.provider}
                </div>
                <div className="font-heading font-extrabold text-xs text-[var(--text-primary)] uppercase">
                  {card.title}
                </div>
                <div className="font-mono text-xs font-bold text-[#FFC400] bg-[var(--card-bg)] py-1 rounded-[3px] border border-[var(--border-main)]">
                  {card.xp}
                </div>
              </Card>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={onGetStarted}
              className="bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-md uppercase px-8"
              icon={<Trophy className="h-4 w-4" />}
            >
              EXPLORE REWARDS →
            </Button>
          </div>
        </div>
      </section>

      {/* 5. FOUNDER & TEAM DETAILS */}
      <section id="team" className="border-t-2 border-[var(--border-main)] bg-[var(--card-bg)] py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="yellow" size="md">THE VISIONARIES</Badge>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl uppercase text-[var(--text-primary)] tracking-tight">
              MEET THE FOUNDERS
            </h2>
            <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)]">
              Engineered by passionate researchers and software architects dedicated to transforming how the world learns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Founder 1 */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 text-center flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#FFC400] border-2 border-[var(--border-main)] mx-auto shadow-paper-sm flex items-center justify-center text-[#111111] font-heading font-extrabold text-2xl">
                  KV
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)]">KISHAN VERMA</h3>
                  <p className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider">FOUNDER & LEAD ARCHITECT</p>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                  Spearheaded the core cognitive architecture, speech-to-text pipeline, and multi-LLM orchestration for NoteIT AI Labs.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Github className="h-4 w-4" /></a>
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Linkedin className="h-4 w-4" /></a>
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Mail className="h-4 w-4" /></a>
              </div>
            </Card>

            {/* Founder 2: Sadhna Batra */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 text-center flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#38BDF8] text-[#111111] border-2 border-[var(--border-main)] mx-auto shadow-paper-sm flex items-center justify-center font-heading font-extrabold text-2xl">
                  SB
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)]">SADHNA BATRA</h3>
                  <p className="text-[10px] font-mono font-bold text-[#FFC400] uppercase tracking-wider">CO-FOUNDER & PRODUCT STRATEGY</p>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                  Driving product strategy, user experience design, and pedagogical alignment to ensure NoteIT AI delivers maximum academic value.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Linkedin className="h-4 w-4" /></a>
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Mail className="h-4 w-4" /></a>
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Award className="h-4 w-4" /></a>
              </div>
            </Card>

            {/* Team Pillar 3 */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 text-center flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#19B56B] text-white border-2 border-[var(--border-main)] mx-auto shadow-paper-sm flex items-center justify-center font-heading font-extrabold text-2xl">
                  BA
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg uppercase text-[var(--text-primary)]">BRUTE AI LABS</h3>
                  <p className="text-[10px] font-mono font-bold text-[#34D399] uppercase tracking-wider">RESEARCH & COGNITION ENGINE</p>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                  Developing proprietary semantic indexing algorithms and presentation slide synthesis engines for higher education.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><Globe className="h-4 w-4" /></a>
                <a href="#" className="p-2 rounded-[4px] bg-[var(--card-bg)] border border-[var(--border-main)] text-[var(--text-primary)] hover:bg-[#FFC400] hover:text-[#111111] transition-colors"><ShieldCheck className="h-4 w-4" /></a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION ON LANDING PAGE */}
      <section id="pricing" className="border-t-2 border-[var(--border-main)] bg-[var(--bg-paper)] py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="yellow" size="md">TRANSPARENT PRICING</Badge>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl uppercase text-[var(--text-primary)] tracking-tight">
              SELECT YOUR PLAN
            </h2>
            <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)]">
              Start free with your own API keys, or upgrade for managed AI infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* BYOK FREE PLAN */}
            <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="yellow" size="sm">FREE FOREVER</Badge>
                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">BYOK PLAN</h3>
                  <div className="text-3xl font-heading font-extrabold text-[var(--text-primary)] mt-1">₹0 <span className="text-xs font-mono text-[var(--text-secondary)]">/ month</span></div>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)]">Bring Your Own Key for 9+ AI providers with zero platform fee.</p>
                <div className="space-y-2 font-mono text-xs text-[var(--text-primary)] border-t-2 border-[var(--border-main)] pt-3">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#34D399]" /><span>Unlimited Live Audio Recording</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#34D399]" /><span>Connect Gemini, Groq, OpenAI, Anthropic</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#34D399]" /><span>Academic Library & Quiz Engine</span></div>
                </div>
              </div>
              <Button variant="tertiary" size="md" onClick={onGetStarted} className="w-full justify-center border-2 border-[var(--border-main)] text-[var(--text-primary)]">
                Get Started Free
              </Button>
            </Card>

            {/* FEATURED SCHOLAR PRO PLAN */}
            <Card shadow="lg" className="p-6 bg-[var(--card-bg)] border-2 border-[#FFC400] space-y-6 flex flex-col justify-between relative shadow-paper-yellow">
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded-[4px] bg-[#FFC400] text-[#111111] font-mono text-[10px] font-extrabold uppercase border border-[#FFC400] inline-block shadow-paper-sm">
                  RECOMMENDED SCHOLAR
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">SCHOLAR PRO</h3>
                  <div className="text-3xl font-heading font-extrabold text-[var(--text-primary)] mt-1">₹399 <span className="text-xs font-mono text-[var(--text-secondary)]">/ month</span></div>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] font-bold">Managed AI infrastructure with high-speed API quota included.</p>
                <div className="space-y-2 font-mono text-xs text-[var(--text-primary)] border-t-2 border-[var(--border-main)] pt-3">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">Managed AI Run Quota (No API keys needed)</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">100 GB Cloud Storage</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">Weak Topic Radar & AI Presentations</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">Priority Support</span></div>
                </div>
              </div>
              <Button variant="secondary" size="md" onClick={onGetStarted} className="w-full justify-center bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm">
                Upgrade to Scholar Pro →
              </Button>
            </Card>

            {/* INSTITUTION PLAN - LOCKED */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-6 flex flex-col justify-between opacity-80 border-dashed">
              <div className="space-y-4">
                <Badge variant="blue" size="sm">🔒 UNDER DEVELOPMENT</Badge>
                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">INSTITUTION</h3>
                  <div className="text-2xl font-heading font-extrabold text-[var(--text-secondary)] mt-1">UNDER WORK</div>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)]">Multi-user seat licenses and campus LMS sync under active engineering.</p>
                <div className="space-y-2 font-mono text-xs text-[var(--text-secondary)] border-t-2 border-[var(--border-main)] pt-3">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--text-secondary)]" /><span>Canvas & Blackboard LMS Sync (In Progress)</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--text-secondary)]" /><span>Department-wide Knowledge Base</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--text-secondary)]" /><span>Dedicated Account Manager</span></div>
                </div>
              </div>
              <button disabled className="w-full py-3 px-4 font-mono text-xs font-bold uppercase rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] text-[var(--text-secondary)] cursor-not-allowed">
                🔒 UNDER DEVELOPMENT
              </button>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION SECTION */}
      <section id="faq" className="border-t-2 border-[var(--border-main)] bg-[var(--card-bg)] py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl uppercase text-[var(--text-primary)]">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-xs font-mono text-[var(--text-secondary)]">Everything you need to know about NoteIT AI.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card 
                key={i} 
                shadow="sm" 
                className="p-5 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] cursor-pointer transition-all hover:bg-[var(--hover-bg)]"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-heading font-bold text-base text-[var(--text-primary)] uppercase">{faq.q}</h4>
                  <ChevronDown className={`h-5 w-5 text-[var(--text-primary)] transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </div>
                {activeFaq === i && (
                  <p className="text-xs font-mono text-[var(--text-secondary)] pt-3 border-t border-[var(--border-main)] mt-3 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SOLID BAUHAUS FOOTER */}
      <footer className="bg-[var(--sidebar-bg)] text-[var(--text-primary)] border-t-2 border-[var(--border-main)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-[4px] bg-[#FFC400] text-[#111111]">
              <AILogo size={24} theme="light" />
            </div>
            <p className="text-[var(--text-secondary)]">
              © 2026 NoteIT Scholar AI. Precision in knowledge synthesis.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 font-bold uppercase tracking-wider text-[var(--text-primary)]">
            <a href="#features" className="hover:text-[#FFC400] transition-colors">FEATURES</a>
            <a href="#workflow" className="hover:text-[#FFC400] transition-colors">WORKFLOW</a>
            <a href="#team" className="hover:text-[#FFC400] transition-colors">FOUNDERS</a>
            <a href="#pricing" className="hover:text-[#FFC400] transition-colors">PRICING</a>
            <a href="#faq" className="hover:text-[#FFC400] transition-colors">FAQ</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
