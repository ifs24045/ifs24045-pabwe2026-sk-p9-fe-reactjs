import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  API_BASE,
  ApiError,
  TOKEN_KEY,
  USER_KEY,
  apiRequest,
  clearSession,
  getToken,
  getUser,
  setSession,
} from './apiHelper'

function reply(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

function mockFetch(response) {
  const fn = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ApiError', () => {
  it('menyimpan pesan, nama, dan status', () => {
    const err = new ApiError('gagal', 404)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('gagal')
    expect(err.status).toBe(404)
  })

  it('status default 0', () => {
    expect(new ApiError('x').status).toBe(0)
  })
})

describe('session', () => {
  it('menyimpan, membaca, dan menghapus token & user', () => {
    expect(getToken()).toBeNull()
    expect(getUser()).toBeNull()

    setSession('abc', { id: 1, username: 'budi' })
    expect(getToken()).toBe('abc')
    expect(getUser()).toEqual({ id: 1, username: 'budi' })

    clearSession()
    expect(getToken()).toBeNull()
    expect(getUser()).toBeNull()
  })

  it('getUser mengembalikan null jika JSON rusak', () => {
    localStorage.setItem(USER_KEY, '{rusak')
    expect(getUser()).toBeNull()
  })

  it('memakai kunci penyimpanan yang benar', () => {
    setSession('t', { a: 1 })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('t')
  })
})

describe('apiRequest', () => {
  it('GET tanpa opsi dan tanpa token', async () => {
    const fetchMock = mockFetch(reply({ status: 'success', message: 'ok', data: [1] }))

    const result = await apiRequest('/public/posts')

    expect(result.data).toEqual([1])
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/public/posts`, {
      method: 'GET',
      headers: {},
      body: undefined,
    })
  })

  it('GET dengan token menyuntikkan header Authorization', async () => {
    setSession('token-123', { id: 1 })
    const fetchMock = mockFetch(reply({ status: 'success', message: 'ok' }))

    await apiRequest('/posts')

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer token-123' })
  })

  it('POST dengan body mengirim JSON dan Content-Type', async () => {
    const fetchMock = mockFetch(reply({ status: 'success', message: 'dibuat' }, 201))

    await apiRequest('/posts', { method: 'POST', body: { title: 'Halo' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.body).toBe(JSON.stringify({ title: 'Halo' }))
  })

  it('auth: false tidak mengirim token walau tersimpan', async () => {
    setSession('token-123', { id: 1 })
    const fetchMock = mockFetch(reply({ status: 'success', message: 'ok' }))

    await apiRequest('/auth/login', { method: 'POST', body: { a: 1 }, auth: false })

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('melempar ApiError dengan pesan dari server', async () => {
    mockFetch(reply({ status: 'fail', message: 'Username atau password salah' }, 401))

    await expect(apiRequest('/auth/login')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Username atau password salah',
      status: 401,
    })
  })

  it('pesan cadangan jika respons bukan JSON', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('bukan json')
      },
    })

    await expect(apiRequest('/posts')).rejects.toMatchObject({
      message: 'Permintaan gagal (500)',
      status: 500,
    })
  })

  it('pesan cadangan jika payload tidak punya message', async () => {
    mockFetch(reply({ status: 'error' }, 500))

    await expect(apiRequest('/posts')).rejects.toMatchObject({ message: 'Permintaan gagal (500)' })
  })

  it('melempar error jika HTTP 200 tetapi status bukan success', async () => {
    mockFetch(reply({ status: 'fail', message: 'Ditolak' }, 200))

    await expect(apiRequest('/posts')).rejects.toMatchObject({ message: 'Ditolak', status: 200 })
  })

  it('melempar error jika HTTP 200 tetapi isi bukan JSON', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('kosong')
      },
    })

    await expect(apiRequest('/posts')).rejects.toMatchObject({ message: 'Permintaan gagal (200)' })
  })

  it('melempar ApiError saat server tidak terjangkau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))

    await expect(apiRequest('/posts')).rejects.toMatchObject({
      message: 'Tidak dapat terhubung ke server',
      status: 0,
    })
  })
})