"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid username or password");
      return;
    }
    if (username.trim().toLowerCase() === "a153ta") {
      router.push("/admin");
    } else {
      router.push("/");
    }
    router.refresh();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button disabled={loading} type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
