import { apiRequest } from '../../../helpers/apiHelper'

// ----- Publik -----
export const getCategories = () => apiRequest('/public/categories', { auth: false })

export function getPublicPosts({ q = '', category = '' } = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (category) params.set('category', category)
  const query = params.toString()
  return apiRequest(`/public/posts${query ? `?${query}` : ''}`, { auth: false })
}

export const getPublicPost = (slug) =>
  apiRequest(`/public/posts/${encodeURIComponent(slug)}`, { auth: false })

// ----- Penulis -----
export const getMyPosts = () => apiRequest('/posts')

export const getMyPost = (id) => apiRequest(`/posts/${id}`)

export const getPostStats = () => apiRequest('/posts/stats')

export const createPost = (payload) => apiRequest('/posts', { method: 'POST', body: payload })

export const updatePost = (id, payload) => apiRequest(`/posts/${id}`, { method: 'PUT', body: payload })

export const togglePublish = (id) => apiRequest(`/posts/${id}/toggle-publish`, { method: 'PATCH' })

export const deletePost = (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' })

export const generatePost = (payload) =>
  apiRequest('/posts/ai-generate', { method: 'POST', body: payload })