/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Volume2, 
  Sparkles, 
  ArrowRight,
  GraduationCap,
  Brain,
  Upload,
  Layers,
  Award,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Cpu,
  Network,
  Users,
  Terminal,
  Clock,
  ArrowBigUpDash
} from 'lucide-react';
import AILogo from './AILogo';

interface LandingViewProps {
  onEnterApp: () => void;
  onLoginSuccess: (user: { fullName: string; emailAddress: string }) => void;
  onNavigateToPricing: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
}

function InteractiveWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2, active: false };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Particle interface for 2D flow stream with virtual depth and streams
    interface Particle {
      x: number;
      offsetY: number;
      noiseOffset: number;
      speed: number;
      size: number;
      z: number;
      streamId: number;
      color: string;
      opacity: number;
    }

    const particleCount = Math.min(250, Math.floor((width * height) / 5500));
    const particles: Particle[] = [];

    const colors = [
      'rgba(95, 109, 248, opacity)', // Indigo
      'rgba(6, 182, 212, opacity)',  // Cyan/Teal
      'rgba(168, 85, 247, opacity)', // Violet
      'rgba(37, 99, 235, opacity)'   // Deep Blue
    ];

    // Ribbon path calculator for 2D streams
    const getStreamPath2D = (streamId: number, px: number, t: number) => {
      if (streamId === 0) {
        return Math.sin(px * 0.0022 + t * 0.7) * (height * 0.14) + Math.cos(px * 0.0008 - t * 0.25) * (height * 0.06) + (height * 0.35);
      } else if (streamId === 1) {
        return Math.sin(px * 0.0016 - t * 0.45) * (height * 0.16) + Math.cos(px * 0.002 + t * 0.5) * (height * 0.08) + (height * 0.65);
      } else if (streamId === 2) {
        return Math.sin(px * 0.0028 + t * 0.95) * (height * 0.12) + (height * 0.5);
      } else {
        return Math.sin(px * 0.0012 + t * 0.2) * (height * 0.2) + Math.cos(px * 0.0006 - t * 0.15) * (height * 0.09) + (height * 0.48);
      }
    };

    for (let i = 0; i < particleCount; i++) {
      const z = 0.5 + Math.random() * 1.5;
      const streamId = i % 4;
      particles.push({
        x: Math.random() * width,
        offsetY: (Math.random() - 0.5) * 15,
        noiseOffset: Math.random() * 100,
        speed: (0.45 + Math.random() * 0.75) * z * (streamId === 2 ? 1.3 : 1.0),
        size: (0.8 + Math.random() * 1.8) * z,
        z: z,
        streamId: streamId,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: (0.22 + Math.random() * 0.38) * (z / 2)
      });
    }

    let time = 0;

    const render = () => {
      time += 0.005;

      // Draw slightly transparent background to create longer particle trails
      ctx.fillStyle = 'rgba(3, 4, 8, 0.075)';
      ctx.fillRect(0, 0, width, height);

      // Light hover aura glow
      if (mouse.active) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          280
        );
        glowGrad.addColorStop(0, 'rgba(95, 109, 248, 0.04)');
        glowGrad.addColorStop(1, 'rgba(95, 109, 248, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Render flowing particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Horizontal stream flow
        p.x += p.speed;
        
        // Respawn when particle exits right boundary
        if (p.x > width + 10) {
          p.x = -10;
          p.offsetY = (Math.random() - 0.5) * 15;
        }

        // Winding sine/cosine stream path based on ribbon stream id
        const flowY = getStreamPath2D(p.streamId, p.x, time);
        const noise = Math.sin(p.x * 0.004 + p.noiseOffset + time * 0.5) * 10;

        let y = flowY + p.offsetY + noise;

        // Particle cursor avoidance deflection
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) * 0.08;
            p.x += (dx / dist) * force;
            y += (dy / dist) * force;
          }
        }

        // Smooth edge boundary fade-in/fade-out
        let fade = 1.0;
        if (p.x < 120) {
          fade = p.x / 120;
        } else if (p.x > width - 120) {
          fade = (width - p.x) / 120;
        }
        fade = Math.max(0, Math.min(1, fade));

        const finalOpacity = p.opacity * fade;

        if (finalOpacity > 0.01) {
          // Soft outer glow layer for larger particles
          if (p.size > 2.0) {
            ctx.beginPath();
            ctx.arc(p.x, y, p.size * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace('opacity', (finalOpacity * 0.22).toString());
            ctx.fill();
          }

          // Particle core
          ctx.beginPath();
          ctx.arc(p.x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace('opacity', finalOpacity.toString());
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 block"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

export default function LandingView({
  onEnterApp,
  onLoginSuccess,
  onNavigateToPricing,
  onGetStarted,
  onSignIn
}: LandingViewProps) {
  const [activeDemoTab, setActiveDemoTab] = useState<'transcripts' | 'notes' | 'insights'>('transcripts');
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  return (
    <div className="bg-[#030408] text-white min-h-screen overflow-x-hidden font-sans select-none relative pb-12">
      <InteractiveWaveBackground />
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#030408]/75 backdrop-blur-md border-b border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AILogo size={38} showText={true} theme="dark" />
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-neutral-400 uppercase tracking-widest">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#notebook" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#memory" className="hover:text-white transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onSignIn}
              className="text-xs font-bold text-neutral-400 hover:text-white cursor-pointer uppercase tracking-widest focus:outline-none"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="rounded-full bg-white hover:bg-neutral-200 text-xs font-bold text-black px-6 py-3 transition-all active:scale-95 shadow-sm focus:outline-none cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Presentation Area */}
      <section className="relative max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side Copy */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-[11px] font-bold text-indigo-300 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5F6DF8] animate-pulse" />
            Next-Gen Academic AI
          </div>

          <h1 className="font-sans font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.05] max-w-2xl">
            AI That Thinks <br />
            While You <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5F6DF8] to-[#2563EB] italic font-serif py-1 font-medium select-text">Learn</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 font-medium leading-relaxed max-w-xl">
            Capture lectures live. Generate intelligent notes instantly. Track weak topics automatically. Learn with a persistent AI memory system.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 rounded-full bg-white hover:bg-neutral-200 py-3.5 px-7 text-xs font-bold text-black transition-all transform active:scale-95 shadow-md shadow-neutral-900/10 focus:outline-none cursor-pointer"
            >
              <Volume2 className="h-4 w-4 text-[#5F6DF8]" />
              <span>Start Recording</span>
            </button>
            
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 py-3.5 px-7 text-xs font-bold text-white transition-all transform active:scale-95 focus:outline-none cursor-pointer"
            >
              <Play className="h-4 w-4 text-neutral-400" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Right Side Brand Glass Tablet Visual */}
        <div className="lg:col-span-5 relative w-full flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-[430px] rounded-3xl bg-white/3 backdrop-blur-md border border-white/8 shadow-2xl p-6.5 space-y-6"
          >
            {/* Tablet Header Mock */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                <div className="h-3 w-3 rounded-full bg-[#27C93F]" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#5F6DF8] font-mono">Notebook AI Node</span>
            </div>

            {/* Inner Dashboard Widget Grid */}
            <div className="space-y-4 text-left">
              <div className="rounded-2xl bg-white/2 p-4.5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Speaker 1 • Active Transcription</span>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-[9px] font-bold">LIVE STAGING</span>
                </div>
                
                {/* Simulated Audio waves */}
                <div className="flex items-end gap-1 h-8 px-1">
                  {[30, 60, 45, 90, 40, 20, 65, 80, 50, 75, 95, 30, 45, 60, 55, 70, 40].map((height, idx) => (
                    <div 
                      key={idx} 
                      style={{ height: `${height}%` }}
                      className="flex-1 bg-gradient-to-t from-[#5F6DF8] to-[#2563EB] rounded-full" 
                    />
                  ))}
                </div>

                <p className="text-[11px] font-serif italic text-[#8b9bb4] leading-normal">
                  "Gradient optimization constraints decrease exponentially when the activation functions are correctly scaled using adaptive weights parameters..."
                </p>
              </div>

              {/* Cognitive tags key concepts block */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block font-sans">Key Concepts Identified</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[#818cf8] px-2.5 py-1 text-[10px] font-semibold">Stochastic Gradients</span>
                  <span className="rounded-lg bg-white/3 border border-white/8 text-neutral-300 px-2.5 py-1 text-[10px] font-semibold">Decay Matrices</span>
                  <span className="rounded-lg bg-purple-500/10 border border-purple-500/20 text-[#c084fc] px-2.5 py-1 text-[10px] font-semibold">Loss Minifolds</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Section: "Engineered for Intellectual Rigor" */}
      <section className="bg-[#030408]/50 border-y border-white/5 py-20 px-6 text-center" id="features">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3">
            <h2 className="font-sans font-black text-2xl md:text-3.5xl tracking-tight text-white">
              Engineered for Intellectual Rigor
            </h2>
            <p className="text-xs sm:text-sm font-medium text-neutral-400 max-w-lg mx-auto">
              Precision tools designed for researchers, students, and high-level knowledge workers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white/3 backdrop-blur-md p-7 rounded-2xl border border-white/8 hover:border-[#5F6DF8]/30 transition-all text-left space-y-4 group">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-[#5F6DF8] group-hover:bg-[#5F6DF8] group-hover:text-white transition-colors">
                <Upload className="h-5.5 w-5.5" />
              </div>
              <h4 className="font-sans font-extrabold text-sm text-white leading-none">Live Lecture Capture</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                High-fidelity transcription that understands academic context and complex jargon.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/3 backdrop-blur-md p-7 rounded-2xl border border-white/8 hover:border-[#5F6DF8]/30 transition-all text-left space-y-4 group">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-amber-500 group-hover:bg-[#5F6DF8] group-hover:text-white transition-colors">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <h4 className="font-sans font-extrabold text-sm text-white leading-none">Smart Notes</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                AI-structured summaries that link disparate concepts into a cohesive knowledge map.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/3 backdrop-blur-md p-7 rounded-2xl border border-white/8 hover:border-[#5F6DF8]/30 transition-all text-left space-y-4 group">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-emerald-500 group-hover:bg-[#5F6DF8] group-hover:text-white transition-colors">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
              <h4 className="font-sans font-extrabold text-sm text-white leading-none">Adaptive Learning</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Real-time gap analysis identifies what you missed and adapts your study path.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white/3 backdrop-blur-md p-7 rounded-2xl border border-white/8 hover:border-[#5F6DF8]/30 transition-all text-left space-y-4 group">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-[#5F6DF8] group-hover:bg-[#5F6DF8] group-hover:text-white transition-colors">
                <Brain className="h-5.5 w-5.5" />
              </div>
              <h4 className="font-sans font-extrabold text-sm text-white leading-none">Persistent AI Brain</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                A long-term memory system that recalls previous sessions to build cross-topic insights.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Section: "The Ultimate Digital Notebook" */}
      <section className="max-w-6xl mx-auto px-6 py-20 relative select-none" id="notebook">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5F6DF8] block">PRODUCT INTERFACE</span>
            <h2 className="font-sans font-black text-2xl md:text-4xl text-white tracking-tight leading-none">
              The Ultimate Digital Notebook
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed">
              Our split-screen interface allows you to view the original source material alongside AI-generated insights. Highlight any text to trigger the "Persistent Memory" check.
            </p>

            <ul className="space-y-3.5 pt-2">
              {[
                "Interactive Knowledge Graphs",
                "Instant Semantic Search",
                "Context-Aware Highlighting"
              ].map((bullet, index) => (
                <li key={index} className="flex items-center gap-3 text-xs font-bold text-neutral-200">
                  <CheckCircle className="h-5 w-5 text-[#5F6DF8] flex-shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right simulated MacBook screen visualization */}
          <div className="lg:col-span-7 flex justify-center w-full relative">
            
            {/* Visual Laptop Chassis Drawing */}
            <div className="w-full max-w-[540px] flex flex-col items-center">
              {/* Laptop Screen Bezel */}
              <div className="aspect-[16/10] w-full bg-[#121318] rounded-2xl p-2 md:p-3 shadow-2xl relative border-4 border-neutral-800">
                
                {/* Web Camera dot */}
                <div className="absolute top-1 left-1/2 -translateX-1/2 h-1 w-1 bg-neutral-900 rounded-full" />
                
                {/* Inside Screen Content: App split layout preview */}
                <div className="h-full w-full bg-[#0c0e17] rounded-lg overflow-hidden flex flex-col relative select-none">
                  
                  {/* Laptop Web Window header tab bar */}
                  <div className="h-7 border-b border-white/5 bg-white/2 flex items-center justify-between px-3">
                    <span className="text-[9px] font-sans font-bold text-neutral-400">workspace / Calculus-Theory.pdf</span>
                    <div className="h-1.5 w-1.5 bg-neutral-700 rounded-full" />
                  </div>

                  {/* Split Screen Columns */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Column 1: Sources transcript matrix on left */}
                    <div className="w-[50%] bg-[#090a0f] border-r border-white/5 p-3 text-[8.5px] text-left leading-normal space-y-2 font-serif text-neutral-400 overflow-y-auto">
                      <span className="text-[7.5px] font-sans font-black text-neutral-500 block pb-1 border-b border-white/5">TRANSCRIPT VIEW</span>
                      <p>"Under non-trivial topologies, boundary states diverge from traditional manifolds. We represent this as limit coordinates."</p>
                      <div className="rounded bg-indigo-500/10 border border-indigo-500/20 p-1.5 p-y-1 my-1 text-[8px] font-mono text-[#818cf8] font-bold block">
                        {"f(x) = lim (h -> 0) [f(x+h) - f(x)] / h"}
                      </div>
                      <p>"This establishes the derivatives base rules. Repeating this allows gradient tracing..."</p>
                    </div>

                    {/* Column 2: Generated summaries workspace on right */}
                    <div className="w-[50%] bg-[#0c0e17] p-3 text-[8.5px] text-left leading-normal space-y-3.5 overflow-y-auto">
                      <span className="text-[7.5px] font-sans font-black text-[#5F6DF8] uppercase tracking-widest block pb-1 border-b border-white/5">KNOWLEDGE RECALL</span>
                      
                      <div className="space-y-1">
                        <span className="font-sans font-black text-[9px] text-white block">Calculus Foundations</span>
                        <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" />
                      </div>

                      <ul className="space-y-1.5 text-neutral-400 font-medium font-sans">
                        <li className="flex gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>Derivatives represent local slope systems.</span>
                        </li>
                        <li className="flex gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>Highly vital for gradient optimization structures.</span>
                        </li>
                      </ul>

                      <div className="rounded bg-amber-500/10 p-1.5 text-[8px] font-bold text-amber-400 font-sans tracking-wide block">
                        ★ Topic Flagged: Midterm Critical Section
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Laptop keyboard bottom chassis */}
              <div className="h-3.5 w-[114%] bg-neutral-800 rounded-b-2xl border-t border-neutral-700 shadow-md relative z-10 flex justify-center">
                <div className="h-[2px] w-24 bg-neutral-600 rounded-full mt-[2px]" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Section: "Three Steps to Mastery" */}
      <section className="bg-[#030408]/50 border-y border-white/5 py-20 px-6 text-center select-none">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="font-sans font-black text-2xl md:text-3.5xl text-white tracking-tight">
            Three Steps to Mastery
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="space-y-4 text-center">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 shadow-sm flex items-center justify-center font-mono font-black text-xs text-[#5F6DF8] mx-auto">
                1
              </div>
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-widest">Record</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-semibold max-w-xs mx-auto">
                Live stream your audio or upload transcripts to our secure cloud.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-center">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 shadow-sm flex items-center justify-center font-mono font-black text-xs text-[#5F6DF8] mx-auto">
                2
              </div>
              <h4 className="font-sans font-black text-sm text-gray-900 uppercase tracking-widest">Understand</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold max-w-xs mx-auto">
                AI clusters themes and highlights the most critical data points.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-center">
              <div className="h-10 w-10 rounded-full bg-white border border-[#EBE6DC] shadow-sm flex items-center justify-center font-mono font-black text-xs text-indigo-500 mx-auto">
                3
              </div>
              <h4 className="font-sans font-black text-sm text-gray-900 uppercase tracking-widest">Get Notes</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold max-w-xs mx-auto">
                Receive structured documents, quiz banks, and flashcards instantly.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Section: "Your Personal Academic Memory" */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center" id="memory">
        <div className="space-y-4 max-w-2xl mx-auto pb-12">
          <h2 className="font-sans font-black text-2xl md:text-4xl text-white tracking-tight">
            Your Personal Academic Memory
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed">
            NoteIT doesn't just process files; it builds a mental model of your knowledge. Over time, it identifies your cognitive gaps and proactively suggests review material.
          </p>
        </div>

        {/* Dashboard Analytics mockup panel */}
        <div className="rounded-3xl bg-white/3 backdrop-blur-md border border-white/8 p-5.5 md:p-8 shadow-xl text-left grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto select-none">
          
          {/* Left charts dashboard pane */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Learning History Visual Block */}
            <div className="bg-white/2 p-5.5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5F6DF8] font-mono block">Retention Curve</span>
                  <span className="text-xs font-black text-white font-sans block mt-0.5">Learning History</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-400">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#5F6DF8]" /> Current Mastery</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Preserved Knowledge</span>
                </div>
              </div>

              {/* Vector SVG Curve Representation */}
              <div className="h-32 relative flex items-end">
                <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Current Learning Area Grid */}
                  <path d="M0 80 Q 25 30, 50 45 T 100 20 L 100 100 L 0 100 Z" fill="url(#blue-grad)" opacity="0.15" />
                  <path d="M0 80 Q 25 30, 50 45 T 100 20" stroke="#5F6DF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  
                  {/* Preserved Curve Area */}
                  <path d="M0 90 Q 30 70, 60 55 T 100 40 L 100 100 L 0 100 Z" fill="url(#green-grad)" opacity="0.08" />
                  <path d="M0 90 Q 30 70, 60 55 T 100 40" stroke="#10B981" strokeWidth="2" strokeDasharray="4,3" fill="none" />

                  <defs>
                    <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5F6DF8" />
                      <stop offset="100%" stopColor="#030408" />
                    </linearGradient>
                    <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#030408" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Horizontal time markings */}
                <div className="absolute inset-x-0 bottom-0.5 flex justify-between text-[8px] font-mono text-neutral-500 font-extrabold px-1">
                  <span>LEC 1</span>
                  <span>LEC 3</span>
                  <span>LEC 5</span>
                  <span>LEC 7</span>
                  <span>LEC 10</span>
                </div>
              </div>
            </div>

            {/* Weak Topic Radar tracker simulation */}
            <div className="bg-white/2 p-5.5 rounded-2xl border border-white/5 space-y-3.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5F6DF8] font-mono block">Telemetry analysis</span>
              <h4 className="text-xs font-black text-white leading-none">Weak Topic Radar</h4>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Visual SVG spiderweb vector */}
                <div className="h-28 w-28 relative">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                    {/* Spiderweb concentric circles */}
                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" fill="none" />
                    <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" fill="none" />
                    <circle cx="50" cy="50" r="15" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" fill="none" />
                    {/* Axes Lines */}
                    <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                    <line x1="18.2" y1="18.2" x2="81.8" y2="81.8" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                    <line x1="18.2" y1="81.8" x2="81.8" y2="18.2" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

                    {/* Filled weak status polygon */}
                    <polygon points="50,15 70,30 85,50 60,75 50,80 35,60 20,50 30,35" fill="#EF4444" fillOpacity="0.1" stroke="#EF4444" strokeWidth="1.8" />
                  </svg>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3 text-[10px] font-bold text-neutral-400">
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> NLP: Critical</div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Algorithms: Mastered</div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Neural Networks: Review</div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Python: Staging</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Recommendations card column */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#5F6DF8] block">Personalized Recommendations</span>

            {/* Recommendation 1 */}
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4.5 flex gap-4 items-start">
              <div className="h-8.5 w-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Brain className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-300">Review: Neural Networks</span>
                  <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[8px] font-bold">45% Score</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-emerald-200/80 font-medium">
                  Learn micro-connections to practice your deep neural networks.
                </p>
              </div>
            </div>

            {/* Recommendation 2 */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4.5 flex gap-4 items-start">
              <div className="h-8.5 w-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">Practice: Algorithms</span>
                  <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[8px] font-bold">Review Required</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-amber-200/80 font-medium">
                  Learn more algorithms from leveraging your data structures.
                </p>
              </div>
            </div>

            {/* Recommendation 3 */}
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4.5 flex gap-4 items-start">
              <div className="h-8.5 w-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">Explore: Reinforcement Learning</span>
                  <span className="rounded bg-blue-500/20 text-blue-300 px-1.5 py-0.5 text-[8px] font-bold">Suggested Core</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-blue-200/80 font-medium">
                  Explore how neurons learn to explore reinforcement learning.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Section: "Simple, Scholar-Focused Pricing" */}
      <section className="bg-[#030408]/50 border-y border-white/5 py-20 px-6 text-center select-none" id="pricing">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-2">
            <h2 className="font-sans font-black text-2xl md:text-3.5xl text-white">
              Simple, Scholar-Focused Pricing
            </h2>
            <p className="text-xs sm:text-sm font-medium text-neutral-400">Choose the optimal scaling factor for your education demands.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Free pricing Card */}
            <div className="bg-white/3 backdrop-blur-md p-8.5 rounded-3xl border border-white/8 flex flex-col justify-between space-y-8 text-left transition-all hover:border-[#5F6DF8]/20 text-white">
              <div className="space-y-4">
                <span className="font-sans font-black text-sm text-neutral-200 uppercase tracking-widest">Free</span>
                <div className="space-y-1">
                  <span className="text-4xl font-extrabold text-white font-sans">$0</span>
                  <span className="text-xs font-bold text-neutral-400">/ month</span>
                </div>
                <div className="h-px bg-white/10" />
                <ul className="space-y-3.5 text-xs text-neutral-300 font-bold">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>5 Recordings / Mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Standard Transcription</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Basic Summaries</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl border border-white/10 hover:bg-white/10 bg-white/5 py-3 font-sans text-xs font-black text-white transition-all focus:outline-none cursor-pointer text-center"
              >
                Get Started
              </button>
            </div>

            {/* Pro tier pricing Card with Popular badge */}
            <div className="bg-[#030408]/80 backdrop-blur-md p-8.5 rounded-3xl border-2 border-[#5F6DF8] flex flex-col justify-between space-y-8 text-left relative shadow-2xl shadow-indigo-500/10 text-white">
              <span className="absolute -top-3.5 left-1/2 -ml-14.5 bg-[#5F6DF8] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                MOST POPULAR
              </span>
              
              <div className="space-y-4">
                <span className="font-sans font-black text-sm text-[#5F6DF8] uppercase tracking-widest">Student Pro</span>
                <div className="space-y-1">
                  <span className="text-4xl font-extrabold text-white font-sans">$12</span>
                  <span className="text-xs font-bold text-neutral-400">/ month</span>
                </div>
                <div className="h-px bg-white/10" />
                <ul className="space-y-3.5 text-xs text-neutral-200 font-bold">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Unlimited Recordings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>High-Fidelity AI Processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Persistent AI Memory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Weak Topic Radar</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl bg-[#5F6DF8] hover:bg-indigo-600 py-3.5 font-sans text-xs font-black text-white transition-all text-center focus:outline-none cursor-pointer"
              >
                Go Pro
              </button>
            </div>

            {/* Premium institution custom pricing Card */}
            <div className="bg-white/3 backdrop-blur-md p-8.5 rounded-3xl border border-white/8 flex flex-col justify-between space-y-8 text-left transition-all hover:border-[#5F6DF8]/20 text-white">
              <div className="space-y-4">
                <span className="font-sans font-black text-sm text-neutral-200 uppercase tracking-widest">Institution</span>
                <div className="space-y-1">
                  <span className="text-3.5xl font-extrabold text-white font-sans">Custom</span>
                  <span className="text-xs font-bold text-neutral-400">/ customized plan</span>
                </div>
                <div className="h-px bg-white/10" />
                <ul className="space-y-3.5 text-xs text-neutral-300 font-bold">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Scale academic intelligence across your entire university or lab.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Admin Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>API Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-[#5F6DF8]" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl border border-white/10 hover:bg-white/10 bg-white/5 py-3 font-sans text-xs font-black text-white transition-all focus:outline-none cursor-pointer text-center"
              >
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Section: "Ready to upgrade your intellect?" */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center relative select-none">
        
        {/* Glow vector back styling */}
        <div className="absolute top-1/2 left-1/2 -translateX-1/2 -translateY-1/2 w-[480px] h-48 bg-indigo-500/10 blur-[110px] pointer-events-none rounded-full" />

        <div className="relative z-10 bg-black rounded-3xl p-10 md:p-14 border border-neutral-900 shadow-2xl text-white space-y-6 max-w-4xl mx-auto overflow-hidden">
          
          <h3 className="font-sans font-black text-2.5xl md:text-4.5xl text-white tracking-tight leading-none">
            Ready to upgrade your intellect?
          </h3>

          <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed max-w-xl mx-auto">
            Join 50,000+ researchers and students using ScholarAI to redefine how they learn.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto rounded-full bg-white hover:bg-neutral-100 text-xs font-bold text-gray-950 py-3.5 px-8 transition-all hover:scale-101 focus:outline-none cursor-pointer"
            >
              Start Free Trial
            </button>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-neutral-300 py-3.5 px-8 transition-all focus:outline-none cursor-pointer"
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* 9. Premium Footer */}
      <footer className="bg-[#030408]/90 border-t border-white/5 py-20 px-6 text-left select-none text-[13px] text-neutral-400 font-medium font-sans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Footer branding header left */}
          <div className="md:col-span-4 space-y-4">
            <AILogo size={32} showText={true} theme="dark" />
            <p className="text-xs text-neutral-400 font-medium leading-relaxed max-w-xs">
              NoteIT AI. Precision in knowledge synthesis. Helping the world think deeper through technology.
            </p>
            <div className="pt-2 border-t border-white/5 space-y-1 text-xs text-neutral-400">
              <div className="font-extrabold text-neutral-300">Built by BRUTE</div>
              <div className="font-medium text-neutral-400">Founder: <span className="font-bold text-neutral-300">Kishan Verma</span></div>
              <div className="font-extrabold text-indigo-500 mt-2.5 block">Contact Us</div>
              <div className="text-[11px] font-mono leading-relaxed">Email: vermakishan478@gmail.com</div>
              <div className="text-[11px] font-mono leading-relaxed">Phone: +91 7471111980</div>
            </div>
          </div>

          {/* Nav groups */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6.5">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white font-sans block">Product</span>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-semibold">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#notebook" className="hover:text-white">Solutions</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#memory" className="hover:text-white">About</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white font-sans block">Company</span>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-semibold">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Research Ethics</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white font-sans block">Support</span>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-semibold">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Support</a></li>
                <li><a href="#" className="hover:text-white">API Documentation</a></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-10 mt-10 border-t border-white/5 text-center text-xs text-neutral-400 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          <span>© 2026 ScholarAI. Precision in knowledge synthesis. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Network className="h-4 w-4" /></a>
            <a href="#" className="hover:text-white transition-colors"><Users className="h-4 w-4" /></a>
            <a href="#" className="hover:text-white transition-colors"><Award className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
