import { useEffect, useState } from 'react'
import { IconCircleCheck, IconFiles, IconUsers } from '@tabler/icons-react'
import { formatDate } from '../../../helpers/toolsHelper'
import { getAdminPosts, getAdminUserPosts, getAdminUsers } from '../api/adminApi'

const cardClass =
  'flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800'

function StatusBadge({ published }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        published
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {published ? 'Terbit' : 'Draf'}
    </span>
  )
}

function PostsTable({ posts, emptyText }) {
  if (posts.length === 0) {
    return <p className="py-10 text-center text-slate-500 dark:text-slate-400">{emptyText}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Judul</th>
            <th className="px-4 py-3 font-medium">Penulis</th>
            <th className="px-4 py-3 font-medium">Kategori</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Tanggal Terbit</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="px-4 py-3 font-medium">{post.title}</td>
              <td className="px-4 py-3">{post.author.username}</td>
              <td className="px-4 py-3">{post.category}</td>
              <td className="px-4 py-3">
                <StatusBadge published={post.is_published} />
              </td>
              <td className="px-4 py-3">{formatDate(post.published_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const tabClass = (active) =>
  `rounded-lg px-4 py-2 text-sm font-medium ${
    active
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function AdminDashboard() {
  const [tab, setTab] = useState('users')
  const [data, setData] = useState({ loaded: false, users: [], posts: [], error: '' })
  const [selected, setSelected] = useState(null)
  const [userPosts, setUserPosts] = useState({ userId: null, posts: [], error: '' })

  useEffect(() => {
    let active = true
    async function load() {
      let next
      try {
        const [users, posts] = await Promise.all([getAdminUsers(), getAdminPosts()])
        next = { loaded: true, users: users.data, posts: posts.data, error: '' }
      } catch (error) {
        next = { loaded: true, users: [], posts: [], error: error.message }
      }
      if (active) setData(next)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selected) return undefined
    let active = true
    async function load() {
      let next
      try {
        const res = await getAdminUserPosts(selected.id)
        next = { userId: selected.id, posts: res.data, error: '' }
      } catch (error) {
        next = { userId: selected.id, posts: [], error: error.message }
      }
      if (active) setUserPosts(next)
    }
    load()
    return () => {
      active = false
    }
  }, [selected])

  const loading = !data.loaded
  const userPostsLoading = selected !== null && userPosts.userId !== selected.id
  const totalPosts = data.users.reduce((sum, u) => sum + u.total_posts, 0)
  const totalPublished = data.users.reduce((sum, u) => sum + u.total_published, 0)

  let userPostsContent = null
  if (selected) {
    if (userPostsLoading) {
      userPostsContent = (
        <p role="status" className="py-10 text-center text-slate-500 dark:text-slate-400">
          Memuat artikel pengguna...
        </p>
      )
    } else if (userPosts.error) {
      userPostsContent = (
        <p role="alert" className="py-10 text-center text-red-600 dark:text-red-400">
          {userPosts.error}
        </p>
      )
    } else {
      userPostsContent = <PostsTable posts={userPosts.posts} emptyText="Pengguna ini belum menulis artikel." />
    }
  }

  let body
  if (loading) {
    body = (
      <p role="status" className="py-16 text-center text-slate-500 dark:text-slate-400">
        Memuat data...
      </p>
    )
  } else if (data.error) {
    body = (
      <p role="alert" className="py-16 text-center text-red-600 dark:text-red-400">
        {data.error}
      </p>
    )
  } else if (tab === 'users') {
    body = (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Total Artikel</th>
                <th className="px-4 py-3 font-medium">Total Terbit</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">{u.total_posts}</td>
                  <td className="px-4 py-3">{u.total_published}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Lihat artikel ${u.username}`}
                      onClick={() => setSelected(u)}
                      className="rounded-lg px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-500 dark:hover:bg-slate-800"
                    >
                      Lihat Artikel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <section
            aria-label={`Artikel milik ${selected.username}`}
            className="border-t border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Artikel milik {selected.username}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-1 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
            {userPostsContent}
          </section>
        )}
      </>
    )
  } else {
    body = <PostsTable posts={data.posts} emptyText="Belum ada artikel di sistem." />
  }

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-12">
      <h1 className="text-2xl font-bold">Panel Administrasi</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Pantau seluruh pengguna dan artikel dalam sistem.
      </p>

      <section aria-label="Ringkasan sistem" className="grid gap-4 sm:grid-cols-3">
        <div className={cardClass}>
          <IconUsers size={28} className="text-brand-600" />
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Pengguna</p>
            <p data-testid="stat-users" className="text-2xl font-bold">
              {data.users.length}
            </p>
          </div>
        </div>
        <div className={cardClass}>
          <IconFiles size={28} className="text-brand-600" />
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Artikel</p>
            <p data-testid="stat-posts" className="text-2xl font-bold">
              {totalPosts}
            </p>
          </div>
        </div>
        <div className={cardClass}>
          <IconCircleCheck size={28} className="text-emerald-600" />
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Artikel Terbit</p>
            <p data-testid="stat-published" className="text-2xl font-bold">
              {totalPublished}
            </p>
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="Bagian panel admin" className="mt-6 flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'users'}
          onClick={() => setTab('users')}
          className={tabClass(tab === 'users')}
        >
          Pengguna
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'posts'}
          onClick={() => setTab('posts')}
          className={tabClass(tab === 'posts')}
        >
          Arsip Artikel
        </button>
      </div>

      <section className="mt-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {body}
      </section>
    </main>
  )
}