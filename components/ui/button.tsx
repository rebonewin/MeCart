"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  forwardRef,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "premium"
  | "destructive"
  | "success"
  | "brand"
  | "glass"
  | "link"
  | "plain";

export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

type Ripple = { id: number; x: number; y: number; size: number };

/**
 * Legacy surfaces still carry their own visual classes. `plain` keeps those
 * classes intact while adding the shared press/ripple interaction layer.
 */
export function buttonVariants({
  variant = "plain",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  const sized =
    variant !== "plain" && variant !== "link" ? `lx-btn--${size}` : null;
  return cn("lx-btn", `lx-btn--${variant}`, sized, className);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function canUseMagnetism() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !prefersReducedMotion()
  );
}

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "children"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  /** Desktop pointer attraction. Defaults on for the premium CTA. */
  magnetic?: boolean;
  /** Pointer-following glow. Defaults on for the premium CTA. */
  glow?: boolean;
  /** Animated highlight sweep. Defaults on for filled variants. */
  shine?: boolean;
  /** Cursor ripple. Defaults on for every button except links. */
  ripple?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "plain",
      size = "md",
      loading = false,
      loadingText,
      icon,
      iconPosition = "start",
      magnetic,
      glow,
      shine,
      ripple,
      href,
      target,
      rel,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerLeave,
      className,
      children,
      type,
      disabled,
      ...rest
    },
    ref,
  ) {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const rippleId = useRef(0);

    const isPlain = variant === "plain";
    const isLink = variant === "link";
    const motionEnabled = !isPlain && !isLink;
    const magneticEnabled = magnetic ?? variant === "premium";
    const glowEnabled = glow ?? variant === "premium";
    const shineEnabled = shine ?? (motionEnabled && variant !== "outline");
    const rippleEnabled = ripple ?? !isLink;

    const spawnRipple = (event: ReactPointerEvent<HTMLElement>) => {
      if (!rippleEnabled || disabled || loading || prefersReducedMotion())
        return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.18;
      const x =
        event.clientX > 0
          ? event.clientX - rect.left - size / 2
          : rect.width / 2 - size / 2;
      const y =
        event.clientY > 0
          ? event.clientY - rect.top - size / 2
          : rect.height / 2 - size / 2;
      const id = ++rippleId.current;
      setRipples((current) => [...current.slice(-2), { id, x, y, size }]);
    };

    const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
      if (glowEnabled) {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--lx-btn-glow-x",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        event.currentTarget.style.setProperty(
          "--lx-btn-glow-y",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      }
      if (
        !magneticEnabled ||
        event.pointerType === "touch" ||
        !canUseMagnetism()
      )
        return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) * 0.1;
      const y = (event.clientY - (rect.top + rect.height / 2)) * 0.14;
      event.currentTarget.style.setProperty("--lx-btn-mx", `${x.toFixed(2)}px`);
      event.currentTarget.style.setProperty("--lx-btn-my", `${y.toFixed(2)}px`);
    };

    const resetPointer = (event: ReactPointerEvent<HTMLElement>) => {
      event.currentTarget.style.setProperty("--lx-btn-mx", "0px");
      event.currentTarget.style.setProperty("--lx-btn-my", "0px");
      event.currentTarget.style.setProperty("--lx-btn-glow-x", "50%");
      event.currentTarget.style.setProperty("--lx-btn-glow-y", "50%");
    };

    const content = (
      <>
        {icon && iconPosition === "start" ? (
          <span className="lx-btn-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
        {icon && iconPosition === "end" ? (
          <span className="lx-btn-icon lx-btn-icon--end" aria-hidden>
            {icon}
          </span>
        ) : null}
      </>
    );

    const body = isPlain ? (
      loading ? (
        <span className="lx-btn-inline-loader">
          <Loader2 aria-hidden className="lx-btn-spinner" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )
    ) : (
      <>
        <span className="lx-btn-content" data-loading={loading || undefined}>
          {content}
        </span>
        <span className="lx-btn-layer" aria-hidden>
          {shineEnabled ? <span className="lx-btn-shine" /> : null}
          {glowEnabled ? <span className="lx-btn-glow" /> : null}
          {ripples.map((item) => (
            <span
              key={item.id}
              className="lx-btn-ripple"
              style={{
                left: item.x,
                top: item.y,
                width: item.size,
                height: item.size,
              }}
              onAnimationEnd={() =>
                setRipples((current) =>
                  current.filter((ripple) => ripple.id !== item.id),
                )
              }
            />
          ))}
        </span>
        {loading ? (
          <span className="lx-btn-loader" role="status">
            <Loader2 aria-hidden className="lx-btn-spinner" />
            {loadingText ? <span>{loadingText}</span> : null}
          </span>
        ) : null}
      </>
    );

    const classes = buttonVariants({ variant, size, className });
    const shared = {
      className: classes,
      "data-variant": variant,
      "data-size": size,
      "data-loading": loading || undefined,
      "data-shine": shineEnabled || undefined,
      "data-glow": glowEnabled || undefined,
      "data-magnetic": magneticEnabled || undefined,
      "aria-busy": loading || undefined,
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        if (!isPlain) spawnRipple(event);
        onPointerDown?.(event as ReactPointerEvent<HTMLButtonElement>);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        if (!isPlain) trackPointer(event);
        onPointerMove?.(event as ReactPointerEvent<HTMLButtonElement>);
      },
      onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
        if (!isPlain) resetPointer(event);
        onPointerLeave?.(event as ReactPointerEvent<HTMLButtonElement>);
      },
    };

    if (href) {
      const {
        form: _form,
        formAction: _formAction,
        formEncType: _formEncType,
        formMethod: _formMethod,
        formNoValidate: _formNoValidate,
        formTarget: _formTarget,
        name: _name,
        value: _value,
        ...linkRest
      } = rest;
      // Anchor and button DOM event maps share the same runtime shape but not
      // their element generic. Strip button-only props before handing the rest
      // to Link.
      void [
        _form,
        _formAction,
        _formEncType,
        _formMethod,
        _formNoValidate,
        _formTarget,
        _name,
        _value,
      ];
      const anchorRest = linkRest as unknown as Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href" | "onClick" | "children" | "className"
      >;
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          onClick={(event) =>
            onClick?.(event as unknown as ReactMouseEvent<HTMLButtonElement>)
          }
          {...anchorRest}
          {...shared}
        >
          {body}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type ?? (isPlain ? undefined : "button")}
        disabled={disabled || loading}
        onClick={(event) => {
          onClick?.(event);
        }}
        {...rest}
        {...shared}
      >
        {body}
      </button>
    );
  },
);

export interface IconButtonProps extends Omit<
  ButtonProps,
  "children" | "size" | "icon" | "loading" | "loadingText"
> {
  label: string;
  children: ReactNode;
  active?: boolean;
  size?: ButtonSize;
}

export function IconButton({
  label,
  active,
  size = "icon",
  variant = "ghost",
  className,
  title,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      aria-label={label}
      title={title ?? label}
      aria-pressed={active === undefined ? undefined : active}
      data-active={active ? "true" : undefined}
      className={cn("lx-icon-btn", className)}
    >
      {children}
    </Button>
  );
}
