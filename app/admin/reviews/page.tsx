import Link from "next/link";
import { ReviewsTable, type AdminReview } from "@/components/admin/reviews-table";
import { getReviewStats, listAllReviews } from "@/lib/repositories/reviews";
import type { ReviewStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: { label: string; value?: ReviewStatus }[] = [
  { label: "All" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const requested = sp?.status;
  const status: ReviewStatus | undefined =
    requested === "PENDING" || requested === "APPROVED" || requested === "REJECTED" ? requested : undefined;

  const [stats, reviews] = await Promise.all([getReviewStats(), listAllReviews(status)]);

  const cards = [
    { label: "Total Reviews", value: stats.total.toLocaleString("en-US") },
    { label: "Pending", value: stats.pending.toLocaleString("en-US") },
    { label: "Approved", value: stats.approved.toLocaleString("en-US") },
    { label: "Average Rating", value: `${stats.averageRating.toFixed(1)} / 5` },
  ];

  const rows: AdminReview[] = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    author: review.author,
    productName: review.productName,
    status: review.status,
    createdAt: review.created_at,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.value ? status === filter.value : !status;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/admin/reviews?status=${filter.value}` : "/admin/reviews"}
              className={
                active
                  ? "rounded-full bg-indigo-600 px-3 py-1.5 font-medium text-white"
                  : "rounded-full border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <ReviewsTable reviews={rows} />
    </div>
  );
}
