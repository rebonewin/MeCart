import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const preset = typeof sp.email === "string" ? sp.email : "";
  return <LoginForm presetEmail={preset.trim().toLowerCase()} />;
}
