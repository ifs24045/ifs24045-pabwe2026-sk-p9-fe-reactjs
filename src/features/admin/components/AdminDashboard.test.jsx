import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboard from './AdminDashboard'
import { getAdminPosts, getAdminUserPosts, getAdminUsers } from '../api/adminApi'

vi.mock('../api/adminApi', () => ({
  getAdminUsers: vi.fn(),
  getAdminPosts: vi.fn(),
  getAdminUserPosts: vi.fn(),
}))

const users = [
  { id: 1, username: 'pak_admin', email: 'admin@delcom.org', role: 'admin', total_posts: 0, total_published: 0 },
  { id: 2, username: 'andi', email: 'andi@mail.com', role: 'member', total_posts: 2, total_published: 1 },
  { id: 3, username: 'budi', email: 'budi@mail.com', role: 'member', total_posts: 1, total_published: 1 },
]

const posts = [
  {
    id: 1,
    title: 'Go Dasar',
    author: { username: 'andi' },
    category: 'Teknologi',
    is_published: true,
    published_at: '2026-03-15T12:00:00Z',
  },
  {
    id: 2,
    title: 'Draf Andi',
    author: { username: 'andi' },
    category: 'Bisnis',
    is_published: false,
    published_at: null,
  },
  {
    id: 3,
    title: 'Gizi Sehat',
    author: { username: 'budi' },
    category: 'Gaya Hidup',
    is_published: true,
    published_at: '2026-03-16T12:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  getAdminUsers.mockResolvedValue({ data: users })
  getAdminPosts.mockResolvedValue({ data: posts })
  getAdminUserPosts.mockResolvedValue({ data: [posts[0], posts[1]] })
})

function setup() {
  const user = userEvent.setup()
  const view = render(<AdminDashboard />)
  return { user, ...view }
}

async function ready() {
  await screen.findByText('pak_admin')
}

describe('AdminDashboard', () => {
  it('menampilkan status memuat', () => {
    getAdminUsers.mockReturnValue(new Promise(() => {}))
    setup()

    expect(screen.getByRole('status')).toHaveTextContent('Memuat data...')
  })

  it('menampilkan ringkasan dan direktori pengguna', async () => {
    setup()
    await ready()

    expect(screen.getByTestId('stat-users')).toHaveTextContent('3')
    expect(screen.getByTestId('stat-posts')).toHaveTextContent('3')
    expect(screen.getByTestId('stat-published')).toHaveTextContent('2')
    expect(screen.getByText('admin@delcom.org')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pengguna' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Arsip Artikel' })).toHaveAttribute('aria-selected', 'false')
  })

  it('menampilkan pesan error dan ringkasan nol', async () => {
    getAdminUsers.mockRejectedValue(new Error('Anda tidak memiliki hak akses'))
    setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('Anda tidak memiliki hak akses')
    expect(screen.getByTestId('stat-users')).toHaveTextContent('0')
  })

  it('tab Arsip Artikel menampilkan seluruh artikel, dan bisa kembali ke Pengguna', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('tab', { name: 'Arsip Artikel' }))

    expect(screen.getByText('Go Dasar')).toBeInTheDocument()
    expect(screen.getByText('Draf Andi')).toBeInTheDocument()
    expect(screen.getByText('Gizi Sehat')).toBeInTheDocument()
    expect(screen.getAllByText('Terbit')).toHaveLength(2)
    expect(screen.getByText('Draf')).toBeInTheDocument()
    expect(screen.getByText('15 Maret 2026')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Arsip Artikel' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: 'Pengguna' }))
    expect(screen.getByText('pak_admin')).toBeInTheDocument()
  })

  it('arsip kosong menampilkan pesan', async () => {
    getAdminPosts.mockResolvedValue({ data: [] })
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('tab', { name: 'Arsip Artikel' }))

    expect(screen.getByText('Belum ada artikel di sistem.')).toBeInTheDocument()
  })

  it('mengabaikan hasil yang datang setelah komponen dilepas', async () => {
    let resolveUsers
    getAdminUsers.mockReturnValue(new Promise((resolve) => (resolveUsers = resolve)))
    const { unmount } = setup()

    unmount()
    await act(async () => {
      resolveUsers({ data: users })
    })

    expect(getAdminUsers).toHaveBeenCalledTimes(1)
  })
})

describe('AdminDashboard artikel per pengguna', () => {
  it('memuat dan menampilkan artikel milik pengguna lalu bisa ditutup', async () => {
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Lihat artikel andi' }))

    const panel = await screen.findByRole('region', { name: 'Artikel milik andi' })
    expect(await within(panel).findByText('Go Dasar')).toBeInTheDocument()
    expect(within(panel).getByText('Draf Andi')).toBeInTheDocument()
    expect(getAdminUserPosts).toHaveBeenCalledWith(2)

    await user.click(within(panel).getByRole('button', { name: 'Tutup' }))
    expect(screen.queryByRole('region', { name: 'Artikel milik andi' })).not.toBeInTheDocument()
  })

  it('menampilkan status memuat selama artikel pengguna dimuat', async () => {
    getAdminUserPosts.mockReturnValue(new Promise(() => {}))
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Lihat artikel andi' }))

    expect(await screen.findByText('Memuat artikel pengguna...')).toBeInTheDocument()
  })

  it('menampilkan pesan jika pengguna belum punya artikel', async () => {
    getAdminUserPosts.mockResolvedValue({ data: [] })
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Lihat artikel pak_admin' }))

    expect(await screen.findByText('Pengguna ini belum menulis artikel.')).toBeInTheDocument()
  })

  it('menampilkan error jika artikel pengguna gagal dimuat', async () => {
    getAdminUserPosts.mockRejectedValue(new Error('Pengguna tidak ditemukan'))
    const { user } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Lihat artikel budi' }))

    expect(await screen.findByText('Pengguna tidak ditemukan')).toBeInTheDocument()
  })

  it('mengabaikan hasil artikel pengguna yang datang setelah komponen dilepas', async () => {
    let resolveUserPosts
    getAdminUserPosts.mockReturnValue(new Promise((resolve) => (resolveUserPosts = resolve)))
    const { user, unmount } = setup()
    await ready()

    await user.click(screen.getByRole('button', { name: 'Lihat artikel andi' }))
    unmount()
    await act(async () => {
      resolveUserPosts({ data: [posts[0]] })
    })

    expect(getAdminUserPosts).toHaveBeenCalledTimes(1)
  })
})