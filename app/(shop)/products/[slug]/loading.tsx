import { Skeleton } from "@/components/shop/storefront-ui";

export default function ProductLoading() {
  return (
    <div className="lx-page" aria-busy="true" aria-label="Loading product">
      <div className="lx-container py-10 sm:py-14">
        <Skeleton className="h-3 w-56" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
          <div className="flex gap-4">
            <div className="hidden w-[4.5rem] flex-col gap-2 sm:flex">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="aspect-[4/5] flex-1 rounded-[1.75rem]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-12 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-14 w-full rounded-full" />
            <Skeleton className="h-14 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
