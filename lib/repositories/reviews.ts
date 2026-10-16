import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { ReviewRow, ReviewStatus } from "@/types/database";

export type ReviewWithAuthor = ReviewRow & { author: string; productName: string };

export async function listReviewsForProduct(productId: string): Promise<ReviewRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false }),
  );
}

export async function listAllReviews(status?: ReviewStatus): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient();
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(300);
  if (status) query = query.eq("status", status);
  const reviews = unwrapList(await query);
  if (!reviews.length) return [];

  const [profilesRes, productsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, username"),
    supabase.from("products").select("id, name"),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]));

  return reviews.map((review) => ({
    ...review,
    author:
      review.author_name ??
      profileMap.get(review.user_id ?? "")?.full_name ??
      profileMap.get(review.user_id ?? "")?.username ??
      "Customer",
    productName: productMap.get(review.product_id)?.name ?? "Product",
  }));
}

export async function createReview(input: {
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  images?: string[];
}) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase.from("reviews").insert({
      product_id: input.productId,
      user_id: input.userId,
      author_name: input.authorName,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body ?? null,
      images: input.images ?? [],
      status: "APPROVED",
    }),
  );
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("reviews").update({ status }).eq("id", id));
}

export async function deleteReview(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("reviews").delete().eq("id", id));
}

export async function getReviewStats(): Promise<{ total: number; pending: number; approved: number; averageRating: number }> {
  const supabase = await createClient();
  const reviews = unwrapList(await supabase.from("reviews").select("rating, status"));
  const approved = reviews.filter((r) => r.status === "APPROVED");
  return {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "PENDING").length,
    approved: approved.length,
    averageRating: approved.length
      ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
      : 0,
  };
}
