"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/components/luxe/primitives";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";

let bodyLockCount = 0;
let bodyOverflow = "";

function lockBody() {
  if (typeof document === "undefined") return () => {};
  if (bodyLockCount === 0) {
    bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
  return () => {
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) {
      document.body.style.overflow = bodyOverflow;
    }
  };
}

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClass;
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  bodyClassName?: string;
  ariaLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showClose = true,
  closeOnBackdrop = true,
  className,
  bodyClassName,
  ariaLabel,
  initialFocusRef,
}: ModalProps) {
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef, open, {
    onEscape: onClose,
    initialFocusRef,
  });

  useEffect(() => {
    if (!open) return;
    return lockBody();
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            aria-hidden
            className="lx-modal-backdrop absolute inset-0"
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ? undefined : ariaLabel}
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              "lx-modal-panel relative z-10 flex max-h-[90svh] w-full flex-col overflow-hidden outline-none",
              sizeClass[size],
              className,
            )}
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 31,
              mass: 0.7,
            }}
          >
            {title || showClose ? (
              <div className="flex items-start justify-between gap-4 border-b border-[var(--lx-border)] px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  {title ? (
                    <h2
                      id={titleId}
                      className="text-base font-semibold tracking-tight text-[var(--lx-text)]"
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      id={descriptionId}
                      className="mt-1 text-xs leading-relaxed text-[var(--lx-muted)]"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
                {showClose ? (
                  <IconButton
                    label="Close dialog"
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="-mr-1 -mt-1 shrink-0"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </IconButton>
                ) : null}
              </div>
            ) : null}

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6",
                bodyClassName,
              )}
            >
              {children}
            </div>

            {footer ? (
              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--lx-border)] px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
