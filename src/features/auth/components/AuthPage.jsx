import { useState } from 'react'
import { IconArticle } from '@tabler/icons-react'
import useInput from '../../../hooks/useInput'
import { setSession } from '../../../helpers/apiHelper'
import { showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'
import { login, register } from '../api/authApi'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
const labelClass = 'mb-1 block text-sm font-medium'
const linkClass = 'font-medium text-brand-600 hover:underline dark:text-brand-500'

export default function AuthPage({ mode = 'login', onAuthenticated, onNavigate }) {
  const isLogin = mode === 'login'
  const prefix = isLogin ? 'login' : 'register'

  const [username, onUsernameChange] = useInput()
  const [email, onEmailChange] = useInput()
  const [password, onPasswordChange] = useInput()
  const [loading, setLoading] = useState(false)

  const go = (path) => (event) => {
    event.preventDefault()
    onNavigate(path)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        const { data } = await login(username, password)
        setSession(data.token, data.user)
        onAuthenticated(data.user)
      } else {
        await register(username, email, password)
        showSuccessAlert('Registrasi berhasil, silakan login')
        onNavigate('/login')
      }
    } catch (error) {
      showErrorAlert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <IconArticle size={26} />
          </span>
          <h1 className="text-2xl font-bold">{isLogin ? 'Masuk ke Delcom Blog' : 'Buat Akun Penulis'}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? 'Kelola dan tulis artikel Anda.' : 'Daftar untuk mulai menulis artikel.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`${prefix}-username`} className={labelClass}>
              {isLogin ? 'Username atau Email' : 'Username'}
            </label>
            <input
              id={`${prefix}-username`}
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={onUsernameChange}
              className={inputClass}
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="register-email" className={labelClass}>
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={onEmailChange}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor={`${prefix}-password`} className={labelClass}>
              Password
            </label>
            <input
              id={`${prefix}-password`}
              type="password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={onPasswordChange}
              className={inputClass}
            />
          </div>

          <button
            id={`${prefix}-submit`}
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isLogin ? (
            <>
              Belum punya akun?{' '}
              <a href="/register" onClick={go('/register')} className={linkClass}>
                Daftar sekarang
              </a>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <a href="/login" onClick={go('/login')} className={linkClass}>
                Masuk di sini
              </a>
            </>
          )}
        </p>
        <p className="mt-2 text-center text-sm">
          <a href="/" onClick={go('/')} className={linkClass}>
            Kembali ke beranda
          </a>
        </p>
      </div>
    </main>
  )
}