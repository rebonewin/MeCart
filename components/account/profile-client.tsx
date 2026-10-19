"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { updateProfile, changePassword } from "@/lib/actions/auth";
import { createAddress, updateAddress, deleteAddress } from "@/lib/actions/addresses";
import { PhoneSettings, type PhoneInfo } from "@/components/account/phone-settings";

type Address = {
  id: string;
  label?: string | null;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

export function ProfileClient({
  initialUser,
  initialAddresses,
  initialPhone,
}: {
  initialUser: { name?: string | null; email?: string | null; username?: string | null; role?: string | null };
  initialAddresses: Address[];
  initialPhone: PhoneInfo;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [name, setName] = useState(initialUser.name ?? "");
  const [email, setEmail] = useState(initialUser.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addr, setAddr] = useState({
    label: "", name: "", phone: "", line1: "", line2: "", city: "", state: "", zip: "", country: "India", isDefault: false,
  });
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await updateProfile({ name, email }); toast.success("Profile updated"); router.refresh(); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await changePassword({ currentPassword, newPassword }); toast.success("Password changed"); setCurrentPassword(""); setNewPassword(""); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const submitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddrId) {
        await updateAddress(editingAddrId, { ...addr, isDefault: addr.isDefault });
        setAddresses((prev) => prev.map((a) => (a.id === editingAddrId ? { ...a, ...addr, isDefault: addr.isDefault } : a)));
        toast.success("Address updated");
      } else {
        await createAddress({ ...addr, isDefault: addr.isDefault });
        toast.success("Address added");
        router.refresh();
      }
      setEditingAddrId(null);
      setAddr({ label: "", name: "", phone: "", line1: "", line2: "", city: "", state: "", zip: "", country: "India", isDefault: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Link
          href="/profile/security"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <ShieldCheck className="h-4 w-4" /> Security &amp; 2FA
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-3">
          <p className="text-sm text-gray-500">Username: {initialUser.username} | Role: {initialUser.role}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Save Profile</button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <form onSubmit={submitPassword} className="mt-4 space-y-3">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" minLength={8} className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Change Password</button>
        </form>
      </section>

      <PhoneSettings initialPhone={initialPhone} />

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Addresses</h2>
        <div className="mt-4 space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.label || "Address"} {a.isDefault && <span className="text-xs text-emerald-600">(Default)</span>}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAddrId(a.id); setAddr({ label: a.label ?? "", name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, zip: a.zip, country: a.country, isDefault: a.isDefault }); }} className="text-indigo-600">Edit</button>
                  <button onClick={() => removeAddress(a.id)} className="text-rose-600">Delete</button>
                </div>
              </div>
              <p>{a.name} - {a.phone}</p>
              <p>{a.line1} {a.line2}</p>
              <p>{a.city}, {a.state} {a.zip}, {a.country}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submitAddress} className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold">{editingAddrId ? "Edit Address" : "Add Address"}</h3>
          <input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Label" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} placeholder="Name" required className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="Phone" required className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="Line 1" required className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} placeholder="Line 2" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <div className="grid grid-cols-2 gap-3">
            <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City" required className="rounded border px-3 py-2 dark:bg-gray-800" />
            <input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} placeholder="State" required className="rounded border px-3 py-2 dark:bg-gray-800" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} placeholder="Zip" required className="rounded border px-3 py-2 dark:bg-gray-800" />
            <input value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} placeholder="Country" required className="rounded border px-3 py-2 dark:bg-gray-800" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addr.isDefault} onChange={(e) => setAddr({ ...addr, isDefault: e.target.checked })} /> Default
          </label>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">{editingAddrId ? "Update Address" : "Add Address"}</button>
          {editingAddrId && <button type="button" onClick={() => { setEditingAddrId(null); setAddr({ label: "", name: "", phone: "", line1: "", line2: "", city: "", state: "", zip: "", country: "India", isDefault: false }); }} className="ml-2 rounded-md border px-4 py-2 text-sm">Cancel</button>}
        </form>
      </section>
    </div>
  );
}
