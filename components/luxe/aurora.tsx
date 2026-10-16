import { cn } from "@/lib/cn";

/**
 * AuroraBackdrop — fixed, GPU-cheap ambient lighting for the storefront:
 * deep-space base, perspective grid, drifting aurora blobs, edge vignette.
 * Pure CSS (no client JS), safe as a server component.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[#05060e]" />
      <div className="lx-grid-floor absolute inset-0 opacity-70" />
      <div className="lx-blob lx-drift-a left-[-14%] top-[-20%] h-[46rem] w-[46rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.5),transparent_62%)]" />
      <div className="lx-blob lx-drift-b right-[-18%] top-[4%] h-[42rem] w-[42rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.32),transparent_62%)]" />
      <div className="lx-blob lx-drift-c left-[20%] top-[48%] h-[40rem] w-[40rem] bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.28),transparent_62%)]" />
      <div className="lx-blob right-[6%] bottom-[-22%] h-[36rem] w-[36rem] bg-[radial-gradient(circle_at_center,rgba(240,196,108,0.18),transparent_62%)]" />
      <div className="lx-hairline-x absolute inset-x-0 top-0 h-px opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,transparent_38%,rgba(5,6,14,0.74)_100%)]" />
    </div>
  );
}
