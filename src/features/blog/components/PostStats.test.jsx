import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PostStats from './PostStats'

describe('PostStats', () => {
  it('menampilkan nol saat stats tidak diberikan', () => {
    render(<PostStats />)

    expect(screen.getByText('Total Artikel')).toBeInTheDocument()
    expect(screen.getByText('Total Terbit')).toBeInTheDocument()
    expect(screen.getByText('Belum Selesai (Draf)')).toBeInTheDocument()
    expect(screen.getByTestId('stat-total')).toHaveTextContent('0')
    expect(screen.getByTestId('stat-published')).toHaveTextContent('0')
    expect(screen.getByTestId('stat-draft')).toHaveTextContent('0')
  })

  it('menampilkan angka statistik yang diberikan', () => {
    render(<PostStats stats={{ total: 12, published: 8, draft: 4 }} />)

    expect(screen.getByTestId('stat-total')).toHaveTextContent('12')
    expect(screen.getByTestId('stat-published')).toHaveTextContent('8')
    expect(screen.getByTestId('stat-draft')).toHaveTextContent('4')
  })
})