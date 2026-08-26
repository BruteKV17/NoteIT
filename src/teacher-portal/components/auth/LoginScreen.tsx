import { useState } from 'react'
import { ArrowRight, KeyRound, Mail, Sparkles, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../ui/Modal'

/** Faculty sign-in overlay shown over the cinematic hero. */
export function LoginScreen() {
  const { stage, authenticate, loginWithDemo, cancelAuth } = useAuth()
  const [email, setEmail] = useState('')

  const open = stage === 'login'

  return (
    <Modal open={open} onClose={cancelAuth} labelledBy="login-title" className="max-w-md">
      <div className="liquid-glass rounded-[28px] p-8 text-white">
        <button
          type="button"
          onClick={cancelAuth}
          aria-label="Close sign in"
          className="absolute right-5 top-5 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/80">
          <Sparkles size={12} /> Faculty workspace
        </span>

        <h2 id="login-title" className="mt-4 text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Sign in to manage courses and resolve doubts. No API key required.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            authenticate()
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/70">Faculty email</span>
            <span className="relative flex items-center">
              <Mail size={16} className="pointer-events-none absolute left-3.5 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/70">Password</span>
            <span className="relative flex items-center">
              <KeyRound size={16} className="pointer-events-none absolute left-3.5 text-white/40" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />
            </span>
          </label>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-100"
          >
            Continue to setup
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-white/40">
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-xs">or</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={loginWithDemo}
          className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Explore with demo faculty →
        </button>
      </div>
    </Modal>
  )
}
