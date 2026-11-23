import { useEffect, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import useInput from '../../../hooks/useInput'
import { setSession } from '../../../helpers/apiHelper'
import { showErrorAlert } from '../../../helpers/toolsHelper'
import { login } from '../api/authApi'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

export default function AuthModal({ onClose, onAuthenticated, onNavigate }) {
  const [username, onUsernameChange, , resetUsername] = useInput()
  const [password, onPasswordChange, , resetPassword] = useInput()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  function goRegister(event) {
    event.preventDefault()
    onClose()
    onNavigate('/register')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(username, password)
      setSession(data.token, data.user)
      resetUsername()
      resetPassword()
      onAuthenticated(data.user)
    } catch (error) {
      showErrorAlert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-testid="auth-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between bg-brand-600 px-5 py-4 text-white">
          <h2 id="auth-modal-title" className="text-lg font-semibold">
            Masuk ke Delcom Blog
          </h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded p-1 hover:bg-white/20">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div>
              <label htmlFor="login-username" className="mb-1 block text-sm font-medium">
                Username atau Email
              </label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={onUsernameChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={onPasswordChange}
                className={inputClass}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Belum punya akun?{' '}
              <a
                href="/register"
                onClick={goRegister}
                className="font-medium text-brand-600 hover:underline dark:text-brand-500"
              >
                Daftar sekarang
              </a>
            </p>
          </div>

          <div className="flex justify-end gap-2 bg-slate-100 px-5 py-3 dark:bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}