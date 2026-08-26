import { useEffect, useRef } from 'react'
import { ArrowRight, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AILogo from '../../../components/AILogo'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4'

const FADE_MS = 500
const FADE_OUT_LEAD = 0.55 // seconds before the end to start fading out

/**
 * Full-screen cinematic hero with seamless video loop, the mascot logo, and a single, direct
 * "ENTER PORTAL" button.
 */
export function LandingHero() {
  const { enterPortal, loginWithDemo, logout } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const fadingOutRef = useRef(false)

  const handleEnter = () => {
    if (enterPortal) enterPortal()
    else loginWithDemo()
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.style.opacity = '0'
    const tryPlay = () => video.play().catch(() => {})
    tryPlay()

    const cleanupRaf = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    return cleanupRaf
  }, [])

  /** Animate opacity to `to` over `duration`, resuming from current value. */
  const fade = (to: number, duration = FADE_MS) => {
    const video = videoRef.current
    if (!video) return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current) // cancel competing fade
    const from = parseFloat(video.style.opacity || '0')
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      video.style.opacity = String(from + (to - from) * t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const handleLoadedData = () => {
    fadingOutRef.current = false
    fade(1)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const remaining = video.duration - video.currentTime
    if (remaining <= FADE_OUT_LEAD && !fadingOutRef.current) {
      fadingOutRef.current = true
      fade(0)
    }
  }

  const handleEnded = () => {
    const video = videoRef.current
    if (!video) return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    video.style.opacity = '0'
    window.setTimeout(() => {
      video.currentTime = 0
      video.play().catch(() => {})
      fadingOutRef.current = false
      fade(1)
    }, 100)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background video */}
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full translate-y-[17%] scale-[1.35] object-cover"
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        preload="auto"
        aria-hidden="true"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      {/* Cinematic legibility overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

      {/* Foreground */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Nav */}
        <nav className="relative z-20 py-6 pl-6 pr-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-black/40 border border-white/10 backdrop-blur-md px-6 py-3">
            <div className="flex items-center gap-3 text-white">
              <AILogo size={34} showText={false} theme="dark" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold tracking-tight text-white">NoteIT</span>
                <span className="text-[11px] font-medium tracking-wider text-white/60 lowercase">faculty portal</span>
              </div>
            </div>
            {/* Sign Out Button */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 backdrop-blur-md transition-all hover:bg-rose-500/20 active:scale-95 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 -translate-y-[8%] flex-col items-center justify-center px-6 py-12 text-center">
          <button
            type="button"
            onClick={handleEnter}
            className="liquid-glass group relative flex items-center gap-3 rounded-full px-10 py-5 text-lg font-semibold tracking-wide text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            <span>ENTER PORTAL</span>
            <ArrowRight size={22} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
