import { ProductGridSkeleton, Skeleton } from "@/components/shop/storefront-ui";

export default function CategoryLoading() {
  return (
    <div className="lx-page" aria-busy="true" aria-label="Loading collection">
      <div className="lx-container py-12 sm:py-16">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-8 h-[22rem] rounded-[2rem] sm:h-[26rem]" />
        <div className="mt-10 flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <ProductGridSkeleton count={8} className="mt-8 lg:grid-cols-4" />
      </div>
    </div>
  );
}
