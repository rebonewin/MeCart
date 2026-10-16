import { auth } from "@/lib/auth";
import { listEmailVerificationUsers } from "@/lib/actions/email-otp";
import { EmailVerificationTable } from "@/components/admin/email-verification-table";

export const dynamic = "force-dynamic";

export default async function AdminEmailVerificationPage() {
  await auth();
  const users = await listEmailVerificationUsers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Verification</h1>
        <p className="text-sm text-gray-500">
          Monitor verified, pending, and failed email verification requests.
        </p>
      </div>
      <EmailVerificationTable users={users.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        account_status: user.account_status,
        email_verified_at: user.email_verified_at,
        verification_attempts: user.verification_attempts,
        failed_otp_attempts: user.failed_otp_attempts ?? 0,
        last_otp_sent_at: user.last_otp_sent_at,
        is_active: user.is_active,
        created_at: user.created_at,
      }))} />
    </div>
  );
}