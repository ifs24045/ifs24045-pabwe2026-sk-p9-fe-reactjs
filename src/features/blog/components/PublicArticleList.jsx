import { useEffect, useState } from 'react'
import { IconClock, IconSearch } from '@tabler/icons-react'
import useInput from '../../../hooks/useInput'
import { formatDate } from '../../../helpers/toolsHelper'
import { getCategories, getPublicPosts } from '../api/blogApi'

const SEARCH_DELAY = 250

const pillClass = (active) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition ${
    active
      ? 'bg-brand-600 text-white'
      : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700'
  }`

export default function PublicArticleList({ onNavigate }) {
  const [query, onQueryChange] = useInput()
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState({ key: null, posts: [], error: '' })

  const requestKey = `${debouncedQuery}|${category}`
  const loading = result.key !== requestKey

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let active = true
    async function loadCategories() {
      try {
        const res = await getCategories()
        if (active) setCategories(res.data)
      } catch {
        // kategori bersifat opsional: daftar artikel tetap tampil tanpa filter
      }
    }
    loadCategories()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadPosts() {
      let next
      try {
        const res = await getPublicPosts({ q: debouncedQuery, category })
        next = { key: requestKey, posts: res.data, error: '' }
      } catch (error) {
        next = { key: requestKey, posts: [], error: error.message }
      }
      if (active) setResult(next)
    }
    loadPosts()
    return () => {
      active = false
    }
  }, [debouncedQuery, category, requestKey])

  const open = (path) => (event) => {
    event.preventDefault()
    onNavigate(path)
  }

  let content
  if (loading) {
    content = (
      <p role="status" className="py-16 text-center text-slate-500 dark:text-slate-400">
        Memuat artikel...
      </p>
    )
  } else if (result.error) {
    content = (
      <p role="alert" className="py-16 text-center text-red-600 dark:text-red-400">
        {result.error}
      </p>
    )
  } else if (result.posts.length === 0) {
    content = (
      <p className="py-16 text-center text-slate-500 dark:text-slate-400">Belum ada artikel yang ditemukan.</p>
    )
  } else {
    content = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.posts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md dark:bg-slate-900 dark:ring-slate-800"
          >
            {post.cover_image_path && (
              <img src={post.cover_image_path} alt={post.title} className="h-44 w-full object-cover" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <span className="mb-2 w-fit rounded-full bg-brand-100 px-3 py-0.5 text-xs font-semibold text-brand-700 dark:bg-slate-800 dark:text-brand-500">
                {post.category}
              </span>
              <h2 className="text-lg font-bold leading-snug">
                <a href={`/posts/${post.slug}`} onClick={open(`/posts/${post.slug}`)} className="hover:text-brand-600">
                  {post.title}
                </a>
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{post.author.username}</span>
                <span>{formatDate(post.published_at)}</span>
                <span className="flex items-center gap-1">
                  <IconClock size={14} />
                  {post.reading_time} menit baca
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold">Artikel Terbaru</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Bacaan seputar teknologi, pendidikan, bisnis, dan banyak lagi.
        </p>

        <div className="relative mx-auto mt-6 max-w-xl">
          <IconSearch size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Cari artikel"
            placeholder="Cari artikel..."
            value={query}
            onChange={onQueryChange}
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div role="group" aria-label="Filter kategori" className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            aria-pressed={category === ''}
            onClick={() => setCategory('')}
            className={pillClass(category === '')}
          >
            Semua
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className={pillClass(category === name)}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">{content}</section>
    </main>
  )
}