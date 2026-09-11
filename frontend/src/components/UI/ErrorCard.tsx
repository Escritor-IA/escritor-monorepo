interface ErrorCardProps {
  message: string;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

export function ErrorCard({ message, onDismiss, style }: ErrorCardProps) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        background: "var(--red-wash)",
        border: "1px solid rgba(179,56,44,0.25)",
        borderRadius: 10,
        fontSize: 13,
        color: "var(--red)",
        lineHeight: 1.5,
        ...style,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <AlertIcon />
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fechar"
          style={{ flexShrink: 0, color: "var(--red)", opacity: 0.7, padding: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
