import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface Props {
  initialContent: string;
  onUpdate: (html: string) => void;
  onSelectionChange?: (text: string) => void;
}

// Converts old plain-text format (# headings, > quotes, \n\n blocks) to HTML.
// Returns the string unchanged if it already contains HTML tags.
export function toHtml(raw: string): string {
  if (!raw.trim()) return "";
  if (/<(p|h[1-6]|blockquote)\b/i.test(raw)) return raw;
  return raw
    .split("\n\n")
    .map((block) => {
      const b = block.trim();
      if (!b) return null;
      if (b.startsWith("## ")) return `<h2>${b.slice(3).trim()}</h2>`;
      if (b.startsWith("# ")) return `<h1>${b.slice(2).trim()}</h1>`;
      if (b.startsWith("> ")) return `<blockquote><p>${b.slice(2).trim()}</p></blockquote>`;
      return `<p>${b}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export function ChapterEditor({ initialContent, onUpdate, onSelectionChange }: Props) {
  // ChapterPage only renders this component after content is loaded,
  // so initialContent is already the final value at mount time.
  // Passing it directly to useEditor avoids the seeded-ref / StrictMode bug.
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Placeholder.configure({ placeholder: "Comece a escrever…" }),
    ],
    content: toHtml(initialContent),
    onUpdate({ editor }) {
      onUpdate(editor.getHTML());
    },
    onSelectionUpdate({ editor }) {
      const { from, to } = editor.state.selection;
      if (from !== to && onSelectionChange) {
        onSelectionChange(editor.state.doc.textBetween(from, to, " "));
      }
    },
    editorProps: {
      attributes: { spellcheck: "true", lang: "pt-BR" },
    },
  });

  useEffect(() => () => { editor?.destroy(); }, [editor]);

  return (
    <div className="chapter-editor">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 80, placement: "top" }}>
          <div className="bubble-menu">
            <button
              type="button"
              title="Negrito (Ctrl+B)"
              className={editor.isActive("bold") ? "is-active" : ""}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <BoldIcon />
            </button>
            <button
              type="button"
              title="Itálico (Ctrl+I)"
              className={editor.isActive("italic") ? "is-active" : ""}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <ItalicIcon />
            </button>
            <div className="bubble-sep" />
            <button
              type="button"
              title="Título (# + espaço)"
              className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              T1
            </button>
            <button
              type="button"
              title="Subtítulo (## + espaço)"
              className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              T2
            </button>
            <div className="bubble-sep" />
            <button
              type="button"
              title="Citação (> + espaço)"
              className={editor.isActive("blockquote") ? "is-active" : ""}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <QuoteIcon />
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function BoldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}
function ItalicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}
