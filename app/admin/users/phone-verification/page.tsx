import { auth } from "@/lib/auth";
import { listPhoneVerificationUsers } from "@/lib/actions/phone-otp";
import { PhoneVerificationTable } from "@/components/admin/phone-verification-table";

export const dynamic = "force-dynamic";

export default async function AdminPhoneVerificationPage() {
  await auth();
  const users = await listPhoneVerificationUsers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Phone Verification</h1>
        <p className="text-sm text-gray-500">Monitor phone OTP verification status.</p>
      </div>
      <PhoneVerificationTable users={users} />
    </div>
  );
}