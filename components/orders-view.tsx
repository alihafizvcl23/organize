"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, X } from "lucide-react";
import { Button, Card, EmptyState, Input, PageHeading, Select, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { dateTime, euro, localDateInAmsterdam } from "@/lib/utils";
import type { CallRecord, Order, OrderStatus, OrderType } from "@/lib/types";

const labels = { new: "New", preparing: "Preparing", ready: "Ready", delivered: "Completed", cancelled: "Cancelled" };
const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  new: ["new", "preparing", "cancelled"],
  preparing: ["preparing", "ready", "cancelled"],
  ready: ["ready", "delivered", "cancelled"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

export function OrdersView() {
  const [callId, setCallId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [summary, setSummary] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [day, setDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setOrders(data ?? []);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Orders could not be loaded.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setCallId(new URLSearchParams(window.location.search).get("call_id") ?? ""); }, []);

  const filtered = useMemo(() => orders.filter((order) => {
    const needle = query.trim().toLocaleLowerCase("en-US");
    const matchesText = !needle || `${order.phone} ${order.customer_name ?? ""}`.toLocaleLowerCase("en-US").includes(needle);
    const matchesDay = !day || localDateInAmsterdam(order.created_at) === day;
    return matchesText && (!status || order.status === status) && (!type || order.type === type) && matchesDay && (!callId || order.call_id === callId);
  }), [orders, query, status, type, day, callId]);

  async function openOrder(order: Order) {
    setSelected(order);
    setSummary("");
    if (!order.call_id) return;
    try {
      const supabase = createClient();
      const { data, error: lookupError } = await supabase.from("calls").select("summary").eq("call_id", order.call_id).maybeSingle();
      if (lookupError) throw lookupError;
      setSummary((data as Pick<CallRecord, "summary"> | null)?.summary ?? "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Call summary could not be loaded."); }
  }

  async function updateStatus(nextStatus: OrderStatus) {
    if (!selected) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("orders").update({ status: nextStatus }).eq("id", selected.id);
      if (updateError) throw updateError;
      const updated = { ...selected, status: nextStatus };
      setSelected(updated);
      setOrders((current) => current.map((order) => order.id === selected.id ? updated : order));
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Status update failed."); }
    finally { setSaving(false); }
  }

  const orderTotal = filtered.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return <>
    <PageHeading eyebrow="Kitchen & takeaway" title="Orders" description="Track incoming orders and update their status."/>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <div className="relative min-w-[190px] flex-1"><Search className="absolute left-3 top-3 text-muted" size={16}/><Input className="pl-9" aria-label="Search by name or phone number" placeholder="Search name or phone…" value={query} onChange={(e) => setQuery(e.target.value)}/></div>
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</Select>
        <Select aria-label="Filter by order type" value={type} onChange={(e) => setType(e.target.value)}><option value="">Pickup and delivery</option><option value="pickup">Pickup</option><option value="delivery">Delivery</option></Select>
        <Input aria-label="Filter by date" className="w-auto" type="date" value={day} onChange={(e) => setDay(e.target.value)}/>
        {(query || status || type || day) && <Button variant="ghost" className="px-3" onClick={() => { setQuery(""); setStatus(""); setType(""); setDay(""); }}><X size={15}/> Clear</Button>}
      </div>
      <div className="flex items-center justify-between border-b border-line bg-[#fbfcfb] px-5 py-3 text-xs text-muted"><span>{filtered.length} orders</span><span>Total {euro(orderTotal)}</span></div>
      {loading ? <div className="space-y-3 p-5">{[1,2,3,4].map((n) => <div key={n} className="h-12 animate-pulse rounded-xl bg-paper"/> )}</div> :
        filtered.length === 0 ? <EmptyState title={orders.length ? "No results" : "No orders yet"} description={orders.length ? "Adjust your filters and try again." : "New orders from the Vapi voice agent will appear here."} action={orders.length > 0 ? <Button variant="secondary" onClick={() => { setQuery(""); setStatus(""); setType(""); setDay(""); }}>Clear filters</Button> : undefined}/> :
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#fbfcfb] text-xs text-muted"><tr><th className="px-5 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Order</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Time</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-line">{filtered.map((order) => <tr key={order.id} role="button" tabIndex={0} onClick={() => void openOrder(order)} onKeyDown={(e) => { if (e.key === "Enter") void openOrder(order); }} className="cursor-pointer hover:bg-[#fbfcfb]">
              <td className="px-5 py-4"><p className="font-semibold">{order.customer_name || "Unknown customer"}</p><p className="mt-1 text-xs text-muted">{order.phone}</p></td>
              <td className="px-4 py-4 text-muted">{order.items?.reduce((n, item) => n + item.quantity, 0) ?? 0} items</td>
              <td className="px-4 py-4">{order.type === "pickup" ? "Pickup" : "Delivery"}</td>
              <td className="px-4 py-4 text-muted">{dateTime(order.created_at)}</td><td className="px-4 py-4 font-semibold">{euro(Number(order.total))}</td>
              <td className="px-5 py-4"><StatusBadge value={order.status} labels={labels}/></td>
            </tr>)}</tbody>
          </table></div>}
    </Card>
    {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <aside className="no-print flex h-full w-full max-w-[510px] flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4"><div><p className="text-xs text-muted">Order</p><h2 className="mt-1 font-bold">{selected.customer_name || selected.phone}</h2></div><button aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-paper" onClick={() => setSelected(null)}><X size={20}/></button></div>
        <div className="flex-1 space-y-6 p-5">
          <div className="flex items-start justify-between"><div><p className="text-xs text-muted">Placed on</p><p className="mt-1 text-sm font-medium">{dateTime(selected.created_at)}</p></div><StatusBadge value={selected.status} labels={labels}/></div>
          <div><p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Items</p><div className="space-y-3">{(selected.items ?? []).map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm"><span><span className="font-semibold">{item.quantity}×</span> {item.name}</span><span className="font-medium">{euro(Number(item.line_total))}</span></div>)}</div><div className="mt-4 flex justify-between border-t border-line pt-3 text-sm font-bold"><span>Total</span><span>{euro(Number(selected.total))}</span></div></div>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-paper p-4"><div><p className="text-xs text-muted">Type</p><p className="mt-1 text-sm font-semibold">{selected.type === "pickup" ? "Pickup" : "Delivery"}</p></div><div><p className="text-xs text-muted">Estimate</p><p className="mt-1 text-sm font-semibold">{selected.eta_minutes ? `${selected.eta_minutes} min` : "—"}</p></div>
            <div><p className="text-xs text-muted">Phone</p><p className="mt-1 text-sm font-semibold">{selected.phone}</p></div>{selected.address && <div className="col-span-2"><p className="text-xs text-muted">Delivery address</p><p className="mt-1 text-sm font-semibold">{selected.address}</p></div>}</div>
          {selected.notes && <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Notes</p><p className="mt-2 text-sm">{selected.notes}</p></div>}
          <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Call summary</p><p className="mt-2 rounded-xl bg-paper p-3 text-sm leading-6 text-muted">{summary || "No summary available."}</p></div>
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted" htmlFor="order-status">Update order status</label><Select id="order-status" className="w-full" disabled={saving} value={selected.status} onChange={(e) => void updateStatus(e.target.value as OrderStatus)}>{nextStatuses[selected.status].map((key) => <option key={key} value={key}>{labels[key]}</option>)}</Select></div>
        </div>
        <div className="sticky bottom-0 border-t border-line bg-white p-5"><Button variant="secondary" className="w-full" onClick={() => window.print()}><ShoppingBag size={16}/> Print receipt</Button></div>
        <div className="print-ticket hidden">
          <div style={{ textAlign: "center" }}><strong>STEM & TAFEL</strong><br/>ORDER RECEIPT<br/><br/></div>
          <div>{dateTime(selected.created_at)}<br/>{selected.customer_name || "Customer"}<br/>{selected.phone}<br/>{selected.type === "pickup" ? "PICKUP" : "DELIVERY"}<br/>{selected.address || ""}</div>
          <hr style={{ margin: "10px 0", borderTop: "1px dashed black" }}/>
          {(selected.items ?? []).map((item, index) => <div key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>{item.quantity}x {item.name}</span><span>{euro(Number(item.line_total))}</span></div>)}
          <hr style={{ margin: "10px 0", borderTop: "1px dashed black" }}/><strong>TOTAL: {euro(Number(selected.total))}</strong>
          {selected.notes && <p>Note: {selected.notes}</p>}
        </div>
      </aside>
    </div>}
  </>;
}
