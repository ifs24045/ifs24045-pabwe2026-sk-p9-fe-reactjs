import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthModal from './AuthModal'
import { login } from '../api/authApi'
import { setSession } from '../../../helpers/apiHelper'
import { showErrorAlert } from '../../../helpers/toolsHelper'

vi.mock('../api/authApi', () => ({ login: vi.fn() }))
vi.mock('../../../helpers/apiHelper', () => ({ setSession: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({ showErrorAlert: vi.fn() }))

const sessionUser = { id: 1, username: 'budi', role: 'member' }

beforeEach(() => {
  vi.clearAllMocks()
})

function setup() {
  const handlers = { onClose: vi.fn(), onAuthenticated: vi.fn(), onNavigate: vi.fn() }
  const user = userEvent.setup()
  render(<AuthModal {...handlers} />)
  return { user, ...handlers }
}

async function fillForm(user) {
  await user.type(screen.getByLabelText('Username atau Email'), 'budi')
  await user.type(screen.getByLabelText('Password'), 'rahasia123')
}

describe('AuthModal', () => {
  it('menampilkan dialog dengan id form wajib', () => {
    setup()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(document.getElementById('login-username')).toBeInTheDocument()
    expect(document.getElementById('login-password')).toBeInTheDocument()
    expect(document.getElementById('login-submit')).toBeInTheDocument()
  })

  it('login berhasil menyimpan sesi, mengosongkan form, dan memanggil onAuthenticated', async () => {
    login.mockResolvedValue({ data: { token: 'tok', user: sessionUser } })
    const { user, onAuthenticated } = setup()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(sessionUser))
    expect(login).toHaveBeenCalledWith('budi', 'rahasia123')
    expect(setSession).toHaveBeenCalledWith('tok', sessionUser)
    expect(screen.getByLabelText('Username atau Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('login gagal menampilkan pesan error', async () => {
    login.mockRejectedValue(new Error('Username atau password salah'))
    const { user, onAuthenticated } = setup()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Username atau password salah'))
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Username atau Email')).toHaveValue('budi')
  })

  it('menutup lewat tombol Tutup dan Batal', async () => {
    const { user, onClose } = setup()

    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('menutup saat klik latar belakang, tetapi tidak saat klik di dalam dialog', () => {
    const { onClose } = setup()

    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.mouseDown(screen.getByTestId('auth-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('menutup dengan tombol Escape dan mengabaikan tombol lain', () => {
    const { onClose } = setup()

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('melepas listener keyboard saat unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(<AuthModal onClose={onClose} onAuthenticated={vi.fn()} onNavigate={vi.fn()} />)

    unmount()
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('tautan daftar menutup modal lalu membuka halaman register', async () => {
    const { user, onClose, onNavigate } = setup()

    await user.click(screen.getByRole('link', { name: 'Daftar sekarang' }))

    expect(onClose).toHaveBeenCalled()
    expect(onNavigate).toHaveBeenCalledWith('/register')
  })

  it('tombol menampilkan "Memproses..." selama login berjalan', async () => {
    login.mockReturnValue(new Promise(() => {}))
    const { user } = setup()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('button', { name: 'Memproses...' })).toBeDisabled()
  })
})