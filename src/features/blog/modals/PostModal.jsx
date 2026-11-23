import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import MarkdownEditor from '../../../components/MarkdownEditor'
import useInput from '../../../hooks/useInput'
import { showErrorAlert, showSuccessAlert } from '../../../helpers/toolsHelper'
import { createPost, updatePost } from '../api/blogApi'
import { DEFAULT_CATEGORIES } from '../categories'

const EMPTY_POST = { title: '', category: 'Umum', excerpt: '', content: '', cover_image_path: '' }

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
const labelClass = 'mb-1 block text-sm font-medium'

export default function PostModal({ post = null, categories = DEFAULT_CATEGORIES, isDark = false, onClose, onSaved }) {
  const source = post ?? EMPTY_POST
  const editing = Boolean(source.id)
  const heading = editing ? 'Ubah Artikel' : 'Tambah Artikel'

  const [title, onTitleChange] = useInput(source.title)
  const [category, onCategoryChange] = useInput(source.category)
  const [excerpt, onExcerptChange] = useInput(source.excerpt)
  const [coverImagePath, onCoverChange] = useInput(source.cover_image_path)
  const [content, setContent] = useState(source.content)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      showErrorAlert('Judul dan konten artikel wajib diisi')
      return
    }

    const payload = {
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      content,
      cover_image_path: coverImagePath.trim(),
    }

    setLoading(true)
    try {
      if (editing) {
        await updatePost(source.id, payload)
      } else {
        await createPost(payload)
      }
      showSuccessAlert(editing ? 'Artikel berhasil diperbarui' : 'Artikel berhasil dibuat')
      onSaved()
    } catch (error) {
      showErrorAlert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-modal-title"
        className="flex max-h-[96vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between bg-brand-600 px-5 py-4 text-white">
          <h2 id="post-modal-title" className="text-lg font-semibold">
            {heading}
          </h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded p-1 hover:bg-white/20">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label htmlFor="post-title" className={labelClass}>
                  Judul Artikel
                </label>
                <input id="post-title" type="text" value={title} onChange={onTitleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="post-category" className={labelClass}>
                  Kategori
                </label>
                <select id="post-category" value={category} onChange={onCategoryChange} className={inputClass}>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="post-excerpt" className={labelClass}>
                  Ringkasan (opsional)
                </label>
                <input
                  id="post-excerpt"
                  type="text"
                  value={excerpt}
                  onChange={onExcerptChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="post-cover" className={labelClass}>
                  URL Gambar Sampul (opsional)
                </label>
                <input
                  id="post-cover"
                  type="text"
                  value={coverImagePath}
                  onChange={onCoverChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <p className={labelClass}>Isi Artikel (Markdown)</p>
              <MarkdownEditor value={content} onChange={setContent} height="50vh" dark={isDark} />
            </div>
          </div>

          <div className="flex justify-end gap-2 bg-slate-100 px-5 py-3 dark:bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}