import { useEffect, useRef } from "react";
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
  const confirmBtnRef = useRef(null);

  // This dialog gates real deletes (notices, users, ...), so it gets the
  // same treatment as the sidebar drawer: Escape to back out, background
  // scroll locked while it's open, and focus placed on the safer default
  // action so an accidental Enter cancels rather than confirms.
  useEffect(() => {
    confirmBtnRef.current?.focus();
    document.body.classList.add("has-drawer-open");

    function onKeyDown(e) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("has-drawer-open");
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="confirm-overlay"
      onClick={busy ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
      >
        <p id="confirm-dialog-title" className="confirm-title">{title}</p>
        {description && (
          <p id="confirm-dialog-desc" className="confirm-description">{description}</p>
        )}
        <div className="confirm-actions">
          <Button
            ref={confirmBtnRef}
            variant="outline"
            onClick={onCancel}
            disabled={busy}
          >
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
