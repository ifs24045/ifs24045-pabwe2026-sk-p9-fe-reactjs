import { useCallback, useEffect, useState } from 'react'

export const ACCENTS = ['indigo', 'emerald', 'rose', 'amber']
export const THEME_KEY = 'delcom_blog_theme'
export const ACCENT_KEY = 'delcom_blog_accent'

function readTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readAccent() {
  const stored = localStorage.getItem(ACCENT_KEY)
  return ACCENTS.includes(stored) ? stored : ACCENTS[0]
}

/** Hook tema terang/gelap dan warna aksen, tersimpan di localStorage. */
export default function useTheme() {
  const [theme, setTheme] = useState(readTheme)
  const [accent, setAccent] = useState(readAccent)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.accent = accent
    localStorage.setItem(ACCENT_KEY, accent)
  }, [accent])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, accent, setAccent, toggleTheme, isDark: theme === 'dark' }
}