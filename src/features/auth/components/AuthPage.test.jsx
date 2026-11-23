import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPage from './AuthPage'
import { login, register } from '../api/authApi'
import { setSession } from '../../../helpers/apiHelper'
import { showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'

vi.mock('../api/authApi', () => ({ login: vi.fn(), register: vi.fn() }))
vi.mock('../../../helpers/apiHelper', () => ({ setSession: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({
  showErrorAlert: vi.fn(),
  showSuccessAlert: vi.fn(),
}))

const sessionUser = { id: 1, username: 'budi', role: 'member' }

beforeEach(() => {
  vi.clearAllMocks()
})

function setup(props = {}) {
  const handlers = { onAuthenticated: vi.fn(), onNavigate: vi.fn() }
  const user = userEvent.setup()
  render(<AuthPage {...handlers} {...props} />)
  return { user, ...handlers }
}

async function fillLogin(user) {
  await user.type(screen.getByLabelText('Username atau Email'), 'budi')
  await user.type(screen.getByLabelText('Password'), 'rahasia123')
}

async function fillRegister(user) {
  await user.type(screen.getByLabelText('Username'), 'budi')
  await user.type(screen.getByLabelText('Email'), 'budi@mail.com')
  await user.type(screen.getByLabelText('Password'), 'rahasia123')
}

describe('AuthPage mode login (default)', () => {
  it('menampilkan form login dengan id wajib', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Masuk ke Delcom Blog' })).toBeInTheDocument()
    expect(document.getElementById('login-username')).toBeInTheDocument()
    expect(document.getElementById('login-password')).toBeInTheDocument()
    expect(document.getElementById('login-submit')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  it('login berhasil menyimpan sesi dan memanggil onAuthenticated', async () => {
    login.mockResolvedValue({ data: { token: 'tok', user: sessionUser } })
    const { user, onAuthenticated } = setup()

    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(sessionUser))
    expect(login).toHaveBeenCalledWith('budi', 'rahasia123')
    expect(setSession).toHaveBeenCalledWith('tok', sessionUser)
  })

  it('login gagal menampilkan pesan error', async () => {
    login.mockRejectedValue(new Error('Username atau password salah'))
    const { user, onAuthenticated } = setup()

    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Username atau password salah'))
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(setSession).not.toHaveBeenCalled()
  })

  it('tombol nonaktif dengan teks "Memproses..." selama permintaan berjalan', async () => {
    let resolveLogin
    login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      }),
    )
    const { user, onAuthenticated } = setup()

    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('button', { name: 'Memproses...' })).toBeDisabled()

    await act(async () => {
      resolveLogin({ data: { token: 't', user: sessionUser } })
    })

    expect(await screen.findByRole('button', { name: 'Masuk' })).toBeEnabled()
    expect(onAuthenticated).toHaveBeenCalledWith(sessionUser)
  })

  it('tautan mengarahkan ke register dan beranda', async () => {
    const { user, onNavigate } = setup()

    await user.click(screen.getByRole('link', { name: 'Daftar sekarang' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/register')

    await user.click(screen.getByRole('link', { name: 'Kembali ke beranda' }))
    expect(onNavigate).toHaveBeenLastCalledWith('/')
  })
})

describe('AuthPage mode register', () => {
  it('menampilkan form registrasi', () => {
    setup({ mode: 'register' })

    expect(screen.getByRole('heading', { name: 'Buat Akun Penulis' })).toBeInTheDocument()
    expect(document.getElementById('register-username')).toBeInTheDocument()
    expect(document.getElementById('register-email')).toBeInTheDocument()
    expect(document.getElementById('register-password')).toBeInTheDocument()
    expect(document.getElementById('register-submit')).toBeInTheDocument()
  })

  it('registrasi berhasil mengarahkan ke halaman login', async () => {
    register.mockResolvedValue({ status: 'success' })
    const { user, onNavigate } = setup({ mode: 'register' })

    await fillRegister(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('/login'))
    expect(register).toHaveBeenCalledWith('budi', 'budi@mail.com', 'rahasia123')
    expect(showSuccessAlert).toHaveBeenCalledWith('Registrasi berhasil, silakan login')
  })

  it('registrasi gagal menampilkan pesan error dan tidak berpindah halaman', async () => {
    register.mockRejectedValue(new Error('Email sudah digunakan'))
    const { user, onNavigate } = setup({ mode: 'register' })

    await fillRegister(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))

    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Email sudah digunakan'))
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('tautan mengarahkan ke halaman login', async () => {
    const { user, onNavigate } = setup({ mode: 'register' })

    await user.click(screen.getByRole('link', { name: 'Masuk di sini' }))

    expect(onNavigate).toHaveBeenCalledWith('/login')
  })
})