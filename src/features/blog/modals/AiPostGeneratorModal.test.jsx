import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AiPostGeneratorModal from './AiPostGeneratorModal'
import { generatePost } from '../api/blogApi'
import { showErrorAlert } from '../../../helpers/toolsHelper'
import { DEFAULT_CATEGORIES } from '../categories'

vi.mock('../api/blogApi', () => ({ generatePost: vi.fn() }))
vi.mock('../../../helpers/toolsHelper', () => ({ showErrorAlert: vi.fn() }))
vi.mock('../../../components/MarkdownViewer', () => ({
  default: ({ content }) => <div data-testid="viewer">{content}</div>,
}))

const draft = {
  title: 'Belajar Go',
  category: 'Teknologi',
  excerpt: 'Ringkas',
  content: 'Isi **markdown**',
  sources: [
    { title: 'A', url: 'https://a.test', snippet: 'a' },
    { title: 'B', url: 'https://b.test', snippet: 'b' },
  ],
  web_search_used: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  generatePost.mockResolvedValue({ data: draft })
})

function setup(props = {}) {
  const handlers = { onClose: vi.fn(), onApply: vi.fn() }
  const user = userEvent.setup()
  render(<AiPostGeneratorModal {...handlers} {...props} />)
  return { user, ...handlers }
}

describe('AiPostGeneratorModal', () => {
  it('tampilan awal: tanpa pratinjau, tombol gunakan nonaktif, penelusuran web aktif', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Generator Artikel AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gunakan Draf Ini' })).toBeDisabled()
    expect(screen.getByLabelText('Sertakan penelusuran web (Search Engine)')).toBeChecked()
    expect(screen.queryByRole('region', { name: 'Pratinjau draf' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Otomatis', ...DEFAULT_CATEGORIES])
  })

  it('memakai kategori dari props', () => {
    setup({ categories: ['Opini'] })

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Otomatis', 'Opini'])
  })

  it('menolak topik yang terlalu pendek', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText('Topik Artikel'), 'ab')
    await user.click(screen.getByRole('button', { name: 'Hasilkan Draf' }))

    expect(showErrorAlert).toHaveBeenCalledWith('Topik artikel minimal 3 karakter')
    expect(generatePost).not.toHaveBeenCalled()
  })

  it('menghasilkan draf dengan penelusuran web lalu menampilkan pratinjau', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText('Topik Artikel'), '  Belajar Go  ')
    await user.click(screen.getByRole('button', { name: 'Hasilkan Draf' }))

    const preview = await screen.findByRole('region', { name: 'Pratinjau draf' })
    expect(generatePost).toHaveBeenCalledWith({ topic: 'Belajar Go', category: '', include_web_search: true })
    expect(preview).toHaveTextContent('Disusun dengan 2 sumber penelusuran web')
    expect(screen.getByRole('heading', { name: 'Belajar Go' })).toBeInTheDocument()
    expect(screen.getByText('Teknologi', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Ringkas')).toBeInTheDocument()
    expect(screen.getByTestId('viewer')).toHaveTextContent('Isi **markdown**')
    expect(screen.getByRole('button', { name: 'Gunakan Draf Ini' })).toBeEnabled()
  })

  it('mengirim kategori pilihan dan tanpa penelusuran web', async () => {
    generatePost.mockResolvedValue({ data: { ...draft, sources: [], web_search_used: false } })
    const { user } = setup()

    await user.type(screen.getByLabelText('Topik Artikel'), 'Strategi bisnis')
    await user.selectOptions(screen.getByLabelText('Kategori (opsional)'), 'Bisnis')
    await user.click(screen.getByLabelText('Sertakan penelusuran web (Search Engine)'))
    await user.click(screen.getByRole('button', { name: 'Hasilkan Draf' }))

    expect(await screen.findByText('Disusun tanpa penelusuran web')).toBeInTheDocument()
    expect(generatePost).toHaveBeenCalledWith({
      topic: 'Strategi bisnis',
      category: 'Bisnis',
      include_web_search: false,
    })
  })

  it('"Gunakan Draf Ini" mengirim draf ke onApply', async () => {
    const { user, onApply } = setup()

    await user.type(screen.getByLabelText('Topik Artikel'), 'Belajar Go')
    await user.click(screen.getByRole('button', { name: 'Hasilkan Draf' }))
    await user.click(await screen.findByRole('button', { name: 'Gunakan Draf Ini' }))

    expect(onApply).toHaveBeenCalledWith(draft)
  })

  it('menampilkan error jika AI gagal dan tidak ada pratinjau', async () => {
    generatePost.mockRejectedValue(new Error('Layanan AI gagal merespons'))
    const { user } = setup()

    await user.type(screen.getByLabelText('Topik Artikel'), 'Belajar Go')
    await user.click(screen.getByRole('button', { name: 'Hasilkan Draf' }))

    expect(await screen.findByRole('button', { name: 'Hasilkan Draf' })).toBeEnabled()
    expect(showErrorAlert).toHaveBeenCalledWith('Layanan AI gagal merespons')
    expect(screen.queryByRole('region', { name: 'Pratinjau draf' })).not.toBeInTheDocument()
  })

  it('tombol menampilkan "Menghasilkan..." selama permintaan berjalan', async () => {
    generatePost.mockReturnValue(new Promise(() => {}))
    const { user } = setup()

    await user.type(screen.getByLabelText('Topik Artikel'), 'Belajar Go')
    await user.click(screen.getByRole('button', { name: 'Hasilkan Draf' }))

    expect(await screen.findByRole('button', { name: 'Menghasilkan...' })).toBeDisabled()
  })

  it('tombol Tutup dan Batal memanggil onClose', async () => {
    const { user, onClose } = setup()

    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})