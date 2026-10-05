"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Activity, CalendarDays, ChefHat, ChevronLeft, Headphones, LayoutDashboard, LogOut, Menu, Settings2, Utensils, X } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ChefHat },
  { href: "/bookings", label: "Reservations", icon: CalendarDays },
  { href: "/calls", label: "Calls", icon: Headphones },
  { href: "/menu", label: "Menu", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Sign out failed.");
    } finally { setBusy(false); }
  }
  return <div className="min-h-screen">
    <div className="no-print flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-line bg-white px-4 py-5 transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link href="/dashboard" className="flex items-center gap-3 px-2 pb-7">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-forest text-white"><Activity size={21}/></div>
          <div><p className="font-bold tracking-tight">stem & tafel</p><p className="text-[11px] text-muted">VOICE AGENT</p></div>
        </Link>
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#9aa39e]">Workspace</div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-mint text-forest" : "text-[#66736c] hover:bg-paper hover:text-ink")}><Icon size={18}/>{label}{active && <ChevronLeft className="ml-auto rotate-180" size={15}/>}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f4f7f3] p-4">
          <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-xs font-semibold">Voice agent ready</span></div>
          <p className="text-xs leading-5 text-muted">Manage your menu and orders. Configure Vapi in Settings.</p>
          <button disabled={busy} onClick={signOut} className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink"><LogOut size={15}/>{busy ? "Signing out…" : "Sign out"}</button>
        </div>
      </aside>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-line bg-[#f5f7f4]/95 px-4 backdrop-blur md:px-8">
          <button aria-label="Open menu" className="rounded-lg p-2 text-muted hover:bg-white lg:hidden" onClick={() => setOpen(true)}><Menu size={20}/></button>
          <div className="hidden items-center gap-2 text-xs text-muted sm:flex"><span>Workspace</span><span>/</span><span className="font-semibold capitalize text-ink">{links.find((l) => l.href === pathname)?.label ?? "Dashboard"}</span></div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-[#476251]"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Online</div>
          {open && <button className="ml-2 lg:hidden" onClick={() => setOpen(false)}><X size={18}/></button>}
        </header>
        <div className="mx-auto w-full max-w-[1440px] px-4 py-7 md:px-8 md:py-9">{children}</div>
      </main>
    </div>
  </div>;
}
