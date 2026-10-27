import { Star } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerReviews } from "@/lib/repositories/seller";
import { dateLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader, SellerStat, sellerStatusTone } from "@/components/seller/ui";
import { SellerReviewReply } from "@/components/seller/review-reply";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews | MeCart Seller" };

export default async function SellerReviewsPage() {
  const context = await requireSellerContext();
  const reviews = await listSellerReviews(context.vendor.id);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const unreplied = reviews.filter((review) => !review.vendor_reply).length;

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Reputation"
        title="Reviews"
        description="Verified buyer feedback for your products. Replies are public and linked to the review."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SellerStat label="Average rating" value={average ? average.toFixed(2) : "—"} hint={`${reviews.length} reviews`} icon={Star} tone="gold" />
        <SellerStat label="Awaiting reply" value={String(unreplied)} tone={unreplied ? "rose" : "default"} icon={Star} />
        <SellerStat label="5-star share" value={reviews.length ? `${Math.round((reviews.filter((review) => review.rating === 5).length / reviews.length) * 100)}%` : "—"} tone="green" icon={Star} />
      </div>

      {reviews.length === 0 ? (
        <SellerEmpty title="No reviews yet" description="After a delivered order, customers can leave verified feedback on your products." />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <SellerCard key={review.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5 text-[#E6C768]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "text-slate-700"}`} />
                      ))}
                    </span>
                    <span className="text-xs text-slate-500">{review.rating}.0</span>
                    <SellerBadge tone={sellerStatusTone(review.status)}>{review.status}</SellerBadge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{review.title || "Verified purchase"}</p>
                  <p className="mt-1 text-xs text-slate-500">{review.productName} · {review.author_name || "Customer"} · {dateLabel(review.created_at)}</p>
                </div>
                <SellerReviewReply reviewId={review.id} existingReply={review.vendor_reply} />
              </div>
              {review.body && <p className="mt-3 text-sm leading-6 text-slate-300">{review.body}</p>}
              {review.vendor_reply && (
                <div className="mt-4 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.05] p-3.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]">Your reply</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{review.vendor_reply}</p>
                </div>
              )}
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
