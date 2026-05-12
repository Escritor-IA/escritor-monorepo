interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

export function Spinner({ size = "md", label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        className={`animate-spin text-brand-600 ${sizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
