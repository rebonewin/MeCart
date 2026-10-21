/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  Wifi,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/actions/orders";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout";
import { RippleButton } from "@/components/luxe/primitives";
import { Breadcrumbs, EmptyState } from "@/components/shop/storefront-ui";
import { cn } from "@/lib/cn";

const STEPS = [
  { id: 1, label: "Delivery", caption: "Where it goes" },
  { id: 2, label: "Payment", caption: "How you pay" },
  { id: 3, label: "Review", caption: "One last look" },
] as const;

const PAYMENT_METHODS = [
  {
    value: "COD",
    label: "Cash on delivery",
    description: "Pay the courier when your order arrives.",
    icon: Banknote,
  },
  {
    value: "UPI",
    label: "UPI",
    description: "Pay instantly from any UPI-enabled app.",
    icon: Smartphone,
  },
  {
    value: "CARD",
    label: "Credit / debit card",
    description: "Visa, Mastercard and American Express.",
    icon: CreditCard,
  },
  {
    value: "NETBANKING",
    label: "Net banking",
    description: "Secure transfer from your bank.",
    icon: Landmark,
  },
] as const;

const PROCESSING_STEPS = [
  "Encrypting payment",
  "Reserving inventory",
  "Creating your order",
  "Issuing the invoice",
  "Preparing your receipt",
];

const BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Kotak Mahindra",
];

function Field({
  id,
  label,
  error,
  children,
  className,
  hint,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="lx-label">
        {label}
        {hint ? <span className="ml-2 normal-case tracking-normal text-[var(--lx-faint)]">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="lx-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <nav aria-label="Checkout progress" className="mt-10">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((item) => {
          const complete = step > item.id;
          const active = step === item.id;
          return (
            <li key={item.id} className="relative">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors duration-300 sm:px-4",
                  active
                    ? "border-[var(--lx-gold)]/45 bg-[color-mix(in_srgb,var(--lx-gold)_8%,var(--lx-surface))]"
                    : "border-[var(--lx-border)] bg-[var(--lx-surface)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                    complete
                      ? "border-[var(--lx-emerald)] bg-[var(--lx-emerald)] text-white"
                      : active
                        ? "border-[var(--lx-gold)] bg-[var(--lx-gold)] text-[#241a05]"
                        : "border-[var(--lx-border-strong)] text-[var(--lx-muted)]",
                  )}
                  aria-hidden
                >
                  {complete ? <Check className="h-4 w-4" /> : String(item.id).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-xs font-semibold sm:text-sm",
                      active || complete ? "text-[var(--lx-text)]" : "text-[var(--lx-muted)]",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {item.label}
                  </span>
                  <span className="hidden truncate text-[10px] text-[var(--lx-muted)] sm:block">
                    {item.caption}
                  </span>
                </span>
              </div>
              {item.id < STEPS.length ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute -right-1.5 top-1/2 z-10 hidden h-px w-3 -translate-y-1/2 sm:block",
                    step > item.id ? "bg-[var(--lx-emerald)]" : "bg-[var(--lx-border)]",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-[var(--lx-border)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--lx-iris)] via-[var(--lx-cyan)] to-[var(--lx-gold)]"
          animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </nav>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [step, setStep] = useState(1);
  const [upiVerified, setUpiVerified] = useState(false);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      billingAddress: "",
      city: "",
      zip: "",
      paymentMethod: "COD",
      cardHolder: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      upiId: "",
      bank: "",
      items: cart.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        size: i.size ?? "",
        color: i.color ?? "",
        price: i.price,
        coverImage: i.image,
      })),
    },
  });

  const pm = useWatch({ control: form.control, name: "paymentMethod" }) ?? "COD";
  const cardNumberRaw = useWatch({ control: form.control, name: "cardNumber" }) ?? "";
  const cardHolderRaw = useWatch({ control: form.control, name: "cardHolder" }) ?? "";
  const expiryMonth = useWatch({ control: form.control, name: "expiryMonth" }) ?? "";
  const expiryYear = useWatch({ control: form.control, name: "expiryYear" }) ?? "";
  const errors = form.formState.errors;

  const subtotal = cart.subtotal;
  const tax = Math.round(subtotal * 0.08);
  const shipping = subtotal > 0 ? 49 : 0;
  const total = subtotal + tax + shipping;

  useEffect(() => {
    if (!processing) return;
    const timer = window.setInterval(() => {
      setProcessingStep((value) => Math.min(value + 1, PROCESSING_STEPS.length - 1));
    }, 560);
    return () => window.clearInterval(timer);
  }, [processing]);

  const scrollToTop = () => {
    document.getElementById("checkout-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToPayment = async () => {
    const ok = await form.trigger([
      "customerName",
      "customerEmail",
      "customerPhone",
      "shippingAddress",
      "city",
      "zip",
    ]);
    if (!ok) {
      toast.error("Please complete the delivery details");
      return;
    }
    setStep(2);
    scrollToTop();
  };

  const goToReview = async () => {
    if (pm === "CARD") {
      const values = form.getValues();
      if (!/^\d{16}$/.test(values.cardNumber ?? "")) {
        toast.error("Enter a 16-digit card number");
        return;
      }
      if (!values.cardHolder || values.cardHolder.length < 2) {
        toast.error("Enter the card holder name");
        return;
      }
      if (!/^\d{2}$/.test(values.expiryMonth ?? "") || !/^\d{2,4}$/.test(values.expiryYear ?? "")) {
        toast.error("Enter a valid expiry date");
        return;
      }
      if (!/^\d{3}$/.test(values.cvv ?? "")) {
        toast.error("Enter a 3-digit CVV");
        return;
      }
    }
    if (pm === "UPI" && !/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(form.getValues("upiId") ?? "")) {
      toast.error("Enter a valid UPI ID");
      return;
    }
    if (pm === "NETBANKING" && !form.getValues("bank")) {
      toast.error("Select your bank");
      return;
    }
    setStep(3);
    scrollToTop();
  };

  const onSubmit = async (values: CheckoutInput) => {
    if (cart.items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    setProcessingStep(0);
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await createOrder(values);
      void cart.clear();
      if (res.paymentStatus === "PAID" || values.paymentMethod === "COD") {
        const qs = new URLSearchParams({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          invoiceNumber: res.invoiceNumber,
          paymentId: res.paymentId,
          transactionId: res.transactionId,
          status: res.paymentStatus,
          total: String(res.grandTotal),
        });
        router.push(`/order-success?${qs.toString()}`);
      } else {
        const qs = new URLSearchParams({ orderId: res.orderId });
        router.push(`/checkout/failed?${qs.toString()}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setProcessing(false);
    }
  };

  if (cart.items.length === 0 && !processing) {
    return (
      <div className="lx-page">
        <div className="lx-container py-14 sm:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} className="mb-10" />
          <EmptyState
            icon={ShoppingBag}
            eyebrow="Checkout"
            title="There is nothing to checkout."
            description="Add a piece to your bag first — the atelier will keep it reserved while you complete delivery and payment."
          >
            <RippleButton href="/products" variant="primary" size="lg">
              Explore the collection <ArrowRight className="h-4 w-4" aria-hidden />
            </RippleButton>
            <Link
              href="/categories"
              className="lx-glass inline-flex h-[3.25rem] items-center gap-2 rounded-full px-7 text-sm font-medium text-[var(--lx-text)]"
            >
              Browse capsules
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="lx-page">
        <div className="lx-container flex min-h-[80svh] max-w-xl flex-col items-center justify-center py-16">
          <div className="lx-card relative w-full overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--lx-gold)_22%,transparent),transparent_68%)] blur-3xl"
            />

            <div className="relative mx-auto flex h-24 w-24 items-center justify-center" role="status" aria-live="polite">
              <span className="lx-conic-ring absolute inset-0 rounded-full opacity-80" />
              <span className="absolute inset-[3px] rounded-full bg-[var(--lx-bg)]" />
              <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--lx-border)] bg-[var(--lx-surface)] text-[var(--lx-gold)]">
                <LockKeyhole className="h-6 w-6" aria-hidden />
              </span>
            </div>

            <p className="relative mt-7 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
              Secure checkout
            </p>
            <h1 className="relative mt-3 text-3xl font-semibold tracking-tight text-[var(--lx-text)]">
              One moment, <span className="lx-serif text-[var(--lx-gold)]">please.</span>
            </h1>
            <p className="relative mx-auto mt-3 max-w-sm text-sm leading-7 text-[var(--lx-muted)]">
              We are securing your payment and preparing the atelier queue. Do not close this window.
            </p>

            <div className="relative mt-7 space-y-2.5 text-left" aria-live="polite">
              {PROCESSING_STEPS.map((label, index) => {
                const complete = index < processingStep;
                const active = index === processingStep;
                return (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                      active
                        ? "border-[var(--lx-gold)]/40 bg-[color-mix(in_srgb,var(--lx-gold)_7%,transparent)]"
                        : "border-[var(--lx-border)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        complete
                          ? "border-[var(--lx-emerald)] bg-[var(--lx-emerald)] text-white"
                          : active
                            ? "border-[var(--lx-gold)] text-[var(--lx-gold)]"
                            : "border-[var(--lx-border)] text-[var(--lx-faint)]",
                      )}
                    >
                      {complete ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        complete || active ? "text-[var(--lx-text)]" : "text-[var(--lx-muted)]",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-6 flex items-center justify-between border-t border-[var(--lx-border)] pt-5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                Order total
              </span>
              <span className="text-lg font-semibold tabular-nums text-[var(--lx-text)]">
                ${total.toFixed(2)}
              </span>
            </div>
            <p className="relative mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--lx-muted)]">
              <ShieldCheck className="h-3 w-3 text-[var(--lx-emerald)]" aria-hidden />
              256-bit encrypted · PCI-DSS aligned
            </p>
          </div>
        </div>
      </div>
    );
  }

  const methodLabel =
    PAYMENT_METHODS.find((method) => method.value === pm)?.label ?? pm;
  const cardDigits = String(cardNumberRaw).replace(/\D/g, "").slice(0, 16);
  const cardDisplay =
    cardDigits.padEnd(16, "•").match(/.{1,4}/g)?.join(" ") ?? "•••• •••• •••• ••••";
  const cardBrand = cardDigits.startsWith("4")
    ? "VISA"
    : cardDigits.startsWith("5")
      ? "MASTERCARD"
      : cardDigits.startsWith("3")
        ? "AMEX"
        : "MECART";
  const customerName = form.getValues("customerName");
  const customerEmail = form.getValues("customerEmail");
  const customerPhone = form.getValues("customerPhone");
  const shippingAddress = form.getValues("shippingAddress");
  const city = form.getValues("city");
  const zip = form.getValues("zip");

  return (
    <div id="checkout-top" className="lx-page scroll-mt-28">
      <div className="lx-container py-10 sm:py-14 lg:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Bag", href: "/cart" },
            { label: "Checkout" },
          ]}
          className="mb-8"
        />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="lx-eyebrow">Secure checkout</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-4xl">
              Complete your <span className="lx-serif text-[var(--lx-gold)]">order</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--lx-muted)]">
              Three calm steps. Encrypted payment. Atelier care from dispatch to doorstep.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Return to bag
          </Link>
        </div>

        <StepIndicator step={step} />

        <form
          onSubmit={form.handleSubmit(onSubmit as any)}
          className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23.5rem]"
        >
          <div>
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.section
                  key="delivery"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  aria-labelledby="checkout-delivery-heading"
                >
                  <div className="lx-card overflow-hidden rounded-[1.75rem]">
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--lx-border)] p-6 sm:p-8">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                          Step 01
                        </p>
                        <h2 id="checkout-delivery-heading" className="mt-2 text-xl font-semibold text-[var(--lx-text)]">
                          Delivery details
                        </h2>
                        <p className="mt-1 text-xs text-[var(--lx-muted)]">
                          Where should the courier meet you?
                        </p>
                      </div>
                      <Truck className="h-5 w-5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                    </div>

                    <div className="space-y-5 p-6 sm:p-8">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="customerName" label="Full name" error={errors.customerName?.message}>
                          <input
                            id="customerName"
                            autoComplete="name"
                            placeholder="Alex Morgan"
                            aria-invalid={Boolean(errors.customerName)}
                            aria-describedby={errors.customerName ? "customerName-error" : undefined}
                            className={cn("lx-field", errors.customerName && "lx-field-error")}
                            {...form.register("customerName")}
                          />
                        </Field>
                        <Field id="customerEmail" label="Email" error={errors.customerEmail?.message}>
                          <input
                            id="customerEmail"
                            type="email"
                            autoComplete="email"
                            placeholder="alex@example.com"
                            aria-invalid={Boolean(errors.customerEmail)}
                            aria-describedby={errors.customerEmail ? "customerEmail-error" : undefined}
                            className={cn("lx-field", errors.customerEmail && "lx-field-error")}
                            {...form.register("customerEmail")}
                          />
                        </Field>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="customerPhone" label="Phone" error={errors.customerPhone?.message}>
                          <input
                            id="customerPhone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+1 555 010 2030"
                            aria-invalid={Boolean(errors.customerPhone)}
                            aria-describedby={errors.customerPhone ? "customerPhone-error" : undefined}
                            className={cn("lx-field", errors.customerPhone && "lx-field-error")}
                            {...form.register("customerPhone")}
                          />
                        </Field>
                        <Field id="zip" label="Postal code" error={errors.zip?.message}>
                          <input
                            id="zip"
                            autoComplete="postal-code"
                            placeholder="10001"
                            aria-invalid={Boolean(errors.zip)}
                            aria-describedby={errors.zip ? "zip-error" : undefined}
                            className={cn("lx-field", errors.zip && "lx-field-error")}
                            {...form.register("zip")}
                          />
                        </Field>
                      </div>

                      <Field id="shippingAddress" label="Street address" error={errors.shippingAddress?.message}>
                        <textarea
                          id="shippingAddress"
                          autoComplete="street-address"
                          rows={3}
                          placeholder="Apartment, suite, street"
                          aria-invalid={Boolean(errors.shippingAddress)}
                          aria-describedby={errors.shippingAddress ? "shippingAddress-error" : undefined}
                          className={cn("lx-field resize-none", errors.shippingAddress && "lx-field-error")}
                          {...form.register("shippingAddress")}
                        />
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="city" label="City" error={errors.city?.message}>
                          <input
                            id="city"
                            autoComplete="address-level2"
                            placeholder="New York"
                            aria-invalid={Boolean(errors.city)}
                            aria-describedby={errors.city ? "city-error" : undefined}
                            className={cn("lx-field", errors.city && "lx-field-error")}
                            {...form.register("city")}
                          />
                        </Field>
                        <Field id="billingAddress" label="Billing address" hint="optional">
                          <textarea
                            id="billingAddress"
                            autoComplete="billing street-address"
                            rows={1}
                            placeholder="Same as delivery"
                            className="lx-field resize-none"
                            {...form.register("billingAddress")}
                          />
                        </Field>
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/50 px-4 py-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lx-emerald)]" aria-hidden />
                        <p className="text-[11px] leading-5 text-[var(--lx-muted)]">
                          Your details are used only to fulfil this order. We never sell customer data.
                        </p>
                      </div>

                      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                          href="/cart"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)]"
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to bag
                        </Link>
                        <RippleButton type="button" variant="primary" size="lg" onClick={() => void goToPayment()}>
                          Continue to payment
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </RippleButton>
                      </div>
                    </div>
                  </div>
                </motion.section>
              ) : null}

              {step === 2 ? (
                <motion.section
                  key="payment"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  aria-labelledby="checkout-payment-heading"
                >
                  <div className="lx-card overflow-hidden rounded-[1.75rem]">
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--lx-border)] p-6 sm:p-8">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                          Step 02
                        </p>
                        <h2 id="checkout-payment-heading" className="mt-2 text-xl font-semibold text-[var(--lx-text)]">
                          Payment
                        </h2>
                        <p className="mt-1 text-xs text-[var(--lx-muted)]">
                          Choose how you would like to settle the order.
                        </p>
                      </div>
                      <LockKeyhole className="h-5 w-5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                    </div>

                    <div className="space-y-5 p-6 sm:p-8">
                      <div role="radiogroup" aria-label="Payment method" className="grid gap-2.5 sm:grid-cols-2">
                        {PAYMENT_METHODS.map((method) => {
                          const selected = pm === method.value;
                          return (
                            <label key={method.value} className="relative block cursor-pointer">
                              <input
                                type="radio"
                                value={method.value}
                                className="peer sr-only"
                                {...form.register("paymentMethod")}
                              />
                              <span
                                className={cn(
                                  "flex h-full items-start gap-3 rounded-xl border p-4 transition duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--lx-gold)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--lx-bg)]",
                                  selected
                                    ? "border-[var(--lx-gold)]/55 bg-[color-mix(in_srgb,var(--lx-gold)_8%,var(--lx-surface))] shadow-[0_12px_30px_-24px_rgba(169,120,46,0.6)]"
                                    : "border-[var(--lx-border)] bg-[var(--lx-surface)] hover:border-[var(--lx-border-strong)]",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                                    selected
                                      ? "border-[var(--lx-gold)]/40 bg-[var(--lx-gold)]/12 text-[var(--lx-gold)]"
                                      : "border-[var(--lx-border)] text-[var(--lx-muted)]",
                                  )}
                                >
                                  <method.icon className="h-4 w-4" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-xs font-semibold text-[var(--lx-text)]">
                                    {method.label}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] leading-4 text-[var(--lx-muted)]">
                                    {method.description}
                                  </span>
                                </span>
                                <span
                                  className={cn(
                                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                    selected
                                      ? "border-[var(--lx-gold)] bg-[var(--lx-gold)] text-[#241a05]"
                                      : "border-[var(--lx-border-strong)]",
                                  )}
                                  aria-hidden
                                >
                                  {selected ? <Check className="h-2.5 w-2.5" /> : null}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        {pm === "COD" ? (
                          <motion.div
                            key="cod"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start gap-3 rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/50 px-4 py-3"
                          >
                            <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                            <p className="text-[11px] leading-5 text-[var(--lx-muted)]">
                              Pay the courier in cash when your order arrives. Please have the exact
                              total ready — ${total.toFixed(2)}.
                            </p>
                          </motion.div>
                        ) : null}

                        {pm === "UPI" ? (
                          <motion.div
                            key="upi"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 rounded-xl border border-[var(--lx-border)] p-4"
                          >
                            <Field id="upiId" label="UPI ID" error={errors.upiId?.message}>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  id="upiId"
                                  placeholder="demo@upi"
                                  autoComplete="off"
                                  className="lx-field flex-1"
                                  aria-invalid={Boolean(errors.upiId)}
                                  {...form.register("upiId")}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (form.getValues("upiId")) setUpiVerified(true);
                                    else toast.error("Enter a UPI ID first");
                                  }}
                                  className="lx-glass inline-flex h-12 items-center justify-center rounded-xl px-5 text-xs font-medium text-[var(--lx-text)] transition hover:border-[var(--lx-gold)]/40"
                                >
                                  Verify
                                </button>
                              </div>
                            </Field>
                            {upiVerified ? (
                              <p className="flex items-center gap-1.5 text-[11px] text-[var(--lx-emerald)]">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> UPI ID verified — demo only.
                              </p>
                            ) : (
                              <p className="text-[10px] text-[var(--lx-muted)]">
                                Use any valid-looking UPI ID. This is a demo checkout; no money moves.
                              </p>
                            )}
                          </motion.div>
                        ) : null}

                        {pm === "CARD" ? (
                          <motion.div
                            key="card"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                          >
                            <div
                              aria-hidden
                              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#141830] via-[#0a0c1a] to-[#05060e] p-5 text-white shadow-[0_30px_60px_-36px_rgba(0,0,0,0.9)] sm:p-6"
                            >
                              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(240,196,108,0.3),transparent_68%)] blur-2xl" />
                              <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_68%)] blur-2xl" />
                              <div className="relative flex items-start justify-between">
                                <span className="text-[13px] font-semibold tracking-[0.28em] text-white/90">
                                  MECART
                                </span>
                                <span className="font-mono text-[8px] uppercase tracking-[0.26em] text-[var(--lx-gold)]">
                                  Atelier card
                                </span>
                              </div>
                              <div className="relative mt-7 flex items-center gap-3">
                                <span className="flex h-7 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[#f5d08a] to-[#b88433]">
                                  <span className="h-3 w-4 rounded-sm border border-[#6b4a10]/40" />
                                </span>
                                <Wifi className="h-5 w-5 rotate-90 text-white/40" aria-hidden />
                              </div>
                              <p className="relative mt-5 font-mono text-base tracking-[0.16em] text-white sm:text-lg">
                                {cardDisplay}
                              </p>
                              <div className="relative mt-6 flex items-end justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="font-mono text-[7px] uppercase tracking-[0.24em] text-white/35">
                                    Card holder
                                  </p>
                                  <p className="mt-1 truncate text-[11px] uppercase tracking-[0.12em] text-white/80">
                                    {cardHolderRaw || "Your name"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono text-[7px] uppercase tracking-[0.24em] text-white/35">
                                    Expires
                                  </p>
                                  <p className="mt-1 font-mono text-[11px] text-white/80">
                                    {expiryMonth || "MM"}/{expiryYear || "YY"}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold tracking-[0.12em] text-white/75">
                                  {cardBrand}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field
                                id="cardHolder"
                                label="Card holder"
                                error={errors.cardHolder?.message}
                                className="sm:col-span-2"
                              >
                                <input
                                  id="cardHolder"
                                  autoComplete="cc-name"
                                  placeholder="Name on card"
                                  className="lx-field"
                                  {...form.register("cardHolder")}
                                />
                              </Field>
                              <Field
                                id="cardNumber"
                                label="Card number"
                                error={errors.cardNumber?.message}
                                className="sm:col-span-2"
                              >
                                <input
                                  id="cardNumber"
                                  inputMode="numeric"
                                  autoComplete="cc-number"
                                  placeholder="4242 4242 4242 4242"
                                  maxLength={16}
                                  className="lx-field font-mono tracking-[0.12em]"
                                  {...form.register("cardNumber")}
                                />
                              </Field>
                              <Field id="expiryMonth" label="Expiry month" error={errors.expiryMonth?.message}>
                                <input
                                  id="expiryMonth"
                                  inputMode="numeric"
                                  autoComplete="cc-exp-month"
                                  placeholder="MM"
                                  maxLength={2}
                                  className="lx-field font-mono"
                                  {...form.register("expiryMonth")}
                                />
                              </Field>
                              <Field id="expiryYear" label="Expiry year" error={errors.expiryYear?.message}>
                                <input
                                  id="expiryYear"
                                  inputMode="numeric"
                                  autoComplete="cc-exp-year"
                                  placeholder="YY"
                                  maxLength={4}
                                  className="lx-field font-mono"
                                  {...form.register("expiryYear")}
                                />
                              </Field>
                              <Field id="cvv" label="CVV" error={errors.cvv?.message}>
                                <input
                                  id="cvv"
                                  inputMode="numeric"
                                  autoComplete="cc-csc"
                                  placeholder="•••"
                                  maxLength={3}
                                  className="lx-field font-mono"
                                  {...form.register("cvv")}
                                />
                              </Field>
                            </div>
                            <p className="flex items-center gap-1.5 text-[10px] text-[var(--lx-muted)]">
                              <LockKeyhole className="h-3 w-3" aria-hidden /> Demo card details — no real
                              charge is made.
                            </p>
                          </motion.div>
                        ) : null}

                        {pm === "NETBANKING" ? (
                          <motion.div
                            key="netbanking"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-[var(--lx-border)] p-4"
                          >
                            <Field id="bank" label="Your bank" error={errors.bank?.message}>
                              <select id="bank" className="lx-field" {...form.register("bank")}>
                                <option value="">Select bank</option>
                                {BANKS.map((bank) => (
                                  <option key={bank} value={bank}>
                                    {bank}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <p className="mt-3 text-[10px] text-[var(--lx-muted)]">
                              You will be redirected to your bank&apos;s secure page in a live environment.
                            </p>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            scrollToTop();
                          }}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)]"
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to delivery
                        </button>
                        <RippleButton type="button" variant="primary" size="lg" onClick={() => void goToReview()}>
                          Review order
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </RippleButton>
                      </div>
                    </div>
                  </div>
                </motion.section>
              ) : null}

              {step === 3 ? (
                <motion.section
                  key="review"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  aria-labelledby="checkout-review-heading"
                >
                  <div className="lx-card overflow-hidden rounded-[1.75rem]">
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--lx-border)] p-6 sm:p-8">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                          Step 03
                        </p>
                        <h2 id="checkout-review-heading" className="mt-2 text-xl font-semibold text-[var(--lx-text)]">
                          Review & place
                        </h2>
                        <p className="mt-1 text-xs text-[var(--lx-muted)]">
                          Confirm the details before the atelier begins packing.
                        </p>
                      </div>
                      <Sparkles className="h-5 w-5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                    </div>

                    <div className="space-y-6 p-6 sm:p-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-[var(--lx-border)] p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                              Delivery to
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setStep(1);
                                scrollToTop();
                              }}
                              className="text-[10px] text-[var(--lx-gold)] transition hover:text-[var(--lx-text)]"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-medium text-[var(--lx-text)]">{customerName}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lx-muted)]">
                            {shippingAddress}
                            <br />
                            {city} {zip}
                            <br />
                            {customerPhone}
                          </p>
                          <p className="mt-1 truncate text-xs text-[var(--lx-muted)]">{customerEmail}</p>
                        </div>

                        <div className="rounded-xl border border-[var(--lx-border)] p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                              Payment
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setStep(2);
                                scrollToTop();
                              }}
                              className="text-[10px] text-[var(--lx-gold)] transition hover:text-[var(--lx-text)]"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-medium text-[var(--lx-text)]">{methodLabel}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lx-muted)]">
                            {pm === "CARD"
                              ? `Card ending ${(form.getValues("cardNumber") ?? "").slice(-4) || "••••"}`
                              : pm === "UPI"
                                ? form.getValues("upiId") || "UPI on delivery"
                                : pm === "NETBANKING"
                                  ? form.getValues("bank") || "Bank selected"
                                  : "Pay the courier on arrival"}
                          </p>
                          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--lx-emerald)]">
                            <ShieldCheck className="h-3 w-3" aria-hidden /> Encrypted & secure
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                            Objects in this order
                          </p>
                          <span className="text-[10px] text-[var(--lx-muted)]">{cart.count} items</span>
                        </div>
                        <ul className="mt-3 divide-y divide-[var(--lx-border)] rounded-xl border border-[var(--lx-border)]">
                          {cart.items.map((item) => (
                            <li
                              key={`${item.productId}-${item.size ?? ""}-${item.color ?? ""}`}
                              className="flex items-center gap-3 p-3"
                            >
                              <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--lx-surface-2)]">
                                {item.image ? (
                                  <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium text-[var(--lx-text)]">
                                  {item.name}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-[var(--lx-muted)]">
                                  {[item.size, item.color].filter(Boolean).join(" · ") || "One size"} · Qty{" "}
                                  {item.quantity}
                                </span>
                              </span>
                              <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--lx-text)]">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/50 px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lx-emerald)]" aria-hidden />
                        <p className="text-[11px] leading-5 text-[var(--lx-muted)]">
                          By placing this order you agree to the atelier terms, 7-day returns policy and
                          secure payment processing. A receipt will be issued instantly.
                        </p>
                      </div>

                      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setStep(2);
                            scrollToTop();
                          }}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)]"
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to payment
                        </button>
                        <RippleButton type="submit" variant="primary" size="lg" loading={processing}>
                          Place order · ${total.toFixed(2)}
                          <LockKeyhole className="h-4 w-4" aria-hidden />
                        </RippleButton>
                      </div>
                    </div>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="lx-card overflow-hidden rounded-[1.75rem]">
              <div className="border-b border-[var(--lx-border)] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-[var(--lx-text)]">
                    Your summary
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                    {cart.count} {cart.count === 1 ? "item" : "items"}
                  </span>
                </div>

                <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <li
                      key={`${item.productId}-${item.size ?? ""}-${item.color ?? ""}`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--lx-border)] bg-[var(--lx-surface-2)]">
                        {item.image ? (
                          <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--lx-text)] px-1 text-[8px] font-bold text-[var(--lx-bg)]">
                          {item.quantity}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-[var(--lx-text)]">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[9px] text-[var(--lx-muted)]">
                          {[item.size, item.color].filter(Boolean).join(" · ") || "One size"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[var(--lx-text)]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[var(--lx-muted)]">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums text-[var(--lx-text)]">${subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-[var(--lx-muted)]">
                    <dt className="flex items-center gap-1.5">
                      Shipping <Truck className="h-3 w-3" aria-hidden />
                    </dt>
                    <dd className="tabular-nums text-[var(--lx-text)]">${shipping.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-[var(--lx-muted)]">
                    <dt>Estimated tax</dt>
                    <dd className="tabular-nums text-[var(--lx-text)]">${tax.toFixed(2)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-end justify-between border-t border-[var(--lx-border)] pt-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                      Total due
                    </p>
                    <p className="mt-1 text-[9px] text-[var(--lx-faint)]">Tax & shipping included</p>
                  </div>
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--lx-text)]">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-[var(--lx-muted)]">
                  <LockKeyhole className="h-3 w-3" aria-hidden /> Encrypted checkout · PCI-DSS aligned
                </p>

                <div className="mt-4 space-y-2 border-t border-[var(--lx-border)] pt-4">
                  {[
                    { icon: Truck, text: "Tracked delivery within 3–5 business days" },
                    { icon: ShieldCheck, text: "Authenticity guaranteed on every order" },
                    { icon: Sparkles, text: "Hand-packed by the atelier" },
                  ].map((item) => (
                    <p key={item.text} className="flex items-center gap-2 text-[10px] text-[var(--lx-muted)]">
                      <item.icon className="h-3 w-3 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                      {item.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
