import { useEffect, useRef, useCallback } from "react";

/**
 * Shared accessibility behaviour for modal dialogs.
 *
 * When `isOpen` turns true it:
 *  - remembers the element that had focus (to restore it on close)
 *  - locks background scrolling while the modal is open
 *  - moves focus into the modal (first focusable element, or the dialog)
 *  - listens for Escape → calls `onClose` (unless disabled)
 *  - traps Tab / Shift+Tab focus inside the dialog
 *
 * On close it restores focus to the previously focused element and
 * unlocks scrolling.
 *
 * Usage:
 *   const dialogRef = useModalA11y({ isOpen, onClose });
 *   ...
 *   <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="...">
 *
 * Notes:
 *  - Safe to call unconditionally (hooks rules) — it early-outs when closed.
 *  - Stacked modals are handled: scroll lock is reference-counted so the
 *    outermost unlock wins.
 *  - `closeOnEscape: false` disables Escape (e.g. destructive confirms).
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'details > summary',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// Reference count so stacked modals only unlock scrolling once
let scrollLockCount = 0;
let previousBodyOverflow = "";

const lockScroll = () => {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
};

const unlockScroll = () => {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
};

const getFocusable = (root) =>
  Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    // :visible approximation — skip elements hidden via display:none
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
  });

export const useModalA11y = ({
  isOpen,
  onClose,
  closeOnEscape = true,
  initialFocusRef,
} = {}) => {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without re-running the open/close effects
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Open / close lifecycle
  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    lockScroll();

    // Move focus into the dialog after paint
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const explicit = initialFocusRef?.current;
      if (explicit && dialog.contains(explicit)) {
        explicit.focus();
        return;
      }

      const focusables = getFocusable(dialog);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        // Dialog itself must be focusable for screen readers / tab trapping
        if (!dialog.hasAttribute("tabindex")) {
          dialog.setAttribute("tabindex", "-1");
        }
        dialog.focus();
      }
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      unlockScroll();

      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === "function" && document.contains(previous)) {
        previous.focus();
      }
    };
    // initialFocusRef is a ref object — stable identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.stopPropagation();
        if (typeof onCloseRef.current === "function") {
          onCloseRef.current();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape]);

  // Focus trap (Tab / Shift+Tab)
  const handleKeyDown = useCallback((event) => {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = getFocusable(dialog);
    if (focusables.length === 0) {
      event.preventDefault();
      if (!dialog.hasAttribute("tabindex")) {
        dialog.setAttribute("tabindex", "-1");
      }
      dialog.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  return { dialogRef, handleKeyDown };
};

export default useModalA11y;
