import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "green";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size,
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const cls = ["btn", `btn-${variant}`];
  if (size) cls.push(`btn-${size}`);
  if (className) cls.push(className);

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cls.join(" ")}
    >
      {loading && (
        <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
