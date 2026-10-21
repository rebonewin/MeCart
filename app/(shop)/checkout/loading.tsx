import { Skeleton } from "@/components/shop/storefront-ui";

export default function CheckoutLoading() {
  return (
    <div className="lx-page" aria-busy="true" aria-label="Loading checkout">
      <div className="lx-container py-12">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-6 h-10 w-80" />
        <div className="mt-8 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_23.5rem]">
          <Skeleton className="h-[34rem] rounded-[1.75rem]" />
          <Skeleton className="h-[28rem] rounded-[1.75rem]" />
        </div>
      </div>
    </div>
  );
}
