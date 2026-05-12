import { useCallback, useRef } from "react";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextEditor({ value, onChange, placeholder, disabled }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="flex flex-col h-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || "Comece a escrever seu capítulo aqui..."}
        className="
          flex-1 w-full p-6 resize-none border-0 outline-none
          font-serif text-lg leading-relaxed text-gray-800
          bg-white placeholder-gray-300
          disabled:bg-gray-50 disabled:text-gray-400
        "
        spellCheck
        lang="pt-BR"
      />
      <div className="border-t border-gray-100 px-6 py-2 flex gap-4 text-xs text-gray-400 bg-white">
        <span>{wordCount} palavras</span>
        <span>{charCount} caracteres</span>
      </div>
    </div>
  );
}
