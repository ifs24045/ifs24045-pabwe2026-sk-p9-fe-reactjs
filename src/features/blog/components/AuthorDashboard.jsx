import { useEffect, useState } from 'react'
import { IconDotsVertical, IconPlus, IconSparkles } from '@tabler/icons-react'
import {
  formatDate,
  showConfirmDialog,
  showErrorAlert,
  showSuccessAlert,
} from '../../../helpers/toolsHelper'
import { deletePost, getCategories, getMyPosts, getPostStats, togglePublish } from '../api/blogApi'
import { DEFAULT_CATEGORIES } from '../categories'
import AiPostGeneratorModal from '../modals/AiPostGeneratorModal'
import PostModal from '../modals/PostModal'
import PostStats from './PostStats'

const CLOSED = { type: 'none' }

const menuItemClass =
  'block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700'

export default function AuthorDashboard({ user, isDark = false, onNavigate }) {
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState({ loaded: false, posts: [], stats: undefined, error: '' })
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [modal, setModal] = useState(CLOSED)
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getCategories()
        setCategories(res.data)
      } catch {
        // gunakan daftar kategori bawaan
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      let next
      try {
        const [posts, stats] = await Promise.all([getMyPosts(), getPostStats()])
        next = { loaded: true, posts: posts.data, stats: stats.data, error: '' }
      } catch (error) {
        next = { loaded: true, posts: [], stats: undefined, error: error.message }
      }
      if (active) setData(next)
    }
    load()
    return () => {
      active = false
    }
  }, [reloadKey])

  const loading = !data.loaded
  const refresh = () => setReloadKey((key) => key + 1)
  const toggleMenu = (id) => setOpenMenu((current) => (current === id ? null : id))

  function openEdit(post) {
    setOpenMenu(null)
    setModal({ type: 'post', post })
  }

  function viewPost(post) {
    setOpenMenu(null)
    onNavigate(`/posts/${post.slug}`)
  }

  async function handleToggle(post) {
    try {
      await togglePublish(post.id)
      refresh()
    } catch (error) {
      showErrorAlert(error.message)
    }
  }

  async function handleDelete(post) {
    setOpenMenu(null)
    const confirmed = await showConfirmDialog({
      title: 'Hapus artikel?',
      text: `"${post.title}" akan dihapus permanen.`,
      confirmText: 'Hapus',
    })
    if (!confirmed) return

    try {
      await deletePost(post.id)
      showSuccessAlert('Artikel berhasil dihapus')
      refresh()
    } catch (error) {
      showErrorAlert(error.message)
    }
  }

  let content
  if (loading) {
    content = (
      <p role="status" className="py-16 text-center text-slate-500 dark:text-slate-400">
        Memuat artikel...
      </p>
    )
  } else if (data.error) {
    content = (
      <p role="alert" className="py-16 text-center text-red-600 dark:text-red-400">
        {data.error}
      </p>
    )
  } else if (data.posts.length === 0) {
    content = (
      <p className="py-16 text-center text-slate-500 dark:text-slate-400">
        Anda belum memiliki artikel. Mulai dengan menulis atau gunakan AI Generator.
      </p>
    )
  } else {
    content = (
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Judul</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Kategori</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Tanggal Terbit</th>
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.posts.map((post) => (
            <tr key={post.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="px-4 py-3 font-medium">{post.title}</td>
              <td className="hidden px-4 py-3 md:table-cell">{post.category}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={post.is_published}
                    aria-label={`Status publikasi ${post.title}`}
                    onClick={() => handleToggle(post)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      post.is_published ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        post.is_published ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {post.is_published ? 'Terbit' : 'Draf'}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">{formatDate(post.published_at)}</td>
              <td className="relative px-4 py-3 text-right">
                <button
                  type="button"
                  aria-label={`Menu aksi ${post.title}`}
                  aria-haspopup="menu"
                  aria-expanded={openMenu === post.id}
                  onClick={() => toggleMenu(post.id)}
                  className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <IconDotsVertical size={18} />
                </button>
                {openMenu === post.id && (
                  <div
                    role="menu"
                    className="absolute top-full right-4 z-20 w-44 overflow-hidden rounded-lg bg-white py-1 text-left shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                  >
                    {post.is_published && (
                      <button type="button" role="menuitem" onClick={() => viewPost(post)} className={menuItemClass}>
                        Lihat Artikel
                      </button>
                    )}
                    <button type="button" role="menuitem" onClick={() => openEdit(post)} className={menuItemClass}>
                      Ubah
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleDelete(post)}
                      className={`${menuItemClass} text-red-600 dark:text-red-400`}
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workspace Penulis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Halo, {user.username}. Kelola artikel Anda di sini.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModal({ type: 'ai' })}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <IconSparkles size={16} />
            AI Generator
          </button>
          <button
            type="button"
            onClick={() => setModal({ type: 'post', post: null })}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <IconPlus size={16} />
            Tambah Artikel
          </button>
        </div>
      </div>

      <PostStats stats={data.stats} />

      <section className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {content}
      </section>

      {openMenu !== null && (
        <div data-testid="menu-backdrop" className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}

      {modal.type === 'post' && (
        <PostModal
          post={modal.post}
          categories={categories}
          isDark={isDark}
          onClose={() => setModal(CLOSED)}
          onSaved={() => {
            setModal(CLOSED)
            refresh()
          }}
        />
      )}

      {modal.type === 'ai' && (
        <AiPostGeneratorModal
          categories={categories}
          onClose={() => setModal(CLOSED)}
          onApply={(draft) => setModal({ type: 'post', post: draft })}
        />
      )}
    </main>
  )
}