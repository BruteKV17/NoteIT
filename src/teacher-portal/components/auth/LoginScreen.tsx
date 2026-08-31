import { useState } from 'react'
import { ArrowRight, KeyRound, Mail, Sparkles, X, CheckCircle, AlertCircle } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../../firebaseConfig'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../ui/Modal'

/** Faculty sign-in overlay shown over the cinematic hero. */
export function LoginScreen() {
  const { stage, authenticate, loginWithDemo, cancelAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [sendingReset, setSendingReset] = useState(false)

  const open = stage === 'login'

  const validateEmail = (emailStr: string) => {
    const cleanEmail = emailStr.trim()
    if (!cleanEmail) return { valid: false, reason: 'Faculty email address is required.' }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(cleanEmail)) {
      return { valid: false, reason: 'Please enter a valid, deliverable faculty email address.' }
    }
    return { valid: true }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const check = validateEmail(email)
    if (!check.valid) {
      setError(check.reason || 'Invalid email format.')
      return
    }

    setSendingReset(true)
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase())
      setSuccessMsg(`Password reset link sent to ${email.trim()}! Please check your email inbox to reset your password.`)
    } catch (err: any) {
      console.error('Password reset error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('No faculty account registered with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.')
      } else {
        setError(err.message || 'Failed to send password reset email.')
      }
    } finally {
      setSendingReset(false)
    }
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const check = validateEmail(email)
    if (!check.valid) {
      setError(check.reason || 'Invalid email address.')
      return
    }

    authenticate()
  }

  return (
    <Modal open={open} onClose={cancelAuth} labelledBy="login-title" className="max-w-md">
      <div className="liquid-glass rounded-[28px] p-8 text-white">
        <button
          type="button"
          onClick={cancelAuth}
          aria-label="Close sign in"
          className="absolute right-5 top-5 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/80">
          <Sparkles size={12} /> Faculty workspace
        </span>

        <h2 id="login-title" className="mt-4 text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {isForgotMode ? 'Reset password' : 'Welcome back'}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          {isForgotMode
            ? 'Enter your registered faculty email address to receive a secure password reset link.'
            : 'Sign in to manage courses and resolve doubts.'
          }
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {isForgotMode ? (
          <form className="mt-6 space-y-4" onSubmit={handleForgotPassword}>
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

            <button
              type="submit"
              disabled={sendingReset}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-100 cursor-pointer disabled:opacity-50"
            >
              {sendingReset ? 'Sending Reset Link...' : 'Send Password Reset Link'}
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => { setIsForgotMode(false); setError(null); setSuccessMsg(null); }}
              className="w-full text-center text-xs font-medium text-white/70 hover:text-white hover:underline cursor-pointer pt-2"
            >
              ← Back to Faculty Sign In
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
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
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-white/70">Password</span>
                <button
                  type="button"
                  onClick={() => { setIsForgotMode(true); setError(null); setSuccessMsg(null); }}
                  className="text-[11px] font-medium text-sky-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-100 cursor-pointer"
            >
              Continue to setup
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-white/40">
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-xs">or</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={loginWithDemo}
          className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 cursor-pointer"
        >
          Explore with demo faculty →
        </button>
      </div>
    </Modal>
  )
}

