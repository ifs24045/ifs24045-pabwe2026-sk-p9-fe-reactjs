import { apiRequest } from '../../../helpers/apiHelper'

export const login = (username, password) =>
  apiRequest('/auth/login', { method: 'POST', body: { username, password }, auth: false })

export const register = (username, email, password) =>
  apiRequest('/auth/register', { method: 'POST', body: { username, email, password }, auth: false })

export const logout = () => apiRequest('/auth/logout', { method: 'POST' })

export const getProfile = () => apiRequest('/auth/profile')

export const updateProfile = (payload) => apiRequest('/auth/profile', { method: 'PUT', body: payload })