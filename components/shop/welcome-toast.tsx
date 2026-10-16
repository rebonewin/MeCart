"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Shows the post-registration welcome toast when the user lands on the
 * storefront with `?welcome=1` (set by the registration success redirect).
 * The query param is stripped so refreshing does not re-trigger the toast.
 */
export function WelcomeToast() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") !== "1") return;

    toast.success("Welcome to MeCart! 🎉 Your account is ready.");

    params.delete("welcome");
    const query = params.toString();
    const clean = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    router.replace(clean, { scroll: false });
  }, [router]);

  return null;
}
