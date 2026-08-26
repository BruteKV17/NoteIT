import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { FacultyProfile, FacultySetupInput } from '../types'
import { DEMO_PROFILE, makeFacultyProfile } from '../lib/mockData'
import { generateTeacherCode, initialsFrom } from '../lib/uid'

/** hero → ready */
export type AuthStage = 'unauthenticated' | 'login' | 'setup' | 'hero' | 'ready'

interface AuthContextValue {
  stage: AuthStage
  profile: FacultyProfile | null
  openLogin: () => void
  cancelAuth: () => void
  authenticate: () => void
  completeSetup: (input: FacultySetupInput) => void
  loginWithDemo: () => void
  enterPortal: () => void
  updateProfile: (patch: Partial<FacultyProfile>) => void
  initProfile: (prof: FacultyProfile) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialProfile,
  onSignOut,
  initialStage = 'hero'
}: {
  children: ReactNode
  initialProfile?: FacultyProfile | null
  onSignOut?: () => void
  initialStage?: AuthStage
}) {
  const [stage, setStage] = useState<AuthStage>(initialStage)
  const [profile, setProfile] = useState<FacultyProfile | null>(initialProfile || DEMO_PROFILE)

  const openLogin = useCallback(() => setStage('login'), [])
  const cancelAuth = useCallback(() => setStage('unauthenticated'), [])
  const authenticate = useCallback(() => setStage('setup'), [])

  const enterPortal = useCallback(() => {
    setStage('ready')
  }, [])

  const completeSetup = useCallback((input: FacultySetupInput) => {
    setProfile(makeFacultyProfile(input))
    setStage('ready')
  }, [])

  const loginWithDemo = useCallback(() => {
    setProfile(DEMO_PROFILE)
    setStage('ready')
  }, [])

  const initProfile = useCallback((prof: FacultyProfile) => {
    setProfile(prof)
  }, [])

  const updateProfile = useCallback((patch: Partial<FacultyProfile>) => {
    setProfile((prev) => {
      const base = prev || DEMO_PROFILE
      const next = { ...base, ...patch }
      const nameChanged = patch.firstName !== undefined || patch.surname !== undefined
      if (nameChanged) {
        next.teacherCode = patch.teacherCode || generateTeacherCode(next.firstName, next.surname)
        next.avatarInitials = initialsFrom(next.firstName, next.surname)
      }
      return next
    })
  }, [])

  const logout = useCallback(() => {
    setProfile(null)
    setStage('hero')
    if (onSignOut) {
      onSignOut()
    }
  }, [onSignOut])

  const value = useMemo<AuthContextValue>(
    () => ({
      stage,
      profile,
      openLogin,
      cancelAuth,
      authenticate,
      completeSetup,
      loginWithDemo,
      enterPortal,
      updateProfile,
      initProfile,
      logout,
    }),
    [stage, profile, openLogin, cancelAuth, authenticate, completeSetup, loginWithDemo, enterPortal, updateProfile, initProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
