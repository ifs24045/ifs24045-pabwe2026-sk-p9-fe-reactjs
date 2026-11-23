import Swal from 'sweetalert2'

/** Memformat tanggal ke bahasa Indonesia, mis. "15 Maret 2026". */
export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function showSuccessAlert(message) {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil',
    text: message,
    timer: 1800,
    showConfirmButton: false,
  })
}

export function showErrorAlert(message) {
  return Swal.fire({
    icon: 'error',
    title: 'Gagal',
    text: message,
  })
}

/** Dialog konfirmasi; mengembalikan true jika pengguna menekan tombol konfirmasi. */
export async function showConfirmDialog({
  title = 'Apakah Anda yakin?',
  text = '',
  confirmText = 'Ya',
} = {}) {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626',
  })
  return result.isConfirmed
}