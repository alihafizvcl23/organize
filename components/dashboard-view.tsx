"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Headphones, ShoppingBag, TrendingUp, Volume2 } from "lucide-react";
import { Card, EmptyState, PageHeading, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { amsterdamDayBounds, dateTime, euro, todayInAmsterdam } from "@/lib/utils";
import type { Booking, Order } from "@/lib/types";

type FeedRow = { kind: "order"; id: string; date: string; title: string; subtitle: string; amount: number; status: string } |
  { kind: "booking"; id: string; date: string; title: string; subtitle: string; amount: null; status: string };

const orderLabels = { new: "New", preparing: "Preparing", ready: "Ready", delivered: "Completed", cancelled: "Cancelled" };
const bookingLabels = { confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed" };

export function DashboardView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const today = todayInAmsterdam();
      const { start, end } = amsterdamDayBounds(today);
      const [o, b, c, recentO, recentB] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").gte("date", today).lte("date", today).order("time"),
        supabase.from("calls").select("id").gte("created_at", start).lt("created_at", end),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("bookings").select("*").order("date", { ascending: false }).order("time", { ascending: false }).limit(8),
      ]);
      if (o.error) throw o.error;
      if (b.error) throw b.error;
      if (c.error) throw c.error;
      if (recentO.error) throw recentO.error;
      if (recentB.error) throw recentB.error;
      setOrders(o.data ?? []);
      setBookings(b.data ?? []);
      setRecentOrders(recentO.data ?? []);
      setRecentBookings(recentB.data ?? []);
      setCallsToday(c.data?.length ?? 0);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dashboard data could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const supabase = createClient();
    const channel = supabase.channel("dashboard-live-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as Order;
        setToast(`New order${row.customer_name ? ` from ${row.customer_name}` : ""}`);
        try {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.connect(gain); gain.connect(context.destination);
          oscillator.frequency.value = 760; gain.gain.value = 0.04;
          oscillator.start(); oscillator.stop(context.currentTime + 0.12);
        } catch { /* Audio can be blocked by browser settings. */ }
        window.setTimeout(() => setToast(""), 4500);
        void load();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const feed: FeedRow[] = [
    ...recentOrders.map((order) => ({
      kind: "order" as const, id: order.id, date: order.created_at, title: order.customer_name || order.phone,
      subtitle: `${order.type === "pickup" ? "Pickup" : "Delivery"} · ${order.items?.length ?? 0} items`,
      amount: Number(order.total), status: order.status,
    })),
    ...recentBookings.map((booking) => ({
      kind: "booking" as const, id: booking.id, date: `${booking.date}T${booking.time}`, title: booking.customer_name,
      subtitle: `${booking.time.slice(0, 5)} · ${booking.party_size} people`, amount: null, status: booking.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const metrics = [
    { label: "Orders today", value: orders.length.toString(), icon: ShoppingBag, foot: "All orders placed today", href: "/orders" },
    { label: "Revenue today", value: euro(orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + Number(o.total || 0), 0)), icon: TrendingUp, foot: "Excludes cancelled orders", href: "/orders" },
    { label: "Reservations today", value: bookings.filter((b) => b.status !== "cancelled").length.toString(), icon: CalendarDays, foot: "Scheduled for today", href: "/bookings" },
    { label: "Calls today", value: callsToday.toString(), icon: Headphones, foot: "Vapi calls", href: "/calls" },
  ];

  return <>
    <PageHeading eyebrow="Today · your workspace" title="Good day 👋" description="Here’s what’s happening at Stem & Tafel today." />
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {toast && <div role="status" className="fixed right-5 top-20 z-50 flex items-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white shadow-lg"><Volume2 size={16}/>{toast}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon, foot, href }) => <Link href={href} key={label}><Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-muted">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-forest"><Icon size={18}/></span></div>
        <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted">{foot}</p>
      </Card></Link>)}
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold">Live activity</h2><p className="mt-1 text-xs text-muted">Recent orders and reservations</p></div><span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Live</span></div>
        {loading ? <div className="space-y-3 p-5">{[1,2,3,4].map((n) => <div key={n} className="h-12 animate-pulse rounded-xl bg-paper"/> )}</div> :
        feed.length === 0 ? <EmptyState title="No activity today" description="New orders and reservations will appear here automatically."/> :
          <div className="divide-y divide-line">{feed.map((item) => <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 px-5 py-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper text-muted">{item.kind === "order" ? <ShoppingBag size={17}/> : <CalendarDays size={17}/>}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-xs text-muted">{item.subtitle}</p></div>
            <div className="hidden text-right sm:block"><p className="text-xs font-medium">{item.amount === null ? dateTime(item.date) : euro(item.amount)}</p><div className="mt-1"><StatusBadge value={item.status} labels={item.kind === "order" ? orderLabels : bookingLabels}/></div></div>
            <Link aria-label="View" href={item.kind === "order" ? "/orders" : "/bookings"} className="text-muted hover:text-ink"><ChevronRight size={16}/></Link>
          </div>)}</div>}
        <div className="border-t border-line px-5 py-3"><Link href="/orders" className="text-xs font-semibold text-forest hover:underline">View all orders →</Link></div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Vapi calls</h2><p className="mt-1 text-xs text-muted">Calls logged today</p></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-forest"><Headphones size={18}/></div></div>
        <p className="mt-6 text-4xl font-bold tracking-tight">{callsToday}</p>
        <p className="mt-2 text-xs text-muted">Call reports received from Vapi</p>
        <div className="mt-7 rounded-xl bg-paper p-4"><p className="text-xs font-semibold">Good to know</p><p className="mt-1 text-xs leading-5 text-muted">The voice agent uses your current menu. Update availability in Menu.</p><Link href="/menu" className="mt-3 inline-block text-xs font-semibold text-forest hover:underline">Go to Menu →</Link></div>
      </Card>
    </div>
  </>;
}
