import { Button } from "./student/ui";

/**
 * Simple confirm/cancel modal. Controlled: render it conditionally from the
 * parent, e.g. {confirming && <ConfirmDialog ... />}.
 */
export default function ConfirmDialog({
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger", // "danger" | "default"
  onConfirm,
  onCancel,
  busy = false,
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-title">{title}</p>
        {description && <p className="confirm-description">{description}</p>}
        <div className="confirm-actions">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
