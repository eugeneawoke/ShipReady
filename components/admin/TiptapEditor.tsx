'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { createLowlight } from 'lowlight'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import type { JSONContent } from '@tiptap/react'
import { useCallback } from 'react'

const lowlight = createLowlight()
lowlight.register('javascript', js)
lowlight.register('typescript', ts)
lowlight.register('css', css)
lowlight.register('bash', bash)
lowlight.register('sql', sql)

export interface TiptapEditorProps {
  content: JSONContent | null
  onChange: (json: JSONContent) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

const TOOLBAR_BTN = 'px-2 py-1 rounded text-xs text-[#8B8A85] hover:text-[#F1F0EE] hover:bg-white/[0.06] transition-colors disabled:opacity-30'
const TOOLBAR_BTN_ACTIVE = 'px-2 py-1 rounded text-xs text-[#F1F0EE] bg-white/[0.06]'

export function TiptapEditor({ content, onChange, placeholder = 'Start writing...', minHeight = '300px', className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#6E56CF] underline' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-lg' } }),
      CodeBlockLowlight.configure({ lowlight, HTMLAttributes: { class: 'bg-[#0E0E0F] rounded-lg p-4 text-sm font-mono' } }),
      Highlight.configure({ HTMLAttributes: { class: 'bg-[#6E56CF]/20 rounded px-1' } }),
      Typography,
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
    ],
    content: content ?? undefined,
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none px-5 py-4',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={`rounded-xl border border-white/[0.08] bg-[#161618] overflow-hidden ${className ?? ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/[0.06] bg-[#111113]">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Bold">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Italic"><em>I</em></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Strike"><s>S</s></button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Inline code">{`<>`}</button>
        <div className="w-px h-4 bg-white/[0.1] mx-1" />
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="H2">H2</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="H3">H3</button>
        <div className="w-px h-4 bg-white/[0.1] mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Bullet list">• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Ordered list">1. List</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Blockquote">&ldquo;&rdquo;</button>
        <div className="w-px h-4 bg-white/[0.1] mx-1" />
        <button onClick={setLink} className={editor.isActive('link') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Link">Link</button>
        <button onClick={addImage} className={TOOLBAR_BTN} title="Image">Img</button>
        <div className="w-px h-4 bg-white/[0.1] mx-1" />
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} title="Code block">{ '```' }</button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={TOOLBAR_BTN} title="Divider">—</button>
      </div>

      {/* Editor content */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #5A5955;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror { color: #C9C8C3; }
        .ProseMirror h2 { color: #F1F0EE; font-size: 1.25rem; font-weight: 600; margin: 1.2em 0 0.5em; }
        .ProseMirror h3 { color: #F1F0EE; font-size: 1.1rem; font-weight: 600; margin: 1em 0 0.5em; }
        .ProseMirror a { color: #6E56CF; text-decoration: underline; }
        .ProseMirror blockquote { border-left: 3px solid #6E56CF; padding-left: 1rem; color: #8B8A85; }
        .ProseMirror hr { border-color: rgba(255,255,255,0.06); margin: 1.5rem 0; }
        .ProseMirror code { background: rgba(110,86,207,0.15); border-radius: 3px; padding: 0.1em 0.3em; font-size: 0.85em; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  )
}
