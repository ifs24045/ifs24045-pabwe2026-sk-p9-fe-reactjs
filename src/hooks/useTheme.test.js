import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useTheme, { ACCENTS, ACCENT_KEY, THEME_KEY } from './useTheme'

const originalMatchMedia = window.matchMedia

function preferDark(matches) {
  window.matchMedia = vi.fn().mockReturnValue({ matches })
}

beforeEach(() => {
  preferDark(false)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('useTheme', () => {
  it('default: terang dengan aksen pertama', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
    expect(result.current.accent).toBe(ACCENTS[0])
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.accent).toBe('indigo')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(localStorage.getItem(ACCENT_KEY)).toBe('indigo')
  })

  it('mengikuti preferensi sistem gelap jika belum ada pilihan tersimpan', () => {
    preferDark(true)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('pilihan tersimpan mengalahkan preferensi sistem', () => {
    preferDark(true)
    localStorage.setItem(THEME_KEY, 'light')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('nilai tema tersimpan yang tidak valid diabaikan', () => {
    localStorage.setItem(THEME_KEY, 'ungu')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('membaca aksen tersimpan yang valid dan mengabaikan yang tidak valid', () => {
    localStorage.setItem(ACCENT_KEY, 'rose')
    const valid = renderHook(() => useTheme())
    expect(valid.result.current.accent).toBe('rose')
    valid.unmount()

    localStorage.setItem(ACCENT_KEY, 'biru-neon')
    const invalid = renderHook(() => useTheme())
    expect(invalid.result.current.accent).toBe('indigo')
  })

  it('toggleTheme bolak-balik terang dan gelap', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setAccent mengubah aksen, atribut data-accent, dan penyimpanan', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setAccent('emerald'))

    expect(result.current.accent).toBe('emerald')
    expect(document.documentElement.dataset.accent).toBe('emerald')
    expect(localStorage.getItem(ACCENT_KEY)).toBe('emerald')
  })
})