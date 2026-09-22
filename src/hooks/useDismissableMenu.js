import { useEffect, useRef, useState } from "react";

/**
 * Open/close state for a menu or dropdown, plus the dismissal behaviour
 * every one of them needs: close on an outside click, close on Escape, and
 * close if the viewport crosses into a layout where the trigger might not
 * even be visible any more (e.g. rotating a phone).
 *
 * Returns [open, setOpen, containerRef] — spread the ref onto the element
 * that wraps both the trigger button and the panel.
 */
export function useDismissableMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    // mousedown (not click) so the dismissal happens before a click handler
    // elsewhere on the page fires, matching the original behaviour.
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return [open, setOpen, ref];
}
