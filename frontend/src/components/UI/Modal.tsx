import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, footer, maxWidth }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-box"
        style={maxWidth ? { maxWidth } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3
              className="serif"
              style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              {title}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
