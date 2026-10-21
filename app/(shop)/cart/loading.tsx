import { Skeleton } from "@/components/shop/storefront-ui";

export default function CartLoading() {
  return (
    <div className="lx-page" aria-busy="true" aria-label="Loading bag">
      <div className="lx-container py-14">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-7 h-14 w-72" />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[26rem] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
