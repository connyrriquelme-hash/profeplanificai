import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, type CSSProperties } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  minHeight?: string;
}

function menuBtnStyle(active: boolean | undefined): CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: '6px',
    border: 0,
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    background: active ? 'var(--brand)' : 'var(--card2)',
    color: active ? '#fff' : 'var(--ink)',
  };
}

export function RichTextEditor({ content, onChange, editable = true, minHeight = '200px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        style: `min-height:${minHeight};padding:12px;outline:none;color:var(--ink)`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        padding: '8px 10px', borderBottom: '1px solid var(--line)',
        background: 'var(--bg2)',
      }}>
        <button style={menuBtnStyle(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><b>B</b></button>
        <button style={menuBtnStyle(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><i>I</i></button>
        <button style={menuBtnStyle(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado"><u>U</u></button>
        <button style={menuBtnStyle(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><s>S</s></button>
        <span style={{ width: 1, height: 24, background: 'var(--line)', margin: '0 4px' }} />
        <button style={menuBtnStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">H1</button>
        <button style={menuBtnStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">H2</button>
        <button style={menuBtnStyle(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">H3</button>
        <span style={{ width: 1, height: 24, background: 'var(--line)', margin: '0 4px' }} />
        <button style={menuBtnStyle(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">•</button>
        <button style={menuBtnStyle(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">1.</button>
        <span style={{ width: 1, height: 24, background: 'var(--line)', margin: '0 4px' }} />
        <button style={menuBtnStyle(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Izquierda">≡</button>
        <button style={menuBtnStyle(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centro">≡</button>
        <button style={menuBtnStyle(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Resaltar">🖍</button>
        <span style={{ flex: 1 }} />
        <button style={menuBtnStyle(false)} onClick={() => editor.chain().focus().undo().run()} title="Deshacer">↩</button>
        <button style={menuBtnStyle(false)} onClick={() => editor.chain().focus().redo().run()} title="Rehacer">↪</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
