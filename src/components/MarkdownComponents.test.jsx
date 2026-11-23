import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MarkdownEditor from './MarkdownEditor'
import MarkdownViewer from './MarkdownViewer'

const mocks = vi.hoisted(() => ({ editors: [], viewers: [] }))

vi.mock('@toast-ui/editor', () => {
  class Editor {
    constructor(options) {
      this.options = options
      this.markdown = options.initialValue
      this.destroy = vi.fn()
      this.setMarkdown = vi.fn((value) => {
        this.markdown = value
      })
      mocks.editors.push(this)
    }

    getMarkdown() {
      return this.markdown
    }
  }
  return { default: Editor }
})

vi.mock('@toast-ui/editor/dist/toastui-editor-viewer', () => {
  class Viewer {
    constructor(options) {
      this.options = options
      this.destroy = vi.fn()
      mocks.viewers.push(this)
    }
  }
  return { default: Viewer }
})

describe('MarkdownEditor', () => {
  it('memakai props default', () => {
    mocks.editors.length = 0

    render(<MarkdownEditor />)

    const { options } = mocks.editors[0]
    expect(options.height).toBe('420px')
    expect(options.theme).toBe('light')
    expect(options.initialValue).toBe('')
    expect(options.initialEditType).toBe('markdown')
    expect(options.previewStyle).toBe('tab')
  })

  it('menerapkan value awal, tinggi, dan tema gelap', () => {
    mocks.editors.length = 0

    render(<MarkdownEditor value="# Halo" height="300px" dark />)

    const { options } = mocks.editors[0]
    expect(options.initialValue).toBe('# Halo')
    expect(options.height).toBe('300px')
    expect(options.theme).toBe('dark')
  })

  it('memanggil onChange dengan isi Markdown terbaru', () => {
    mocks.editors.length = 0
    const onChange = vi.fn()
    render(<MarkdownEditor onChange={onChange} />)
    const editor = mocks.editors[0]

    editor.markdown = 'teks baru'
    editor.options.events.change()

    expect(onChange).toHaveBeenCalledWith('teks baru')
  })

  it('tidak error jika onChange tidak diberikan', () => {
    mocks.editors.length = 0
    render(<MarkdownEditor />)

    expect(() => mocks.editors[0].options.events.change()).not.toThrow()
  })

  it('menyinkronkan value dari luar ke editor', () => {
    mocks.editors.length = 0
    const { rerender } = render(<MarkdownEditor value="" />)
    const editor = mocks.editors[0]

    rerender(<MarkdownEditor value="dari luar" />)

    expect(editor.setMarkdown).toHaveBeenCalledWith('dari luar')
    expect(editor.getMarkdown()).toBe('dari luar')
  })

  it('tidak menimpa editor jika value sudah sama dengan isi editor', () => {
    mocks.editors.length = 0
    const { rerender } = render(<MarkdownEditor value="" />)
    const editor = mocks.editors[0]

    editor.markdown = 'ketikan pengguna'
    rerender(<MarkdownEditor value="ketikan pengguna" />)

    expect(editor.setMarkdown).not.toHaveBeenCalled()
  })

  it('membuat ulang editor saat tema berubah dan menghancurkan yang lama', () => {
    mocks.editors.length = 0
    const { rerender } = render(<MarkdownEditor value="isi" />)

    rerender(<MarkdownEditor value="isi" dark />)

    expect(mocks.editors).toHaveLength(2)
    expect(mocks.editors[0].destroy).toHaveBeenCalled()
    expect(mocks.editors[1].options.theme).toBe('dark')
    expect(mocks.editors[1].options.initialValue).toBe('isi')
  })

  it('menghancurkan editor saat unmount', () => {
    mocks.editors.length = 0
    const { unmount } = render(<MarkdownEditor />)

    unmount()

    expect(mocks.editors[0].destroy).toHaveBeenCalled()
  })
})

describe('MarkdownViewer', () => {
  it('content default kosong', () => {
    mocks.viewers.length = 0

    render(<MarkdownViewer />)

    expect(mocks.viewers[0].options.initialValue).toBe('')
  })

  it('menampilkan content yang diberikan', () => {
    mocks.viewers.length = 0

    render(<MarkdownViewer content="**tebal**" />)

    expect(mocks.viewers[0].options.initialValue).toBe('**tebal**')
  })

  it('membuat ulang viewer saat content berubah', () => {
    mocks.viewers.length = 0
    const { rerender } = render(<MarkdownViewer content="satu" />)

    rerender(<MarkdownViewer content="dua" />)

    expect(mocks.viewers).toHaveLength(2)
    expect(mocks.viewers[0].destroy).toHaveBeenCalled()
    expect(mocks.viewers[1].options.initialValue).toBe('dua')
  })

  it('menghancurkan viewer saat unmount', () => {
    mocks.viewers.length = 0
    const { unmount } = render(<MarkdownViewer content="x" />)

    unmount()

    expect(mocks.viewers[0].destroy).toHaveBeenCalled()
  })
})