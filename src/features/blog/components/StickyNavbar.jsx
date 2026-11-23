import { useState } from 'react'
import { IconArticle, IconMenu2, IconMoon, IconSun, IconX } from '@tabler/icons-react'
import { ACCENTS } from '../../../hooks/useTheme'

const ACCENT_DOT = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
}

const linkClass =
  'rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'

export default function StickyNavbar({
  user = null,
  isDark = false,
  accent = 'indigo',
  onAccentChange,
  onToggleTheme,
  onNavigate,
  onLoginClick,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (path) => (event) => {
    event.preventDefault()
    setMenuOpen(false)
    onNavigate(path)
  }

  const run = (action) => () => {
    setMenuOpen(false)
    action()
  }

  const links = [{ path: '/', label: 'Beranda' }]
  if (user) links.push({ path: '/author', label: 'Workspace' })
  if (user?.role === 'admin') links.push({ path: '/admin', label: 'Admin' })

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <a href="/" onClick={go('/')} className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <IconArticle size={18} />
          </span>
          Delcom Blog
        </a>

        <button
          type="button"
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
        >
          {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
        </button>

        <nav
          aria-label="Navigasi utama"
          className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-2 md:flex md:w-auto md:flex-row md:items-center`}
        >
          {links.map(({ path, label }) => (
            <a key={path} href={path} onClick={go(path)} className={linkClass}>
              {label}
            </a>
          ))}

          <div role="group" aria-label="Warna aksen" className="flex items-center gap-1.5 px-2">
            {ACCENTS.map((name) => (
              <button
                key={name}
                type="button"
                aria-label={`Aksen ${name}`}
                aria-pressed={name === accent}
                onClick={() => onAccentChange(name)}
                className={`h-5 w-5 rounded-full ${ACCENT_DOT[name]} ${
                  name === accent ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white' : ''
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label={isDark ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
            onClick={onToggleTheme}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>

          {user ? (
            <>
              <span className="px-2 text-sm text-slate-500 dark:text-slate-400">Halo, {user.username}</span>
              <button type="button" onClick={run(onLogout)} className={linkClass}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={run(onLoginClick)} className={linkClass}>
                Masuk
              </button>
              <a
                href="/register"
                onClick={go('/register')}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Daftar
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}