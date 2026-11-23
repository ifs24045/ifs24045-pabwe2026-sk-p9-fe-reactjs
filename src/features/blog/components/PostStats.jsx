import { IconCircleCheck, IconFiles, IconPencil } from '@tabler/icons-react'

const CARDS = [
  {
    key: 'total',
    label: 'Total Artikel',
    Icon: IconFiles,
    tone: 'bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-500',
  },
  {
    key: 'published',
    label: 'Total Terbit',
    Icon: IconCircleCheck,
    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    key: 'draft',
    label: 'Belum Selesai (Draf)',
    Icon: IconPencil,
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
]

export default function PostStats({ stats = { total: 0, published: 0, draft: 0 } }) {
  return (
    <section aria-label="Statistik artikel" className="grid gap-4 sm:grid-cols-3">
      {CARDS.map(({ key, label, Icon, tone }) => (
        <div
          key={key}
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={24} />
          </span>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p data-testid={`stat-${key}`} className="text-2xl font-bold">
              {stats[key]}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}