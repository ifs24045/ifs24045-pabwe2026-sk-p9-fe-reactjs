import { apiRequest } from '../../../helpers/apiHelper'

export const getAdminUsers = () => apiRequest('/admin/users')

export const getAdminPosts = () => apiRequest('/admin/posts')

export const getAdminUserPosts = (id) => apiRequest(`/admin/users/${id}/posts`)