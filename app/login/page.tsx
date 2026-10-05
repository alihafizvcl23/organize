import { LoginForm } from "@/components/login-form";

export default function LoginPage({ searchParams }: { searchParams: { config?: string } }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f4] px-4 py-10">
    <div className="w-full max-w-[420px]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-forest text-xl font-bold text-white">s.</div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to your Stem & Tafel dashboard</p>
      </div>
      <LoginForm configMissing={searchParams.config === "missing"} />
      <p className="mt-6 text-center text-xs text-muted">Secure staff access</p>
    </div>
  </main>;
}
