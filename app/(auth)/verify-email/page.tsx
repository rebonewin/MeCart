import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const preset = typeof sp.email === "string" ? sp.email : "";
  return <VerifyEmailForm presetEmail={preset.trim().toLowerCase()} />;
}
