import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import {
  createPost,
  deletePost,
  generatePost,
  getCategories,
  getMyPost,
  getMyPosts,
  getPostStats,
  getPublicPost,
  getPublicPosts,
  togglePublish,
  updatePost,
} from './blogApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

const ok = { status: 'success', message: 'ok', data: [] }

beforeEach(() => {
  apiRequest.mockReset()
  apiRequest.mockResolvedValue(ok)
})

describe('blogApi publik', () => {
  it('getCategories', async () => {
    await expect(getCategories()).resolves.toBe(ok)
    expect(apiRequest).toHaveBeenCalledWith('/public/categories', { auth: false })
  })

  it('getPublicPosts tanpa argumen tidak memakai query', async () => {
    await getPublicPosts()
    expect(apiRequest).toHaveBeenCalledWith('/public/posts', { auth: false })
  })

  it('getPublicPosts dengan kata kunci saja', async () => {
    await getPublicPosts({ q: '  golang ' })
    expect(apiRequest).toHaveBeenCalledWith('/public/posts?q=golang', { auth: false })
  })

  it('getPublicPosts dengan kategori saja', async () => {
    await getPublicPosts({ category: 'Gaya Hidup' })
    expect(apiRequest).toHaveBeenCalledWith('/public/posts?category=Gaya+Hidup', { auth: false })
  })

  it('getPublicPosts dengan kata kunci dan kategori', async () => {
    await getPublicPosts({ q: 'go', category: 'Teknologi' })
    expect(apiRequest).toHaveBeenCalledWith('/public/posts?q=go&category=Teknologi', { auth: false })
  })

  it('getPublicPosts mengabaikan kata kunci yang hanya spasi', async () => {
    await getPublicPosts({ q: '   ' })
    expect(apiRequest).toHaveBeenCalledWith('/public/posts', { auth: false })
  })

  it('getPublicPost meng-encode slug', async () => {
    await getPublicPost('halo dunia')
    expect(apiRequest).toHaveBeenCalledWith('/public/posts/halo%20dunia', { auth: false })
  })
})

describe('blogApi penulis', () => {
  it('getMyPosts, getMyPost, dan getPostStats memakai GET', async () => {
    await getMyPosts()
    expect(apiRequest).toHaveBeenLastCalledWith('/posts')

    await getMyPost(7)
    expect(apiRequest).toHaveBeenLastCalledWith('/posts/7')

    await getPostStats()
    expect(apiRequest).toHaveBeenLastCalledWith('/posts/stats')
  })

  it('createPost memakai POST', async () => {
    await createPost({ title: 'Halo' })
    expect(apiRequest).toHaveBeenCalledWith('/posts', { method: 'POST', body: { title: 'Halo' } })
  })

  it('updatePost memakai PUT', async () => {
    await updatePost(7, { title: 'Baru' })
    expect(apiRequest).toHaveBeenCalledWith('/posts/7', { method: 'PUT', body: { title: 'Baru' } })
  })

  it('togglePublish memakai PATCH', async () => {
    await togglePublish(7)
    expect(apiRequest).toHaveBeenCalledWith('/posts/7/toggle-publish', { method: 'PATCH' })
  })

  it('deletePost memakai DELETE', async () => {
    await deletePost(7)
    expect(apiRequest).toHaveBeenCalledWith('/posts/7', { method: 'DELETE' })
  })

  it('generatePost memanggil endpoint AI', async () => {
    await generatePost({ topic: 'Go', include_web_search: true })
    expect(apiRequest).toHaveBeenCalledWith('/posts/ai-generate', {
      method: 'POST',
      body: { topic: 'Go', include_web_search: true },
    })
  })
})