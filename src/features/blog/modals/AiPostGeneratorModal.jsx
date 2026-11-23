import { useState } from 'react'
import { IconSparkles, IconX } from '@tabler/icons-react'
import MarkdownViewer from '../../../components/MarkdownViewer'
import useInput from '../../../hooks/useInput'
import { showErrorAlert } from '../../../helpers/toolsHelper'
import { generatePost } from '../api/blogApi'
import { DEFAULT_CATEGORIES } from '../categories'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
const labelClass = 'mb-1 block text-sm font-medium'

export default function AiPostGeneratorModal({ categories = DEFAULT_CATEGORIES, onClose, onApply }) {
  const [topic, onTopicChange] = useInput()
  const [category, onCategoryChange] = useInput()
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState(null)

  async function handleGenerate(event) {
    event.preventDefault()
    if (topic.trim().length < 3) {
      showErrorAlert('Topik artikel minimal 3 karakter')
      return
    }

    setLoading(true)
    try {
      const res = await generatePost({
        topic: topic.trim(),
        category,
        include_web_search: includeWebSearch,
      })
      setDraft(res.data)
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
        aria-labelledby="ai-modal-title"
        className="flex max-h-[96vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between bg-violet-600 px-5 py-4 text-white">
          <h2 id="ai-modal-title" className="flex items-center gap-2 text-lg font-semibold">
            <IconSparkles size={20} />
            Generator Artikel AI
          </h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded p-1 hover:bg-white/20">
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleGenerate} noValidate className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label htmlFor="ai-topic" className={labelClass}>
                  Topik Artikel
                </label>
                <input
                  id="ai-topic"
                  type="text"
                  placeholder="Contoh: Tren AI di dunia pendidikan 2026"
                  value={topic}
                  onChange={onTopicChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ai-category" className={labelClass}>
                  Kategori (opsional)
                </label>
                <select id="ai-category" value={category} onChange={onCategoryChange} className={inputClass}>
                  <option value="">Otomatis</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label htmlFor="ai-web-search" className="flex items-center gap-2 text-sm">
              <input
                id="ai-web-search"
                type="checkbox"
                checked={includeWebSearch}
                onChange={(event) => setIncludeWebSearch(event.target.checked)}
                className="h-4 w-4"
              />
              Sertakan penelusuran web (Search Engine)
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Menghasilkan...' : 'Hasilkan Draf'}
            </button>
          </form>

          {draft && (
            <section
              aria-label="Pratinjau draf"
              className="mt-6 rounded-xl border border-slate-200 p-5 dark:border-slate-700"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {draft.web_search_used
                  ? `Disusun dengan ${draft.sources.length} sumber penelusuran web`
                  : 'Disusun tanpa penelusuran web'}
              </p>
              <span className="mt-2 inline-block rounded-full bg-brand-100 px-3 py-0.5 text-xs font-semibold text-brand-700 dark:bg-slate-800 dark:text-brand-500">
                {draft.category}
              </span>
              <h3 className="mt-2 text-2xl font-bold">{draft.title}</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{draft.excerpt}</p>
              <div className="mt-4">
                <MarkdownViewer content={draft.content} />
              </div>
            </section>
          )}
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
            type="button"
            disabled={!draft}
            onClick={() => onApply(draft)}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gunakan Draf Ini
          </button>
        </div>
      </div>
    </div>
  )
}