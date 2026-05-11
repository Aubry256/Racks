/**
 * lib/useTheme.ts
 *
 * Dark/light mode toggle.
 * Stores preference in localStorage so it persists across visits.
 * Sets data-theme="dark" on <html> — all CSS variables respond automatically.
 *
 * HCI Principle 1 — Consistency:
 * Theme is set once here and applied everywhere via CSS variables.
 */

import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'racks_theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  // On mount: read saved preference OR detect system preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved) {
      apply(saved)
      setTheme(saved)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = prefersDark ? 'dark' : 'light'
      apply(initial)
      setTheme(initial)
    }
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    apply(next)
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { theme, toggle, isDark: theme === 'dark' }
}

function apply(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}
