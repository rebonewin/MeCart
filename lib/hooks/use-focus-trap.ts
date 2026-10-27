"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const trapStack: symbol[] = [];

export function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0,
  );
}

/**
 * Keeps keyboard focus inside an overlay while it is open, handles Escape,
 * and restores focus to the trigger on close.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: {
    onEscape?: () => void;
    initialFocusRef?: RefObject<HTMLElement | null>;
    restoreFocus?: boolean;
  } = {},
) {
  const escapeRef = useRef(options.onEscape);
  const initialFocusTargetRef = useRef(options.initialFocusRef);
  const restoreFocus = options.restoreFocus ?? true;

  useEffect(() => {
    escapeRef.current = options.onEscape;
    initialFocusTargetRef.current = options.initialFocusRef;
  }, [options.onEscape, options.initialFocusRef]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const token = Symbol("focus-trap");
    trapStack.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const preferred = initialFocusTargetRef.current?.current;
      const focusable = getFocusableElements(container);
      const target = preferred ?? focusable[0] ?? container;
      if (!target.hasAttribute("tabindex") && target === container) {
        container.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    };

    const frame = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (trapStack[trapStack.length - 1] !== token) return;

      if (event.key === "Escape" && escapeRef.current) {
        event.preventDefault();
        event.stopPropagation();
        escapeRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      const index = trapStack.lastIndexOf(token);
      if (index >= 0) trapStack.splice(index, 1);

      if (
        !restoreFocus ||
        !previouslyFocused ||
        !document.contains(previouslyFocused)
      ) {
        return;
      }
      if (
        container.contains(document.activeElement) ||
        document.activeElement === document.body ||
        document.activeElement === null
      ) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, restoreFocus]);
}
