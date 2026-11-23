import { useEffect, useState } from 'react'
import { IconArrowLeft, IconCalendar, IconClock, IconUser } from '@tabler/icons-react'
import MarkdownViewer from '../../../components/MarkdownViewer'
import { formatDate } from '../../../helpers/toolsHelper'
import { getPublicPost } from '../api/blogApi'

export default function PublicArticleDetail({ slug, onNavigate }) {
  const [result, setResult] = useState({ slug: null, post: null, error: '' })
  const loading = result.slug !== slug

  useEffect(() => {
    let active = true
    async function load() {
      let next
      try {
        const res = await getPublicPost(slug)
        next = { slug, post: res.data, error: '' }
      } catch (error) {
        next = { slug, post: null, error: error.message }
      }
      if (active) setResult(next)
    }
    load()
    return () => {
      active = false
    }
  }, [slug])

  const back = (event) => {
    event.preventDefault()
    onNavigate('/')
  }

  const { post } = result

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
  } else {
    content = (
      <article>
        {post.cover_image_path && (
          <img
            src={post.cover_image_path}
            alt={post.title}
            className="mb-6 max-h-[28rem] w-full rounded-2xl object-cover"
          />
        )}
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-slate-800 dark:text-brand-500">
          {post.category}
        </span>
        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <IconUser size={16} />
            {post.author.username}
          </span>
          <span className="flex items-center gap-1.5">
            <IconCalendar size={16} />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <IconClock size={16} />
            {post.reading_time} menit baca
          </span>
        </div>
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <MarkdownViewer content={post.content} />
        </div>
      </article>
    )
  }

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-12">
      <a
        href="/"
        onClick={back}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
      >
        <IconArrowLeft size={16} />
        Kembali ke beranda
      </a>
      {content}
    </main>
  )
}