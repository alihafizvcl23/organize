"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { Button, Card, EmptyState, Input, PageHeading, Select, StatusBadge, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { dateOnly } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

const labels = { confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed" };
type BookingDraft = { customer_name: string; phone: string; date: string; time: string; party_size: string; notes: string };
const blank: BookingDraft = { customer_name: "", phone: "", date: "", time: "19:00", party_size: "2", notes: "" };

export function BookingsView() {
  const [callId, setCallId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date()));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [draft, setDraft] = useState<BookingDraft>(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase.from("bookings").select("*").order("date", { ascending: true }).order("time", { ascending: true });
      if (queryError) throw queryError;
      setBookings(data ?? []);
      setError("");
    } catch (reason) {     setError(reason instanceof Error ? reason.message : "Reservations could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setCallId(new URLSearchParams(window.location.search).get("call_id") ?? ""); }, []);

  const visible = useMemo(() => bookings.filter((booking) => {
    const needle = query.trim().toLocaleLowerCase("en-US");
    return (callId ? booking.call_id === callId : booking.date === selectedDate) &&
      (!statusFilter || booking.status === statusFilter) &&
      (!needle || `${booking.customer_name} ${booking.phone}`.toLocaleLowerCase("en-US").includes(needle));
  }), [bookings, selectedDate, query, statusFilter, callId]);

  const weekDays = useMemo(() => {
    const monday = new Date(`${selectedDate}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      const value = date.toISOString().slice(0, 10);
      return {
        value,
        label: new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(date),
        count: bookings.filter((booking) => booking.date === value && booking.status !== "cancelled").length,
      };
    });
  }, [selectedDate, bookings]);

  function showCreate() {
    setEditing(null);
    setDraft({ ...blank, date: selectedDate });
    setModal(true);
  }
  function showEdit(booking: Booking) {
    setEditing(booking);
    setDraft({ customer_name: booking.customer_name, phone: booking.phone, date: booking.date, time: booking.time.slice(0, 5), party_size: String(booking.party_size), notes: booking.notes ?? "" });
    setModal(true);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const record = { customer_name: draft.customer_name.trim(), phone: draft.phone.trim(), date: draft.date, time: draft.time, party_size: Number(draft.party_size), notes: draft.notes.trim() || null };
      const result = editing
        ? await supabase.from("bookings").update(record).eq("id", editing.id)
        : await supabase.from("bookings").insert({ ...record, status: "confirmed", call_id: null });
      if (result.error) throw result.error;
      setModal(false);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Saving the reservation failed."); }
    finally { setSaving(false); }
  }
  async function updateStatus(booking: Booking, status: BookingStatus) {
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
      if (updateError) throw updateError;
      setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, status } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Status update failed."); }
  }
  function shiftDate(amount: number) {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setDate(next.getDate() + amount);
    setSelectedDate(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(next));
  }

  return <>
    <PageHeading eyebrow="Table planning" title="Reservations" description="View the daily schedule and manage reservations." action={<Button onClick={showCreate}><Plus size={17}/> New reservation</Button>}/>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-2"><Button variant="secondary" className="px-3" aria-label="Previous day" onClick={() => shiftDate(-1)}><ChevronLeft size={17}/></Button><Button variant="secondary" className="px-3" aria-label="Next day" onClick={() => shiftDate(1)}><ChevronRight size={17}/></Button><Input aria-label="Choose date" className="w-auto" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}/><button className="px-2 text-xs font-semibold text-forest hover:underline" onClick={() => setSelectedDate(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date()))}>Today</button></div>
      <div className="flex flex-wrap gap-2"><Input className="w-48" placeholder="Search name or phone…" value={query} onChange={(e) => setQuery(e.target.value)}/><Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</Select></div>
    </Card>
    <Card className="mb-4 grid grid-cols-4 gap-2 p-3 sm:grid-cols-7">
      {weekDays.map((day) => <Button key={day.value} variant="secondary" aria-pressed={selectedDate === day.value} className={`h-auto min-h-[58px] flex-col gap-1 px-2 py-2 ${selectedDate === day.value ? "border-forest bg-forest text-white hover:bg-[#245a48]" : ""}`} onClick={() => setSelectedDate(day.value)}>
        <span className="text-xs capitalize">{day.label}</span><span className={`text-[10px] font-normal ${selectedDate === day.value ? "text-white/80" : "text-muted"}`}>{day.count} guests</span>
      </Button>)}
    </Card>
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><CalendarDays size={19}/></div><div><h2 className="font-semibold capitalize">{dateOnly(selectedDate)}</h2><p className="mt-0.5 text-xs text-muted">{visible.length} reservations</p></div></div></div>
      {loading ? <div className="space-y-3 p-5">{[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-paper"/> )}</div> :
        visible.length === 0 ? <EmptyState title="No reservations on this day" description={bookings.length ? "Choose another date or create a new reservation." : "Reservations from Vapi calls will appear here automatically."} action={<Button variant="secondary" onClick={showCreate}><Plus size={15}/> Add reservation</Button>}/> :
          <div className="divide-y divide-line">{visible.map((booking) => <article key={booking.id} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-[#fbfcfb] sm:gap-5">
            <div className="w-16 shrink-0 text-lg font-bold">{booking.time.slice(0, 5)}</div>
            <div className="min-w-[140px] flex-1"><p className="font-semibold">{booking.customer_name}</p><p className="mt-1 text-xs text-muted">{booking.phone}</p></div>
            <div className="text-sm text-muted">{booking.party_size} people</div>
            <StatusBadge value={booking.status} labels={labels}/>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" className="px-3" onClick={() => showEdit(booking)} aria-label="Edit"><Pencil size={16}/></Button>
              {booking.status !== "cancelled" && <Button variant="ghost" className="px-3 text-red-600" onClick={() => void updateStatus(booking, "cancelled")} aria-label="Cancel"><X size={17}/></Button>}
              {booking.status === "confirmed" && <Button variant="secondary" className="px-3 text-xs" onClick={() => void updateStatus(booking, "completed")}>Complete</Button>}
            </div>
            {booking.notes && <p className="basis-full pl-16 text-xs text-muted">{booking.notes}</p>}
          </article>)}</div>}
    </Card>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}>
      <form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">{editing ? "Edit reservation" : "New reservation"}</h2><p className="mt-1 text-sm text-muted">Enter the guest details.</p></div><button type="button" aria-label="Close" onClick={() => setModal(false)}><X size={19}/></button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Guest name<Input className="mt-1.5" required value={draft.customer_name} onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })}/></label>
          <label className="text-sm font-medium">Phone number<Input className="mt-1.5" type="tel" required value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}/></label>
          <label className="text-sm font-medium">Party size<Input className="mt-1.5" type="number" min="1" max="30" required value={draft.party_size} onChange={(e) => setDraft({ ...draft, party_size: e.target.value })}/></label>
          <label className="text-sm font-medium">Date<Input className="mt-1.5" type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}/></label>
          <label className="text-sm font-medium">Time<Input className="mt-1.5" type="time" required value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })}/></label>
          <label className="text-sm font-medium sm:col-span-2">Notes<Textarea className="mt-1.5" rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}/></label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create reservation"}</Button></div>
      </form>
    </div>}
  </>;
}
