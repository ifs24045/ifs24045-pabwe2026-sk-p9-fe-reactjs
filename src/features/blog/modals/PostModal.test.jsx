import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PostModal from './PostModal'
import { createPost, updatePost } from '../api/blogApi'
import { showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'
import { DEFAULT_CATEGORIES } from '../categories'

vi.mock('../api/blogApi', () => ({ createPost: vi.fn(), updatePost: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({
  showErrorAlert: vi.fn(),
  showSuccessAlert: vi.fn(),
}))
vi.mock('../../../components/MarkdownEditor', () => ({
  default: ({ value, onChange, dark }) => (
    <textarea
      aria-label="Editor konten"
      data-dark={String(dark)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

const existing = {
  id: 5,
  title: 'Judul Lama',
  category: 'Bisnis',
  excerpt: 'ringkas lama',
  content: 'isi lama',
  cover_image_path: '/c.png',
}

beforeEach(() => {
  vi.clearAllMocks()
  createPost.mockResolvedValue({})
  updatePost.mockResolvedValue({})
})

function setup(props = {}) {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() }
  const user = userEvent.setup()
  render(<PostModal {...handlers} {...props} />)
  return { user, ...handlers }
}

describe('PostModal mode tambah', () => {
  it('menampilkan form kosong dengan kategori bawaan', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Tambah Artikel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul Artikel')).toHaveValue('')
    expect(screen.getByLabelText('Kategori')).toHaveValue('Umum')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(DEFAULT_CATEGORIES)
    expect(screen.getByLabelText('Editor konten')).toHaveAttribute('data-dark', 'false')
  })

  it('memakai kategori dari props dan meneruskan tema gelap ke editor', () => {
    setup({ categories: ['Umum', 'Opini'], isDark: true })

    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(screen.getByLabelText('Editor konten')).toHaveAttribute('data-dark', 'true')
  })

  it('menyimpan artikel baru dengan data yang sudah dirapikan', async () => {
    const { user, onSaved } = setup()

    await user.type(screen.getByLabelText('Judul Artikel'), '  Halo Dunia  ')
    await user.selectOptions(screen.getByLabelText('Kategori'), 'Teknologi')
    await user.type(screen.getByLabelText('Ringkasan (opsional)'), 'ringkas')
    await user.type(screen.getByLabelText('URL Gambar Sampul (opsional)'), 'https://x.test/y.png')
    await user.type(screen.getByLabelText('Editor konten'), 'isi artikel')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(createPost).toHaveBeenCalledWith({
      title: 'Halo Dunia',
      category: 'Teknologi',
      excerpt: 'ringkas',
      content: 'isi artikel',
      cover_image_path: 'https://x.test/y.png',
    })
    expect(updatePost).not.toHaveBeenCalled()
    expect(showSuccessAlert).toHaveBeenCalledWith('Artikel berhasil dibuat')
  })

  it('menolak jika judul kosong', async () => {
    const { user, onSaved } = setup()

    await user.type(screen.getByLabelText('Editor konten'), 'isi artikel')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(showErrorAlert).toHaveBeenCalledWith('Judul dan konten artikel wajib diisi')
    expect(createPost).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('menolak jika konten hanya spasi', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText('Judul Artikel'), 'Halo')
    await user.type(screen.getByLabelText('Editor konten'), '   ')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(showErrorAlert).toHaveBeenCalledWith('Judul dan konten artikel wajib diisi')
    expect(createPost).not.toHaveBeenCalled()
  })

  it('draf dari AI (tanpa id) diperlakukan sebagai artikel baru', async () => {
    const draft = { title: 'Draf AI', category: 'Teknologi', excerpt: 'ringkas AI', content: 'isi AI' }
    const { user, onSaved } = setup({ post: draft })

    expect(screen.getByRole('heading', { name: 'Tambah Artikel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul Artikel')).toHaveValue('Draf AI')

    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(createPost).toHaveBeenCalledWith({
      title: 'Draf AI',
      category: 'Teknologi',
      excerpt: 'ringkas AI',
      content: 'isi AI',
      cover_image_path: '',
    })
  })

  it('menampilkan error dari server dan tidak memanggil onSaved', async () => {
    createPost.mockRejectedValue(new Error('Kategori tidak valid'))
    const { user, onSaved } = setup()

    await user.type(screen.getByLabelText('Judul Artikel'), 'Halo')
    await user.type(screen.getByLabelText('Editor konten'), 'isi')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Kategori tidak valid'))
    expect(onSaved).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeEnabled()
  })

  it('tombol menampilkan "Menyimpan..." selama permintaan berjalan', async () => {
    createPost.mockReturnValue(new Promise(() => {}))
    const { user } = setup()

    await user.type(screen.getByLabelText('Judul Artikel'), 'Halo')
    await user.type(screen.getByLabelText('Editor konten'), 'isi')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
  })
})

describe('PostModal mode ubah', () => {
  it('mengisi form dengan data artikel dan menyimpan lewat updatePost', async () => {
    const { user, onSaved } = setup({ post: existing })

    expect(screen.getByRole('heading', { name: 'Ubah Artikel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul Artikel')).toHaveValue('Judul Lama')
    expect(screen.getByLabelText('Kategori')).toHaveValue('Bisnis')
    expect(screen.getByLabelText('Ringkasan (opsional)')).toHaveValue('ringkas lama')
    expect(screen.getByLabelText('URL Gambar Sampul (opsional)')).toHaveValue('/c.png')
    expect(screen.getByLabelText('Editor konten')).toHaveValue('isi lama')

    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(updatePost).toHaveBeenCalledWith(5, {
      title: 'Judul Lama',
      category: 'Bisnis',
      excerpt: 'ringkas lama',
      content: 'isi lama',
      cover_image_path: '/c.png',
    })
    expect(createPost).not.toHaveBeenCalled()
    expect(showSuccessAlert).toHaveBeenCalledWith('Artikel berhasil diperbarui')
  })
})

describe('PostModal penutupan', () => {
  it('tombol Tutup dan Batal memanggil onClose', async () => {
    const { user, onClose } = setup()

    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})