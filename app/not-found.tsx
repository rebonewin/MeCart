import Link from "next/link";
import { ArrowRight, Mail, Store } from "lucide-react";
import { LiquidStage } from "@/components/luxe/webgl/liquid-stage";
import { RiderModel } from "@/components/storefront/rider/rider-model";

/**
 * The lost pages. MECO keeps driving in case something turns up.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="lx-dark-scene relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--lx-bg)] px-4 py-16 text-center text-[var(--lx-text)]"
    >
      <LiquidStage variant="hero" intensity={0.62} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_84%_at_50%_-10%,transparent_36%,rgba(11,11,15,0.82)_100%)]"
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[var(--lx-gold)]">
          Error · 404
        </p>
        <h1 className="lx-display mt-5 text-white">
          Lost in
          <br />
          <span className="lx-editorial text-[var(--lx-gold)]">the stacks.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-white/65 sm:text-base">
          This corridor of the atelier does not exist — perhaps the piece was
          re-hung, renamed, or sold moments ago. The shelf is still here.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="lx-btn lx-btn--premium lx-btn--lg">
            Back to the maison
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/categories" className="lx-btn lx-btn--glass lx-btn--lg text-white">
            <Store className="h-4 w-4" aria-hidden />
            Browse collections
          </Link>
          <Link href="/contact" className="lx-btn lx-btn--ghost lx-btn--lg">
            <Mail className="h-4 w-4" aria-hidden />
            Write to client care
          </Link>
        </div>
      </div>

      {/* MECO, still on patrol */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[6%] z-0 flex justify-center"
      >
        <div className="lx-meco-cross opacity-70">
          <RiderModel
            phase="drive"
            tier={1}
            waving={false}
            headlight
            reduced={false}
            className="h-24 w-36 sm:h-32 sm:w-48"
          />
        </div>
      </div>
    </main>
  );
}
