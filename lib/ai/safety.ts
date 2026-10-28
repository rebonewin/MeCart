/**
 * Runtime-safe helpers for assistant data that may be persisted in the browser.
 *
 * Action links normally come from the local assistant or the server-owned meta
 * event. Persisted conversations are user-editable storage, so links are
 * re-validated before they reach an anchor element.
 */
export function isSafeAssistantHref(href: string) {
  if (typeof href !== "string") return false;
  const value = href.trim();
  if (!value || value.length > 300) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  if (value.startsWith("mailto:")) return true;
  return /^https?:\/\//i.test(value);
}

/**
 * Product slugs are always rendered under `/products/`. Reject values that
 * could escape that path or smuggle a scheme into the href.
 */
export function isSafeProductSlug(slug: string) {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug.length <= 200 &&
    !slug.includes("..") &&
    !slug.includes("//") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(slug)
  );
}
