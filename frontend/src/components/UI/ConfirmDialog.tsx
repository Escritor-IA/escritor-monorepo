import { createPortal } from "react-dom";
import { ErrorCard } from "./ErrorCard";

interface Props {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>
            {title}
          </p>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.55 }}>
            {description}
          </p>
          {error && <ErrorCard message={error} style={{ marginTop: 14 }} />}
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
            style={danger ? { background: "var(--red-wash)", fontWeight: 600 } : undefined}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
