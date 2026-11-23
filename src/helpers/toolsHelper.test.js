import { beforeEach, describe, expect, it, vi } from 'vitest'
import Swal from 'sweetalert2'
import { formatDate, showConfirmDialog, showErrorAlert, showSuccessAlert } from './toolsHelper'

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}))

beforeEach(() => {
  Swal.fire.mockReset()
})

describe('formatDate', () => {
  it('mengembalikan "-" untuk nilai kosong', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate('')).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('mengembalikan "-" untuk tanggal tidak valid', () => {
    expect(formatDate('bukan tanggal')).toBe('-')
  })

  it('memformat tanggal valid dalam bahasa Indonesia', () => {
    expect(formatDate('2026-03-15T12:00:00Z')).toBe('15 Maret 2026')
  })
})

describe('alert', () => {
  it('showSuccessAlert menampilkan dialog sukses', () => {
    showSuccessAlert('Tersimpan')

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', title: 'Berhasil', text: 'Tersimpan', showConfirmButton: false }),
    )
  })

  it('showErrorAlert menampilkan dialog gagal', () => {
    showErrorAlert('Terjadi kesalahan')

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan' }),
    )
  })
})

describe('showConfirmDialog', () => {
  it('memakai teks default dan mengembalikan true saat dikonfirmasi', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true })

    await expect(showConfirmDialog()).resolves.toBe(true)
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Apakah Anda yakin?',
        text: '',
        confirmButtonText: 'Ya',
        showCancelButton: true,
      }),
    )
  })

  it('memakai teks kustom dan mengembalikan false saat dibatalkan', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false })

    await expect(
      showConfirmDialog({ title: 'Hapus artikel?', text: 'Tidak bisa dikembalikan', confirmText: 'Hapus' }),
    ).resolves.toBe(false)
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hapus artikel?',
        text: 'Tidak bisa dikembalikan',
        confirmButtonText: 'Hapus',
      }),
    )
  })
})