import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthorDashboard from './AuthorDashboard'
import { deletePost, getCategories, getMyPosts, getPostStats, togglePublish } from '../api/blogApi'
import { showConfirmDialog, showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'
import { DEFAULT_CATEGORIES } from '../categories'

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }))
vi.mock('../api/blogApi', () => ({
  getMyPosts: vi.fn(),
  getPostStats: vi.fn(),
  getCategories: vi.fn(),
  togglePublish: vi.fn(),
  deletePost: vi.fn(),
}))
vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showConfirmDialog: vi.fn(),
  showErrorAlert: vi.fn(),
  showSuccessAlert: vi.fn(),
}))
vi.mock('../modals/PostModal', () => ({
  default: ({ post, categories, isDark, onClose, onSaved }) => (
    <div
      data-testid="post-modal"
      data-post={post ? post.title : 'baru'}
      data-dark={String(isDark)}
      data-cats={categories.join(',')}
    >
      <button onClick={onClose}>tutup-post</button>
      <button onClick={onSaved}>simpan-post</button>
    </div>
  ),
}))
vi.mock('../modals/AiPostGeneratorModal', () => ({
  default: ({ onClose, onApply }) => (
    <div data-testid="ai-modal">
      <button onClick={onClose}>tutup-ai</button>
      <button onClick={() => onApply({ title: 'Draf AI', content: 'isi' })}>pakai-draf</button>
    </div>
  ),
}))

const published = {
  id: 1,
  slug: 'go-dasar',
  title: 'Go Dasar',
  category: 'Teknologi',
  is_published: true,
  published_at: '2026-03-15T12:00:00Z',
}
const draft = {
  id: 2,
  slug: 'draf-saya',
  title: 'Draf Saya',
  category: 'Bisnis',
  is_published: false,
  published_at: null,
}
const me = { id: 2, username: 'budi', role: 'member' }

beforeEach(() => {
  vi.clearAllMocks()
  getMyPosts.mockResolvedValue({ data: [published, draft] })
  getPostStats.mockResolvedValue({ data: { total: 2, published: 1, draft: 1 } })
  getCategories.mockResolvedValue({ data: ['Teknologi', 'Umum'] })
  togglePublish.mockResolvedValue({})
  deletePost.mockResolvedValue({})
})

function setup(props = {}) {
  const onNavigate = vi.fn()
  const user = userEvent.setup()
  const view = render(<AuthorDashboard user={me} onNavigate={onNavigate} {...props} />)
  return { user, onNavigate, ...view }
}

async function ready() {
  await screen.findByText('Go Dasar')
}

async function openMenuOf(user, title) {
  await user.click(screen.getByRole('button', { name: `Menu aksi ${title}` }))
}

describe('AuthorDashboard tampilan', () => {
  it('menampilkan status memuat', () => {
    getMyPosts.mockReturnValue(new Promise(() => {}))
    setup()

    expect(screen.getByRole('status')).toHaveTextContent('Memuat artikel...')
  })

  it('menampilkan sapaan, statistik, dan tabel artikel', async () => {
    setup()
    await ready()

    expect(screen.getByText(/Halo, budi/)).toBeInTheDocument()
    expect(screen.getByTestId('stat-total')).toHaveTextContent('2')
    expect(screen.getByTestId('stat-published')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-draft')).toHaveTextContent('1')

    const publishedRow = screen.getByRole('row', { name: /Go Dasar/ })
    expect(within(publishedRow).getByText('Terbit')).toBeInTheDocument()
    expect(within(publishedRow).getByText('15 Maret 2026')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Status publikasi Go Dasar' })).toHaveAttribute('aria-checked', 'true')

    const draftRow = screen.getByRole('row', { name: /Draf Saya/ })
    expect(within(draftRow).getByText('Draf')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Status publikasi Draf Saya' })).toHaveAttribute('aria-checked', 'false')
  })

  it('menampilkan pesan saat belum ada artikel', async () => {
    getMyPosts.mockResolvedValue({ data: [] })
    setup()

    expect(await screen.findByText(/Anda belum memiliki artikel/)).toBeInTheDocument()
  })

  it('menampilkan pesan error dan statistik nol', async () => {
    getMyPosts.mockRejectedValue(new Error('Gagal memuat artikel'))
    setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat artikel')
    expect(screen.getByTestId('stat-total')).toHaveTextContent('0')
  })

  it('mengabaikan hasil yang datang setelah komponen dilepas', async () => {
    let resolvePosts
    getMyPosts.mockReturnValue(new Promise((resolve) => (resolvePosts = resolve)))
    const { unmount } = setup()

    unmount()
    await act(async () => {
      resolvePosts({ data: [published] })
    })

    expect(getMyPosts).toHaveBeenCalledTimes(1)
  })
})

describe('AuthorDashboard menu kebab', () => {
  it('artikel terbit punya menu Lihat Artikel yang membuka halaman publik', async () => {
    const { user, onNavigate } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    expect(screen.getByRole('menuitem', { name: 'Ubah' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Hapus' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Lihat Artikel' }))

    expect(onNavigate).toHaveBeenCalledWith('/posts/go-dasar')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('draf tidak punya menu Lihat Artikel', async () => {
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Draf Saya')

    expect(screen.queryByRole('menuitem', { name: 'Lihat Artikel' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Ubah' })).toBeInTheDocument()
  })

  it('menu menutup saat tombol kebab diklik lagi', async () => {
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await openMenuOf(user, 'Go Dasar')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('menu menutup saat klik di luar menu', async () => {
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    await user.click(screen.getByTestId('menu-backdrop'))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.queryByTestId('menu-backdrop')).not.toBeInTheDocument()
  })

  it('Ubah membuka modal dengan artikel yang dipilih', async () => {
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    await user.click(screen.getByRole('menuitem', { name: 'Ubah' }))

    expect(screen.getByTestId('post-modal')).toHaveAttribute('data-post', 'Go Dasar')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('AuthorDashboard toggle publikasi', () => {
  it('switch memanggil togglePublish lalu memuat ulang data', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('switch', { name: 'Status publikasi Draf Saya' }))

    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
    expect(togglePublish).toHaveBeenCalledWith(2)
  })

  it('menampilkan error jika toggle gagal', async () => {
    togglePublish.mockRejectedValue(new Error('Gagal mengubah status'))
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('switch', { name: 'Status publikasi Go Dasar' }))

    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Gagal mengubah status'))
    expect(getMyPosts).toHaveBeenCalledTimes(1)
  })
})

describe('AuthorDashboard hapus artikel', () => {
  it('tidak menghapus jika dibatalkan', async () => {
    showConfirmDialog.mockResolvedValue(false)
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    await user.click(screen.getByRole('menuitem', { name: 'Hapus' }))

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled())
    expect(deletePost).not.toHaveBeenCalled()
  })

  it('menghapus setelah dikonfirmasi lalu memuat ulang', async () => {
    showConfirmDialog.mockResolvedValue(true)
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    await user.click(screen.getByRole('menuitem', { name: 'Hapus' }))

    await waitFor(() => expect(deletePost).toHaveBeenCalledWith(1))
    expect(showConfirmDialog).toHaveBeenCalledWith(expect.objectContaining({ confirmText: 'Hapus' }))
    expect(showSuccessAlert).toHaveBeenCalledWith('Artikel berhasil dihapus')
    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
  })

  it('menampilkan error jika penghapusan gagal', async () => {
    showConfirmDialog.mockResolvedValue(true)
    deletePost.mockRejectedValue(new Error('Artikel tidak ditemukan'))
    const { user } = setup()
    await ready()

    await openMenuOf(user, 'Go Dasar')
    await user.click(screen.getByRole('menuitem', { name: 'Hapus' }))

    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Artikel tidak ditemukan'))
    expect(getMyPosts).toHaveBeenCalledTimes(1)
  })
})

describe('AuthorDashboard modal', () => {
  it('Tambah Artikel membuka modal kosong; Tutup menutupnya', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Tambah Artikel' }))
    expect(screen.getByTestId('post-modal')).toHaveAttribute('data-post', 'baru')

    await user.click(screen.getByRole('button', { name: 'tutup-post' }))
    expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument()
  })

  it('setelah disimpan modal menutup dan data dimuat ulang', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Tambah Artikel' }))
    await user.click(screen.getByRole('button', { name: 'simpan-post' }))

    expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument()
    await waitFor(() => expect(getMyPosts).toHaveBeenCalledTimes(2))
  })

  it('meneruskan kategori dari server dan tema gelap ke modal', async () => {
    const { user } = setup({ isDark: true })
    await ready()

    await user.click(screen.getByRole('button', { name: 'Tambah Artikel' }))

    await waitFor(() => expect(screen.getByTestId('post-modal')).toHaveAttribute('data-cats', 'Teknologi,Umum'))
    expect(screen.getByTestId('post-modal')).toHaveAttribute('data-dark', 'true')
  })

  it('memakai kategori bawaan jika kategori gagal dimuat', async () => {
    getCategories.mockRejectedValue(new Error('gagal'))
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Tambah Artikel' }))

    expect(screen.getByTestId('post-modal')).toHaveAttribute('data-cats', DEFAULT_CATEGORIES.join(','))
    expect(screen.getByTestId('post-modal')).toHaveAttribute('data-dark', 'false')
  })

  it('AI Generator dibuka dan ditutup', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'AI Generator' }))
    expect(screen.getByTestId('ai-modal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'tutup-ai' }))
    expect(screen.queryByTestId('ai-modal')).not.toBeInTheDocument()
  })

  it('menerapkan draf AI membuka modal penulisan dengan draf tersebut', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'AI Generator' }))
    await user.click(screen.getByRole('button', { name: 'pakai-draf' }))

    expect(screen.queryByTestId('ai-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('post-modal')).toHaveAttribute('data-post', 'Draf AI')
  })
})