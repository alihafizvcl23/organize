"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Headphones, ShoppingBag } from "lucide-react";
import { Card, EmptyState, Input, PageHeading, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { dateTime } from "@/lib/utils";
import type { Booking, CallRecord, Order } from "@/lib/types";

function duration(seconds: number | null) {
  if (seconds === null) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function CallsView() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [orderIds, setOrderIds] = useState<Set<string>>(new Set());
  const [bookingIds, setBookingIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [c, o, b] = await Promise.all([
        supabase.from("calls").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("call_id"),
        supabase.from("bookings").select("call_id"),
      ]);
      if (c.error) throw c.error;
      if (o.error) throw o.error;
      if (b.error) throw b.error;
      setCalls(c.data ?? []);
      setOrderIds(new Set((o.data as Pick<Order, "call_id">[]).map((row) => row.call_id).filter((id): id is string => Boolean(id))));
      setBookingIds(new Set((b.data as Pick<Booking, "call_id">[]).map((row) => row.call_id).filter((id): id is string => Boolean(id))));
      setError("");
    } catch (reason) {     setError(reason instanceof Error ? reason.message : "Calls could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = calls.filter((call) => `${call.phone} ${call.summary ?? ""}`.toLocaleLowerCase("en-US").includes(query.trim().toLocaleLowerCase("en-US")));
  return <>
    <PageHeading eyebrow="Voice activity" title="Calls" description="Review Vapi call recordings, transcripts, and summaries."/>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <Card className="overflow-hidden">
      <div className="border-b border-line p-4"><Input className="max-w-sm" placeholder="Search phone number or summary…" aria-label="Search calls" value={query} onChange={(e) => setQuery(e.target.value)}/></div>
      {loading ? <div className="space-y-3 p-5">{[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-paper"/> )}</div> :
        filtered.length === 0 ? <EmptyState title={calls.length ? "No calls found" : "No calls yet"} description={calls.length ? "Try a different search term." : "Vapi call reports will appear here."}/> :
          <div className="divide-y divide-line">{filtered.map((call) => {
            const isExpanded = expanded === call.id;
            const hasOrder = orderIds.has(call.call_id);
            const hasBooking = bookingIds.has(call.call_id);
            return <article key={call.id}>
              <button className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-[#fbfcfb] sm:gap-5" onClick={() => setExpanded(isExpanded ? null : call.id)} aria-expanded={isExpanded}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><Headphones size={18}/></span>
                <span className="min-w-[130px] flex-1"><span className="block font-semibold">{call.phone}</span><span className="mt-1 block text-xs text-muted">{dateTime(call.created_at)}</span></span>
                <span className="text-sm text-muted">{duration(call.duration_s)}</span>
                <span><StatusBadge value="ready" labels={{ ready: "Call logged" }}/></span>
                <span className="hidden max-w-[230px] truncate text-xs text-muted lg:block">{call.summary || "No summary"}</span>
                <span className="text-muted">{isExpanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</span>
              </button>
              {isExpanded && <div className="bg-[#fbfcfb] px-5 pb-5 pl-[76px]">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Call summary</p><p className="rounded-xl border border-line bg-white p-3 text-sm leading-6">{call.summary || "No summary available."}</p>
                    {(hasOrder || hasBooking) && <div className="mt-3 flex flex-wrap gap-2">{hasOrder && <Link className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-forest hover:bg-[#d7eadf]" href={`/orders?call_id=${encodeURIComponent(call.call_id)}`}><ShoppingBag size={14}/> View order</Link>}{hasBooking && <Link className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-forest hover:bg-[#d7eadf]" href={`/bookings?call_id=${encodeURIComponent(call.call_id)}`}><FileText size={14}/> View reservation</Link>}</div>}
                  </div>
                  <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Recording</p>{call.recording_url ? <audio controls preload="none" className="w-full" src={call.recording_url}>Your browser does not support audio playback.</audio> : <p className="rounded-xl border border-line bg-white p-3 text-sm text-muted">No recording available.</p>}</div>
                </div>
                <div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Transcript</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-white p-4 font-sans text-sm leading-6 text-[#44534a]">{call.transcript || "No transcript available."}</pre></div>
              </div>}
            </article>;
          })}</div>}
    </Card>
  </>;
}
