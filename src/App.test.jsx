import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getProfile, logout } from './features/auth/api/authApi'
import { USER_KEY, getToken, setSession } from './helpers/apiHelper'

vi.mock('./features/auth/api/authApi', () => ({ getProfile: vi.fn(), logout: vi.fn() }))

vi.mock('./features/blog/components/StickyNavbar', () => ({
  default: ({ user, isDark, accent, onAccentChange, onToggleTheme, onNavigate, onLoginClick, onLogout }) => (
    <nav
      data-testid="navbar"
      data-user={user ? user.username : 'tamu'}
      data-dark={String(isDark)}
      data-accent={accent}
    >
      <button onClick={() => onNavigate('/')}>nav-beranda</button>
      <button onClick={onLoginClick}>nav-masuk</button>
      <button onClick={onLogout}>nav-keluar</button>
      <button onClick={onToggleTheme}>nav-tema</button>
      <button onClick={() => onAccentChange('rose')}>nav-aksen</button>
    </nav>
  ),
}))

vi.mock('./features/blog/components/PublicArticleList', () => ({
  default: ({ onNavigate }) => (
    <div data-testid="page-home">
      <button onClick={() => onNavigate('/posts/go-dasar')}>buka-artikel</button>
    </div>
  ),
}))

vi.mock('./features/blog/components/PublicArticleDetail', () => ({
  default: ({ slug, onNavigate }) => (
    <div data-testid="page-post">
      <span>{slug}</span>
      <button onClick={() => onNavigate('/')}>kembali</button>
    </div>
  ),
}))

vi.mock('./features/blog/components/AuthorDashboard', () => ({
  default: ({ user, isDark }) => (
    <div data-testid="page-author" data-user={user.username} data-dark={String(isDark)} />
  ),
}))

vi.mock('./features/admin/components/AdminDashboard', () => ({
  default: () => <div data-testid="page-admin" />,
}))

vi.mock('./features/auth/components/AuthPage', () => ({
  default: ({ mode, onAuthenticated, onNavigate }) => (
    <div data-testid={`page-${mode}`}>
      <button onClick={() => onAuthenticated({ id: 2, username: 'budi', role: 'member' })}>auth-anggota</button>
      <button onClick={() => onAuthenticated({ id: 1, username: 'pak_admin', role: 'admin' })}>auth-admin</button>
      <button onClick={() => onNavigate('/register')}>ke-register</button>
    </div>
  ),
}))

vi.mock('./features/auth/modals/AuthModal', () => ({
  default: ({ onClose, onAuthenticated, onNavigate }) => (
    <div data-testid="auth-modal">
      <button onClick={onClose}>tutup-modal</button>
      <button onClick={() => onAuthenticated({ id: 2, username: 'budi', role: 'member' })}>modal-login</button>
      <button
        onClick={() => {
          onClose()
          onNavigate('/register')
        }}
      >
        modal-register
      </button>
    </div>
  ),
}))

const member = { id: 2, username: 'budi', role: 'member' }
const admin = { id: 1, username: 'pak_admin', role: 'admin' }

function loginAs(account) {
  setSession('token-123', account)
  getProfile.mockResolvedValue({ data: account })
}

function renderAt(path) {
  window.history.replaceState({}, '', path)
  const user = userEvent.setup()
  return { user, ...render(<App />) }
}

beforeEach(() => {
  vi.clearAllMocks()
  getProfile.mockResolvedValue({ data: member })
  logout.mockResolvedValue({})
  window.history.replaceState({}, '', '/')
})

describe('rute publik', () => {
  it('menampilkan beranda di "/" untuk tamu', () => {
    renderAt('/')

    expect(screen.getByTestId('page-home')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-user', 'tamu')
    expect(getProfile).not.toHaveBeenCalled()
  })

  it('"/public" juga menampilkan beranda', () => {
    renderAt('/public')

    expect(screen.getByTestId('page-home')).toBeInTheDocument()
  })

  it('menampilkan detail artikel di "/posts/:slug"', async () => {
    renderAt('/posts/go-dasar')

    expect(await screen.findByTestId('page-post')).toHaveTextContent('go-dasar')
  })

  it('menampilkan 404 untuk path tidak dikenal dan bisa kembali ke beranda', async () => {
    const { user } = renderAt('/tidak-ada')

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Kembali ke beranda' }))

    expect(screen.getByTestId('page-home')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('navigasi memperbarui URL lewat pushState', async () => {
    const { user } = renderAt('/')

    await user.click(screen.getByRole('button', { name: 'buka-artikel' }))
    expect(await screen.findByTestId('page-post')).toHaveTextContent('go-dasar')
    expect(window.location.pathname).toBe('/posts/go-dasar')

    await user.click(screen.getByRole('button', { name: 'kembali' }))
    expect(screen.getByTestId('page-home')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('tombol back/forward (popstate) mengikuti URL dan menutup modal login', async () => {
    const { user } = renderAt('/')
    await user.click(screen.getByRole('button', { name: 'nav-masuk' }))
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument()

    act(() => {
      window.history.pushState({}, '', '/posts/lain')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(await screen.findByTestId('page-post')).toHaveTextContent('lain')
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
  })
})

describe('halaman autentikasi', () => {
  it('"/login" menampilkan AuthPage tanpa navbar', () => {
    renderAt('/login')

    expect(screen.getByTestId('page-login')).toBeInTheDocument()
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
  })

  it('"/register" menampilkan mode registrasi dan bisa dicapai dari halaman login', async () => {
    const { user } = renderAt('/login')

    await user.click(screen.getByRole('button', { name: 'ke-register' }))

    expect(screen.getByTestId('page-register')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/register')
  })

  it('login anggota dari halaman login membuka workspace penulis', async () => {
    const { user } = renderAt('/login')

    await user.click(screen.getByRole('button', { name: 'auth-anggota' }))

    expect(await screen.findByTestId('page-author')).toHaveAttribute('data-user', 'budi')
    expect(window.location.pathname).toBe('/author')
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-user', 'budi')
  })

  it('login admin membuka panel admin', async () => {
    const { user } = renderAt('/login')

    await user.click(screen.getByRole('button', { name: 'auth-admin' }))

    expect(await screen.findByTestId('page-admin')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/admin')
  })

  it('modal login: buka, tutup, lalu login', async () => {
    const { user } = renderAt('/')

    await user.click(screen.getByRole('button', { name: 'nav-masuk' }))
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'tutup-modal' }))
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'nav-masuk' }))
    await user.click(screen.getByRole('button', { name: 'modal-login' }))

    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
    expect(await screen.findByTestId('page-author')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/author')
  })

  it('tautan daftar di modal menutup modal dan membuka halaman registrasi', async () => {
    const { user } = renderAt('/')

    await user.click(screen.getByRole('button', { name: 'nav-masuk' }))
    await user.click(screen.getByRole('button', { name: 'modal-register' }))

    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('page-register')).toBeInTheDocument()
  })
})

describe('guard akses', () => {
  it.each(['/author', '/admin'])('tamu di %s diarahkan ke /login', (path) => {
    renderAt(path)

    expect(screen.getByTestId('page-login')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('anggota membuka /author langsung', async () => {
    loginAs(member)
    renderAt('/author')

    expect(await screen.findByTestId('page-author')).toHaveAttribute('data-user', 'budi')
    expect(window.location.pathname).toBe('/author')
  })

  it('anggota di /admin diarahkan ke /author', async () => {
    loginAs(member)
    renderAt('/admin')

    expect(await screen.findByTestId('page-author')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/author')
  })

  it('admin membuka /admin langsung', async () => {
    loginAs(admin)
    renderAt('/admin')

    expect(await screen.findByTestId('page-admin')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/admin')
  })

  it.each(['/login', '/register'])('anggota yang sudah login di %s diarahkan ke /author', async (path) => {
    loginAs(member)
    renderAt(path)

    expect(await screen.findByTestId('page-author')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/author')
  })

  it('admin yang sudah login di /login diarahkan ke /admin', async () => {
    loginAs(admin)
    renderAt('/login')

    expect(await screen.findByTestId('page-admin')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/admin')
  })
})

describe('sesi', () => {
  it('memulihkan sesi dari localStorage lalu menyegarkan data dari server', async () => {
    loginAs(member)
    getProfile.mockResolvedValue({ data: { ...member, username: 'budi-baru' } })
    renderAt('/')

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-user', 'budi')
    await waitFor(() => expect(screen.getByTestId('navbar')).toHaveAttribute('data-user', 'budi-baru'))
  })

  it('token kedaluwarsa: sesi dibersihkan dan pengguna menjadi tamu', async () => {
    loginAs(member)
    getProfile.mockRejectedValue(new Error('Token tidak valid'))
    renderAt('/author')

    expect(await screen.findByTestId('page-login')).toBeInTheDocument()
    expect(getToken()).toBeNull()
    expect(window.location.pathname).toBe('/login')
  })

  it('data user tanpa token dianggap tamu dan tidak memanggil server', () => {
    localStorage.setItem(USER_KEY, JSON.stringify(member))
    renderAt('/')

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-user', 'tamu')
    expect(getProfile).not.toHaveBeenCalled()
  })

  it('mengabaikan validasi sesi yang berhasil setelah komponen dilepas', async () => {
    loginAs(member)
    let resolveProfile
    getProfile.mockReturnValue(new Promise((resolve) => (resolveProfile = resolve)))
    const { unmount } = renderAt('/')

    unmount()
    await act(async () => {
      resolveProfile({ data: { ...member, username: 'x' } })
    })

    expect(getProfile).toHaveBeenCalledTimes(1)
  })

  it('mengabaikan validasi sesi yang gagal setelah komponen dilepas', async () => {
    loginAs(member)
    let rejectProfile
    getProfile.mockReturnValue(new Promise((_, reject) => (rejectProfile = reject)))
    const { unmount } = renderAt('/')

    unmount()
    await act(async () => {
      rejectProfile(new Error('gagal'))
    })

    expect(getToken()).toBe('token-123')
  })
})

describe('logout', () => {
  it('memanggil API, membersihkan sesi, dan kembali ke beranda', async () => {
    loginAs(member)
    const { user } = renderAt('/author')
    await screen.findByTestId('page-author')

    await user.click(screen.getByRole('button', { name: 'nav-keluar' }))

    expect(await screen.findByTestId('page-home')).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(getToken()).toBeNull()
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-user', 'tamu')
    expect(window.location.pathname).toBe('/')
  })

  it('tetap membersihkan sesi lokal walau API logout gagal', async () => {
    loginAs(member)
    logout.mockRejectedValue(new Error('Token tidak valid'))
    const { user } = renderAt('/author')
    await screen.findByTestId('page-author')

    await user.click(screen.getByRole('button', { name: 'nav-keluar' }))

    expect(await screen.findByTestId('page-home')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})

describe('tema', () => {
  it('tombol tema dan aksen meneruskan perubahan ke seluruh aplikasi', async () => {
    loginAs(member)
    const { user } = renderAt('/author')
    await screen.findByTestId('page-author')

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-dark', 'false')

    await user.click(screen.getByRole('button', { name: 'nav-tema' }))
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-dark', 'true')
    expect(await screen.findByTestId('page-author')).toHaveAttribute('data-dark', 'true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'nav-aksen' }))
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-accent', 'rose')
    expect(document.documentElement.dataset.accent).toBe('rose')
  })
})