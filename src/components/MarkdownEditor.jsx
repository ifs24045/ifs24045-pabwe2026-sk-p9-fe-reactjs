import { useEffect, useRef } from 'react'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'

/** Wrapper Toast UI Editor: mode Markdown dengan tab pratinjau, mendukung tema gelap. */
export default function MarkdownEditor({ value = '', onChange, height = '420px', dark = false }) {
  const rootRef = useRef(null)
  const editorRef = useRef(null)
  const latest = useRef({ value, onChange })

  useEffect(() => {
    latest.current = { value, onChange }
  })

  useEffect(() => {
    const editor = new Editor({
      el: rootRef.current,
      height,
      initialEditType: 'markdown',
      previewStyle: 'tab',
      initialValue: latest.current.value,
      theme: dark ? 'dark' : 'light',
      usageStatistics: false,
      events: {
        change: () => latest.current.onChange?.(editor.getMarkdown()),
      },
    })
    editorRef.current = editor
    return () => editor.destroy()
  }, [height, dark])

  useEffect(() => {
    const editor = editorRef.current
    if (editor.getMarkdown() !== value) editor.setMarkdown(value)
  }, [value])

  return <div ref={rootRef} data-testid="markdown-editor" />
}