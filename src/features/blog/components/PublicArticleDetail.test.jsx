import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicArticleDetail from './PublicArticleDetail'
import { getPublicPost } from '../api/blogApi'

vi.mock('../api/blogApi', () => ({ getPublicPost: vi.fn() }))
vi.mock('../../../components/MarkdownViewer', () => ({
  default: ({ content }) => <div data-testid="viewer">{content}</div>,
}))

const basePost = {
  id: 1,
  title: 'Go Dasar',
  category: 'Teknologi',
  content: '# Isi artikel',
  author: { id: 1, username: 'andi' },
  published_at: '2026-03-15T12:00:00Z',
  reading_time: 4,
  cover_image_path: 'https://img.test/cover.png',
}

beforeEach(() => {
  vi.clearAllMocks()
  getPublicPost.mockImplementation(async (slug) => ({ data: { ...basePost, slug, title: `Judul ${slug}` } }))
})

function setup(props = {}) {
  const onNavigate = vi.fn()
  const user = userEvent.setup()
  const view = render(<PublicArticleDetail slug="go-dasar" onNavigate={onNavigate} {...props} />)
  return { user, onNavigate, ...view }
}

describe('PublicArticleDetail', () => {
  it('menampilkan status memuat lalu isi artikel lengkap', async () => {
    setup()

    expect(screen.getByRole('status')).toHaveTextContent('Memuat artikel...')

    expect(await screen.findByRole('heading', { name: 'Judul go-dasar' })).toBeInTheDocument()
    expect(getPublicPost).toHaveBeenCalledWith('go-dasar')
    expect(screen.getByText('Teknologi')).toBeInTheDocument()
    expect(screen.getByText('andi')).toBeInTheDocument()
    expect(screen.getByText('15 Maret 2026')).toBeInTheDocument()
    expect(screen.getByText('4 menit baca')).toBeInTheDocument()
    expect(screen.getByTestId('viewer')).toHaveTextContent('# Isi artikel')
    expect(screen.getByRole('img', { name: 'Judul go-dasar' })).toBeInTheDocument()
  })

  it('tidak menampilkan gambar jika artikel tanpa sampul', async () => {
    getPublicPost.mockResolvedValue({ data: { ...basePost, slug: 'x', cover_image_path: '' } })
    setup({ slug: 'x' })

    await screen.findByRole('heading', { name: 'Go Dasar' })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('menampilkan pesan error jika artikel tidak ditemukan', async () => {
    getPublicPost.mockRejectedValue(new Error('Artikel tidak ditemukan'))
    setup({ slug: 'hilang' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Artikel tidak ditemukan')
    expect(screen.queryByTestId('viewer')).not.toBeInTheDocument()
  })

  it('tautan kembali mengarah ke beranda', async () => {
    const { user, onNavigate } = setup()
    await screen.findByRole('heading', { name: 'Judul go-dasar' })

    await user.click(screen.getByRole('link', { name: 'Kembali ke beranda' }))

    expect(onNavigate).toHaveBeenCalledWith('/')
  })

  it('memuat ulang saat slug berubah', async () => {
    const { rerender } = setup()
    await screen.findByRole('heading', { name: 'Judul go-dasar' })

    rerender(<PublicArticleDetail slug="artikel-lain" onNavigate={vi.fn()} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Judul artikel-lain' })).toBeInTheDocument()
    expect(getPublicPost).toHaveBeenLastCalledWith('artikel-lain')
  })

  it('mengabaikan hasil yang datang setelah komponen dilepas', async () => {
    let resolvePost
    getPublicPost.mockReturnValue(new Promise((resolve) => (resolvePost = resolve)))
    const { unmount } = setup()

    unmount()
    await act(async () => {
      resolvePost({ data: basePost })
    })

    expect(getPublicPost).toHaveBeenCalledTimes(1)
  })
})