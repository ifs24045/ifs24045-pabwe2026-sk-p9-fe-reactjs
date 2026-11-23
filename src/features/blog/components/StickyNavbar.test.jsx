import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StickyNavbar from './StickyNavbar'

const member = { id: 2, username: 'budi', role: 'member' }
const admin = { id: 1, username: 'admin', role: 'admin' }

function setup(props = {}) {
  const handlers = {
    onAccentChange: vi.fn(),
    onToggleTheme: vi.fn(),
    onNavigate: vi.fn(),
    onLoginClick: vi.fn(),
    onLogout: vi.fn(),
  }
  const user = userEvent.setup()
  render(<StickyNavbar {...handlers} {...props} />)
  return { user, ...handlers }
}

describe('StickyNavbar tampilan', () => {
  it('tamu dengan props default', () => {
    render(<StickyNavbar />)

    expect(screen.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Workspace' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Daftar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Keluar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beralih ke tema gelap' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aksen indigo' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Aksen rose' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('anggota melihat Workspace dan tombol Keluar, tanpa menu Admin', () => {
    setup({ user: member })

    expect(screen.getByRole('link', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(screen.getByText('Halo, budi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Masuk' })).not.toBeInTheDocument()
  })

  it('admin melihat menu Admin', () => {
    setup({ user: admin })

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Workspace' })).toBeInTheDocument()
  })

  it('menampilkan tombol tema terang saat mode gelap aktif', () => {
    setup({ isDark: true })

    expect(screen.getByRole('button', { name: 'Beralih ke tema terang' })).toBeInTheDocument()
  })

  it('menandai aksen yang sedang aktif', () => {
    setup({ accent: 'emerald' })

    expect(screen.getByRole('button', { name: 'Aksen emerald' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Aksen indigo' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('StickyNavbar interaksi', () => {
  it('tautan memanggil onNavigate dengan path yang benar', async () => {
    const { user, onNavigate } = setup({ user: admin })

    await user.click(screen.getByRole('link', { name: 'Delcom Blog' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/')

    await user.click(screen.getByRole('link', { name: 'Beranda' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/')

    await user.click(screen.getByRole('link', { name: 'Workspace' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/author')

    await user.click(screen.getByRole('link', { name: 'Admin' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/admin')
  })

  it('tautan Daftar mengarah ke /register', async () => {
    const { user, onNavigate } = setup()

    await user.click(screen.getByRole('link', { name: 'Daftar' }))

    expect(onNavigate).toHaveBeenCalledWith('/register')
  })

  it('tombol Masuk dan Keluar memanggil handler masing-masing', async () => {
    const guest = setup()
    await guest.user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(guest.onLoginClick).toHaveBeenCalledTimes(1)
  })

  it('tombol Keluar memanggil onLogout', async () => {
    const { user, onLogout } = setup({ user: member })

    await user.click(screen.getByRole('button', { name: 'Keluar' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('tombol tema dan aksen memanggil handler', async () => {
    const { user, onToggleTheme, onAccentChange } = setup()

    await user.click(screen.getByRole('button', { name: 'Beralih ke tema gelap' }))
    expect(onToggleTheme).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Aksen rose' }))
    expect(onAccentChange).toHaveBeenCalledWith('rose')
  })

  it('menu hamburger membuka, menutup, dan menutup otomatis saat navigasi', async () => {
    const { user } = setup()

    const open = screen.getByRole('button', { name: 'Buka menu' })
    expect(open).toHaveAttribute('aria-expanded', 'false')

    await user.click(open)
    const close = screen.getByRole('button', { name: 'Tutup menu' })
    expect(close).toHaveAttribute('aria-expanded', 'true')

    await user.click(close)
    expect(screen.getByRole('button', { name: 'Buka menu' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Buka menu' }))
    await user.click(screen.getByRole('link', { name: 'Beranda' }))
    expect(screen.getByRole('button', { name: 'Buka menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})