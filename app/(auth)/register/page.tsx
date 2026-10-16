import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const resume = sp.resume === "password";
  const email = typeof sp.email === "string" ? sp.email.trim().toLowerCase() : "";
  return <RegisterForm resumeEmail={resume ? email : ""} />;
}
