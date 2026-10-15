"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-blue-300">MeCart Access</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Sign in</h1>
            <p className="mt-3 text-sm text-slate-300">
              Enter your account to continue shopping, managing orders, and exploring premium products.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <User className="h-4 w-4" /> Username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Lock className="h-4 w-4" /> Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
              whileTap={{ scale: 0.985 }}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white shadow-xl shadow-blue-600/25 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Continue"}
            </motion.button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
            <Link href="/register" className="transition hover:text-white">
              Create account
            </Link>
            <Link href="/" className="transition hover:text-white">
              Back to store
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
