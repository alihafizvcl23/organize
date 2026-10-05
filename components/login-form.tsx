"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export function LoginForm({ configMissing }: { configMissing: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(configMissing ? "Add your Supabase URL and publishable key to .env.local first." : "");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed.");
    } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
    <label className="mb-2 block text-sm font-semibold" htmlFor="email">Email address</label>
    <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@restaurant.com" />
    <label className="mb-2 mt-5 block text-sm font-semibold" htmlFor="password">Password</label>
    <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <Button className="mt-6 w-full" disabled={loading || configMissing}>{loading ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
