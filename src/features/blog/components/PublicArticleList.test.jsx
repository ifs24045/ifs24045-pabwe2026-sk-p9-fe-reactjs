import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicArticleList from './PublicArticleList'
import { getCategories, getPublicPosts } from '../api/blogApi'

vi.mock('../api/blogApi', () => ({
  getCategories: vi.fn(),
  getPublicPosts: vi.fn(),
}))

const posts = [
  {
    id: 1,
    slug: 'go-dasar',
    title: 'Go Dasar',
    category: 'Teknologi',
    excerpt: 'Belajar Go dari nol',
    author: { id: 1, username: 'andi' },
    published_at: '2026-03-15T12:00:00Z',
    reading_time: 3,
    cover_image_path: 'https://img.test/go.png',
  },
  {
    id: 2,
    slug: 'belajar-gizi',
    title: 'Belajar Gizi',
    category: 'Gaya Hidup',
    excerpt: 'Makan sehat setiap hari',
    author: { id: 2, username: 'budi' },
    published_at: '2026-03-16T12:00:00Z',
    reading_time: 1,
    cover_image_path: '',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  getCategories.mockResolvedValue({ data: ['Teknologi', 'Gaya Hidup'] })
  getPublicPosts.mockResolvedValue({ data: posts })
})

function setup() {
  const onNavigate = vi.fn()
  const user = userEvent.setup()
  const view = render(<PublicArticleList onNavigate={onNavigate} />)
  return { user, onNavigate, ...view }
}

describe('PublicArticleList', () => {
  it('menampilkan status memuat lalu daftar artikel', async () => {
    setup()

    expect(screen.getByRole('status')).toHaveTextContent('Memuat artikel...')

    expect(await screen.findByRole('link', { name: 'Go Dasar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Belajar Gizi' })).toBeInTheDocument()
    expect(screen.getByText('andi')).toBeInTheDocument()
    expect(screen.getByText('3 menit baca')).toBeInTheDocument()
    expect(screen.getByText('15 Maret 2026')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'Go Dasar' })).toBeInTheDocument()
    expect(getPublicPosts).toHaveBeenCalledWith({ q: '', category: '' })
  })

  it('menampilkan pill kategori dengan "Semua" aktif di awal', async () => {
    setup()

    expect(await screen.findByRole('button', { name: 'Teknologi' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Gaya Hidup' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semua' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('menampilkan pesan saat tidak ada artikel', async () => {
    getPublicPosts.mockResolvedValue({ data: [] })
    setup()

    expect(await screen.findByText('Belum ada artikel yang ditemukan.')).toBeInTheDocument()
  })

  it('menampilkan pesan error dari server', async () => {
    getPublicPosts.mockRejectedValue(new Error('Gagal memuat artikel'))
    setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat artikel')
  })

  it('tetap menampilkan artikel jika kategori gagal dimuat', async () => {
    getCategories.mockRejectedValue(new Error('kategori error'))
    setup()

    expect(await screen.findByRole('link', { name: 'Go Dasar' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Semua' })).toBeInTheDocument()
  })

  it('pencarian real-time memanggil API dengan kata kunci', async () => {
    const { user } = setup()
    await screen.findByRole('link', { name: 'Go Dasar' })

    await user.type(screen.getByRole('searchbox', { name: 'Cari artikel' }), 'go')

    await waitFor(() => expect(getPublicPosts).toHaveBeenLastCalledWith({ q: 'go', category: '' }))
  })

  it('klik kategori memfilter artikel dan "Semua" mengembalikannya', async () => {
    const { user } = setup()

    await user.click(await screen.findByRole('button', { name: 'Teknologi' }))
    await waitFor(() => expect(getPublicPosts).toHaveBeenLastCalledWith({ q: '', category: 'Teknologi' }))
    expect(screen.getByRole('button', { name: 'Teknologi' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Semua' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Semua' }))
    await waitFor(() => expect(getPublicPosts).toHaveBeenLastCalledWith({ q: '', category: '' }))
  })

  it('klik judul artikel membuka halaman detail', async () => {
    const { user, onNavigate } = setup()

    await user.click(await screen.findByRole('link', { name: 'Go Dasar' }))

    expect(onNavigate).toHaveBeenCalledWith('/posts/go-dasar')
  })

  it('mengabaikan hasil yang datang setelah komponen dilepas', async () => {
    let resolvePosts
    let resolveCategories
    getPublicPosts.mockReturnValue(new Promise((resolve) => (resolvePosts = resolve)))
    getCategories.mockReturnValue(new Promise((resolve) => (resolveCategories = resolve)))
    const { unmount } = setup()

    unmount()
    await act(async () => {
      resolvePosts({ data: posts })
      resolveCategories({ data: ['Teknologi'] })
    })

    expect(getPublicPosts).toHaveBeenCalledTimes(1)
  })
})