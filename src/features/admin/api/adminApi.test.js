import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import { getAdminPosts, getAdminUserPosts, getAdminUsers } from './adminApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

const ok = { status: 'success', message: 'ok', data: [] }

beforeEach(() => {
  apiRequest.mockReset()
  apiRequest.mockResolvedValue(ok)
})

describe('adminApi', () => {
  it('getAdminUsers', async () => {
    await expect(getAdminUsers()).resolves.toBe(ok)
    expect(apiRequest).toHaveBeenCalledWith('/admin/users')
  })

  it('getAdminPosts', async () => {
    await getAdminPosts()
    expect(apiRequest).toHaveBeenCalledWith('/admin/posts')
  })

  it('getAdminUserPosts', async () => {
    await getAdminUserPosts(3)
    expect(apiRequest).toHaveBeenCalledWith('/admin/users/3/posts')
  })
})