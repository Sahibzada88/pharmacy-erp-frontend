"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_HOME[user.role] || "/owner");
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Could not sign in. Check your username and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left: brand story */}
      <div className="relative hidden overflow-hidden p-14 lg:flex lg:flex-col lg:justify-between">
        <FloatingCapsules />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
            <div className="absolute h-4 w-1.5 rounded-full bg-emerald-400" />
            <div className="absolute h-1.5 w-4 rounded-full bg-emerald-400" />
          </div>
          <span className="font-display text-sm font-semibold text-white">Rahat Pharmacy</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-sm font-medium text-emerald-400">Chain management, in one place</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-white">
            Every branch,
            <br />
            every rupee,
            <br />
            one screen.
          </h1>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-100/60">
            Stock, sales, suppliers and cash — tracked live across every branch,
            with the right view for whoever's looking: owner, cashier, pharmacist or accountant.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-sm text-ink-100/45">
          <span>Real-time stock</span>
          <span>Role-based access</span>
          <span>Branch analytics</span>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-6 lg:p-14">
        <GlassCard edge className="w-full max-w-sm p-8 animate-fade-up">
          <div className="mb-2 flex items-center gap-2.5 lg:hidden">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <div className="absolute h-3.5 w-1.5 rounded-full bg-emerald-400" />
              <div className="absolute h-1.5 w-3.5 rounded-full bg-emerald-400" />
            </div>
            <span className="font-display text-sm font-semibold text-white">Rahat Pharmacy</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-white">Welcome back</h2>
          <p className="mt-1.5 text-sm text-ink-100/50">Sign in with the account your branch gave you.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. cashier1"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-100/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Sign in
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-100/35">
            Forgot your password? Ask your branch manager or the owner to reset it.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

function FloatingCapsules() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      viewBox="0 0 600 900"
      fill="none"
    >
      <g className="animate-[fade-up_1s_ease-out]">
        <rect x="380" y="120" width="140" height="56" rx="28" fill="url(#capsuleA)" transform="rotate(24 450 148)" opacity="0.5" />
        <rect x="90" y="420" width="110" height="44" rx="22" fill="url(#capsuleB)" transform="rotate(-18 145 442)" opacity="0.45" />
        <circle cx="470" cy="560" r="70" fill="url(#capsuleA)" opacity="0.18" />
        <rect x="220" y="700" width="130" height="52" rx="26" fill="url(#capsuleB)" transform="rotate(10 285 726)" opacity="0.35" />
      </g>
      <defs>
        <linearGradient id="capsuleA" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#0F9D74" />
          <stop offset="1" stopColor="#0B1220" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="capsuleB" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#E8A33D" />
          <stop offset="1" stopColor="#0B1220" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
