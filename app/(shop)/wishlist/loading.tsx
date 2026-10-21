import { Skeleton } from "@/components/shop/storefront-ui";

export default function WishlistLoading() {
  return (
    <div className="lx-page" aria-busy="true" aria-label="Loading saved pieces">
      <div className="lx-container py-14">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-7 h-14 w-80" />
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
