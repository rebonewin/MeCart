import { Skeleton } from "@/components/shop/storefront-ui";

export default function CategoriesLoading() {
  return (
    <div className="lx-page" aria-busy="true" aria-label="Loading collections">
      <div className="lx-container py-14 sm:py-20">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-7 h-14 w-3/4 max-w-xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className={index === 0 ? "h-[19rem] rounded-[1.75rem] sm:col-span-2" : "h-[19rem] rounded-[1.75rem]"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
