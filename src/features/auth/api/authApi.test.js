import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import { getProfile, login, logout, register, updateProfile } from './authApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

const ok = { status: 'success', message: 'ok', data: {} }

beforeEach(() => {
  apiRequest.mockReset()
  apiRequest.mockResolvedValue(ok)
})

describe('authApi', () => {
  it('login mengirim kredensial tanpa token', async () => {
    await expect(login('budi', 'rahasia123')).resolves.toBe(ok)
    expect(apiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'rahasia123' },
      auth: false,
    })
  })

  it('register mengirim data akun baru tanpa token', async () => {
    await register('budi', 'budi@mail.com', 'rahasia123')
    expect(apiRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { username: 'budi', email: 'budi@mail.com', password: 'rahasia123' },
      auth: false,
    })
  })

  it('logout memakai POST', async () => {
    await logout()
    expect(apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
  })

  it('getProfile memakai GET default', async () => {
    await getProfile()
    expect(apiRequest).toHaveBeenCalledWith('/auth/profile')
  })

  it('updateProfile memakai PUT', async () => {
    await updateProfile({ username: 'budi', email: 'budi@mail.com' })
    expect(apiRequest).toHaveBeenCalledWith('/auth/profile', {
      method: 'PUT',
      body: { username: 'budi', email: 'budi@mail.com' },
    })
  })
})