"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteReviewAction, updateReviewStatusAction } from "@/lib/actions/reviews";
import type { ReviewStatus } from "@/types/database";

export type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  productName: string;
  status: ReviewStatus;
  createdAt: string;
};

const statusStyles: Record<ReviewStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="whitespace-nowrap text-amber-500" title={`${rating} / 5`}>
      {"\u2605".repeat(value)}
      <span className="text-gray-300 dark:text-gray-600">{"\u2605".repeat(5 - value)}</span>
    </span>
  );
}

export function ReviewsTable({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const run = (action: () => Promise<void>, success: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  const handleStatus = (review: AdminReview, status: ReviewStatus) => {
    run(
      () => updateReviewStatusAction(review.id, status),
      status === "APPROVED" ? "Review approved" : "Review rejected",
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    run(() => deleteReviewAction(id), "Review deleted");
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
              <th className="p-3">Rating</th>
              <th className="p-3">Product</th>
              <th className="p-3">Review</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-gray-100 align-top dark:border-gray-800">
                <td className="p-3">
                  <Stars rating={review.rating} />
                </td>
                <td className="p-3">
                  <p className="font-medium">{review.productName}</p>
                  <p className="text-xs text-gray-500">{review.author}</p>
                </td>
                <td className="max-w-md p-3">
                  {review.title && <p className="font-medium">{review.title}</p>}
                  <p className="text-gray-600 dark:text-gray-400">{review.body ?? "-"}</p>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[review.status]}`}>
                    {review.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {review.status !== "APPROVED" && (
                      <Button
                        onClick={() => handleStatus(review, "APPROVED")}
                        disabled={pending}
                        className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-400"
                      >
                        Approve
                      </Button>
                    )}
                    {review.status !== "REJECTED" && (
                      <Button
                        onClick={() => handleStatus(review, "REJECTED")}
                        disabled={pending}
                        className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 disabled:opacity-50 dark:border-amber-800 dark:text-amber-400"
                      >
                        Reject
                      </Button>
                    )}
                    <Button
                      onClick={() => setDeleteTarget(review.id)}
                      disabled={pending}
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50 dark:border-rose-800 dark:text-rose-400"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
