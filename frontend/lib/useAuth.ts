/**
 * lib/useAuth.ts
 *
 * Single source of truth for authentication state.
 *
 * WHY THIS IS NEEDED:
 * Without this hook, every page reads localStorage separately:
 *   const token = localStorage.getItem('racks_access_token')
 * This creates inconsistency — HCI Principle 1 violation.
 *
 * With this hook:
 * - Every page uses the same auth state
 * - Logout clears everything in one place
 * - Role-based rendering is consistent everywhere
 * - The header always shows the correct logged-in state
 *
 * HCI Principle 1 — Consistency:
 * The header, dashboard, and login page all see the same auth state.
 * No more "Sign In shown when logged in" (Dombelo's failure).
 *
 * Usage:
 *   const { user, isLoggedIn, role, logout } = useAuth()
 *   if (isLoggedIn && role === 'vendor') → show vendor nav
 *   if (!isLoggedIn) → redirect to login
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

export interface AuthUser {
  id:        string
  email:     string
  full_name: string
  role:      'customer' | 'vendor' | 'admin'
  district?: string
  phone?:    string
}

const USER_KEY    = 'racks_user'
const ACCESS_KEY  = 'racks_access_token'
const REFRESH_KEY = 'racks_refresh_token'

export function useAuth() {
  const router = useRouter()
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Read auth state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      const token  = localStorage.getItem(ACCESS_KEY)
      if (stored && token) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // localStorage unavailable
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout — clears all stored auth data
  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    // Redirect to homepage
    router.replace('/')
  }, [router])

  // Set user after login
  const setAuth = useCallback((userData: AuthUser, access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY,  access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY,    JSON.stringify(userData))
    setUser(userData)
  }, [])

  // requireAuth — redirect to login if not authenticated
  const requireAuth = useCallback((redirectTo = '/login') => {
    if (!loading && !user) {
      router.replace(redirectTo)
      return false
    }
    return true
  }, [user, loading, router])

  // requireRole — redirect if wrong role
  const requireRole = useCallback((role: AuthUser['role'], redirectTo = '/') => {
    if (!loading && user && user.role !== role) {
      router.replace(redirectTo)
      return false
    }
    return requireAuth()
  }, [user, loading, router, requireAuth])

  return {
    user,
    loading,
    isLoggedIn: Boolean(user),
    role:       user?.role || null,
    logout,
    setAuth,
    requireAuth,
    requireRole,
  }
}
