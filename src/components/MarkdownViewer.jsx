import { useEffect, useRef } from 'react'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

/** Wrapper Toast UI Viewer: menampilkan konten Markdown sebagai HTML. */
export default function MarkdownViewer({ content = '' }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const viewer = new Viewer({ el: rootRef.current, initialValue: content })
    return () => viewer.destroy()
  }, [content])

  return <div ref={rootRef} data-testid="markdown-viewer" />
}