import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import useTheme from './hooks/useTheme'
import { clearSession, getToken, getUser } from './helpers/apiHelper'
import { getProfile, logout } from './features/auth/api/authApi'
import AuthPage from './features/auth/components/AuthPage'
import AuthModal from './features/auth/modals/AuthModal'
import StickyNavbar from './features/blog/components/StickyNavbar'
import PublicArticleList from './features/blog/components/PublicArticleList'
const PublicArticleDetail = lazy(() => import('./features/blog/components/PublicArticleDetail'))
const AuthorDashboard = lazy(() => import('./features/blog/components/AuthorDashboard'))
const AdminDashboard = lazy(() => import('./features/admin/components/AdminDashboard'))

const STATIC_ROUTES = {
  '/': 'home',
  '/public': 'home',
  '/login': 'login',
  '/register': 'register',
  '/author': 'author',
  '/admin': 'admin',
}

function resolveRoute(path) {
  const name = STATIC_ROUTES[path]
  if (name) return { name }

  const match = path.match(/^\/posts\/([^/]+)$/)
  if (match) return { name: 'post', slug: match[1] }

  return { name: 'notfound' }
}

const homeFor = (user) => (user.role === 'admin' ? '/admin' : '/author')

/** Menentukan apakah path harus dialihkan berdasarkan status login dan role. */
function getRedirect(path, user) {
  if ((path === '/author' || path === '/admin') && !user) return '/login'
  if (path === '/admin' && user.role !== 'admin') return '/author'
  if ((path === '/login' || path === '/register') && user) return homeFor(user)
  return null
}

function NotFound({ onNavigate }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Halaman yang Anda cari tidak ditemukan.</p>
      <a
        href="/"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/')
        }}
        className="mt-6 inline-block font-medium text-brand-600 hover:underline dark:text-brand-500"
      >
        Kembali ke beranda
      </a>
    </main>
  )
}

export default function App() {
  const { isDark, accent, setAccent, toggleTheme } = useTheme()
  const [path, setPath] = useState(() => window.location.pathname)
  const [user, setUser] = useState(() => (getToken() ? getUser() : null))
  const [authOpen, setAuthOpen] = useState(false)

  const redirect = getRedirect(path, user)
  const route = resolveRoute(redirect ?? path)
  const hideNavbar = route.name === 'login' || route.name === 'register'

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to)
    setPath(to)
    setAuthOpen(false)
  }, [])

  const openAuth = useCallback(() => setAuthOpen(true), [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])

  // Tombol back/forward peramban
  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname)
      setAuthOpen(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Sinkronkan URL peramban dengan hasil pengalihan (guard)
  useEffect(() => {
    if (redirect) window.history.replaceState({}, '', redirect)
  }, [redirect])

  // Pulihkan sesi saat refresh: validasi token ke server
  useEffect(() => {
    if (!getToken()) return undefined

    let active = true
    async function validate() {
      try {
        const res = await getProfile()
        if (active) setUser(res.data)
      } catch {
        if (active) {
          clearSession()
          setUser(null)
        }
      }
    }
    validate()
    return () => {
      active = false
    }
  }, [])

  const handleAuthenticated = useCallback(
    (authUser) => {
      setUser(authUser)
      setAuthOpen(false)
      navigate(homeFor(authUser))
    },
    [navigate],
  )

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // token mungkin sudah kedaluwarsa; sesi lokal tetap dibersihkan
    }
    clearSession()
    setUser(null)
    navigate('/')
  }

  let page
  switch (route.name) {
    case 'home':
      page = <PublicArticleList onNavigate={navigate} />
      break
    case 'post':
      page = <PublicArticleDetail slug={route.slug} onNavigate={navigate} />
      break
    case 'login':
    case 'register':
      page = (
        <AuthPage
          key={route.name}
          mode={route.name}
          onAuthenticated={handleAuthenticated}
          onNavigate={navigate}
        />
      )
      break
    case 'author':
      page = <AuthorDashboard user={user} isDark={isDark} onNavigate={navigate} />
      break
    case 'admin':
      page = <AdminDashboard />
      break
    default:
      page = <NotFound onNavigate={navigate} />
  }

  return (
    <div className="min-h-screen">
      {!hideNavbar && (
        <StickyNavbar
          user={user}
          isDark={isDark}
          accent={accent}
          onAccentChange={setAccent}
          onToggleTheme={toggleTheme}
          onNavigate={navigate}
          onLoginClick={openAuth}
          onLogout={handleLogout}
        />
      )}
      <Suspense
        fallback={
          <p role="status" className="py-24 text-center text-slate-600 dark:text-slate-400">
            Memuat halaman...
          </p>
        }
      >
        {page}
      </Suspense>
      {authOpen && <AuthModal onClose={closeAuth} onAuthenticated={handleAuthenticated} onNavigate={navigate} />}
    </div>
  )
}