"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCustomer } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerCustomer({ name, username, email, password });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <h1 className="text-2xl font-bold">Create account</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded border px-3 py-2 dark:bg-gray-800" required />
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full rounded border px-3 py-2 dark:bg-gray-800" required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded border px-3 py-2 dark:bg-gray-800" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded border px-3 py-2 dark:bg-gray-800" required minLength={8} />
            <button disabled={loading} type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              {loading ? "Creating..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
