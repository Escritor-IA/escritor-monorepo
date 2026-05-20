import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Input({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <input {...props} className={`input ${className}`} />
      {hint && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--red)" }}>{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, hint, className = "", ...props }: TextareaProps) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <textarea {...props} className={`textarea ${className}`} />
      {hint && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--red)" }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, className = "", ...props }: SelectProps) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <select {...props} className={`select-field ${className}`}>{children}</select>
      {error && <span style={{ fontSize: 12, color: "var(--red)" }}>{error}</span>}
    </div>
  );
}
