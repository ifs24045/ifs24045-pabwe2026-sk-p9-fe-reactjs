export const API_BASE = '/api'
export const TOKEN_KEY = 'delcom_blog_token'
export const USER_KEY = 'delcom_blog_user'

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Wrapper fetch terpusat. Mengembalikan payload standar {status, message, data}
 * dan melempar ApiError jika permintaan gagal.
 */
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server', 0)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || !payload || payload.status !== 'success') {
    throw new ApiError(payload?.message || `Permintaan gagal (${response.status})`, response.status)
  }
  return payload
}