"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, Utensils, X } from "lucide-react";
import { Button, Card, EmptyState, Input, PageHeading, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { euro } from "@/lib/utils";
import type { MenuItem } from "@/lib/types";

type Draft = { name: string; description: string; price: string; category: string };
const emptyDraft: Draft = { name: "", description: "", price: "", category: "" };

export function MenuView() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase.from("menu_items").select("*").order("category").order("name");
      if (queryError) throw queryError;
      setItems(data ?? []);
      setError("");
    } catch (reason) {     setError(reason instanceof Error ? reason.message : "Menu could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const result = new Map<string, MenuItem[]>();
    for (const item of items) {
      const category = item.category?.trim() || "Other";
      result.set(category, [...(result.get(category) ?? []), item]);
    }
    return Array.from(result.entries());
  }, [items]);

  function edit(item?: MenuItem) {
    setEditing(item ?? null);
    setDraft(item ? { name: item.name, description: item.description ?? "", price: String(item.price), category: item.category ?? "" } : emptyDraft);
    setModal(true);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try {
      const supabase = createClient();
      const values = { name: draft.name.trim(), description: draft.description.trim() || null, price: Number(draft.price), category: draft.category.trim() || null };
      const result = editing ? await supabase.from("menu_items").update(values).eq("id", editing.id) : await supabase.from("menu_items").insert({ ...values, available: true });
      if (result.error) throw result.error;
      setModal(false); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Saving the menu item failed."); }
    finally { setSaving(false); }
  }
  async function toggle(item: MenuItem) {
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, available: !row.available } : row));
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", item.id);
      if (updateError) throw updateError;
    } catch (reason) {
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, available: item.available } : row));
      setError(reason instanceof Error ? reason.message : "Updating availability failed.");
    }
  }
  async function savePrice(item: MenuItem) {
    const next = Number(priceDrafts[item.id]);
    if (!Number.isFinite(next) || next < 0) { setError("Enter a valid price of zero or more."); return; }
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("menu_items").update({ price: next }).eq("id", item.id);
      if (updateError) throw updateError;
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, price: next } : row));
      setPriceDrafts((current) => { const nextDrafts = { ...current }; delete nextDrafts[item.id]; return nextDrafts; });
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Updating the price failed."); }
  }
  async function removeItem() {
    if (!editing || !window.confirm(`Are you sure you want to delete "${editing.name}"?`)) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("menu_items").delete().eq("id", editing.id);
      if (deleteError) throw deleteError;
      setItems((current) => current.filter((item) => item.id !== editing.id));
      setModal(false);
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Deleting the product failed."); }
    finally { setSaving(false); }
  }

  return <>
    <PageHeading eyebrow="Products & pricing" title="Menu" description="Manage the products your voice agent can offer." action={<Button onClick={() => edit()}><Plus size={17}/> Add product</Button>}/>
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#dbe9df] bg-mint px-4 py-3 text-sm text-[#355943]"><Utensils className="mt-0.5 shrink-0" size={17}/><p>Availability and prices update directly. The n8n agent reads the latest menu from Supabase for every call.</p></div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="space-y-4">{[1,2].map((group) => <Card key={group} className="p-5"><div className="h-5 w-32 animate-pulse rounded bg-paper"/><div className="mt-5 h-14 animate-pulse rounded bg-paper"/></Card>)}</div> :
      items.length === 0 ? <Card><EmptyState title="Your menu is empty" description="Add menu items so the voice agent can answer questions and take orders." action={<Button onClick={() => edit()}><Plus size={16}/> Add first product</Button>}/></Card> :
      <div className="space-y-4">{groups.map(([category, groupItems]) => <Card key={category} className="overflow-hidden"><div className="flex items-center justify-between border-b border-line bg-[#fbfcfb] px-5 py-4"><h2 className="font-semibold">{category}</h2><span className="text-xs text-muted">{groupItems.length} products</span></div>
        <div className="divide-y divide-line">{groupItems.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
          <button role="switch" aria-checked={item.available} aria-label={`${item.available ? "Disable" : "Enable"}: ${item.name}`} onClick={() => void toggle(item)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${item.available ? "bg-[#4d8966]" : "bg-[#cbd2cd]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${item.available ? "left-6" : "left-1"}`}/></button>
          <div className="min-w-[160px] flex-1"><p className="font-semibold">{item.name}{!item.available && <span className="ml-2 text-xs font-normal text-muted">Unavailable</span>}</p>{item.description && <p className="mt-1 line-clamp-1 text-xs text-muted">{item.description}</p>}</div>
          <div className="flex items-center gap-1.5"><span className="text-sm text-muted">€</span><Input aria-label={`Price for ${item.name}`} inputMode="decimal" className="w-24 text-right" value={priceDrafts[item.id] ?? String(item.price)} onChange={(e) => setPriceDrafts((current) => ({ ...current, [item.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void savePrice(item); } }} onBlur={() => { if (priceDrafts[item.id] !== undefined && Number(priceDrafts[item.id]) !== item.price) void savePrice(item); }}/>
            {priceDrafts[item.id] !== undefined && Number(priceDrafts[item.id]) !== item.price && <button aria-label="Save price" className="rounded-lg p-2 text-emerald-700 hover:bg-mint" onMouseDown={(e) => e.preventDefault()} onClick={() => void savePrice(item)}><Check size={16}/></button>}
          </div>
          <Button variant="ghost" className="px-3" aria-label={`Edit ${item.name}`} onClick={() => edit(item)}><Pencil size={16}/></Button>
        </div>)}</div></Card>)}</div>}
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}>
      <form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">{editing ? "Edit product" : "Add product"}</h2><p className="mt-1 text-sm text-muted">Changes are immediately available to the voice agent.</p></div><button type="button" aria-label="Close" onClick={() => setModal(false)}><X size={19}/></button></div>
        <div className="space-y-4">
          <label className="block text-sm font-medium">Product name<Input className="mt-1.5" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/></label>
          <label className="block text-sm font-medium">Description<Textarea className="mt-1.5" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></label>
          <div className="grid grid-cols-2 gap-4"><label className="text-sm font-medium">Price (€)<Input className="mt-1.5" type="number" min="0" step="0.01" required value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })}/></label><label className="text-sm font-medium">Category<Input className="mt-1.5" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}/></label></div>
        </div>
        <div className="mt-6 flex justify-between gap-2">{editing ? <Button type="button" variant="danger" disabled={saving} onClick={() => void removeItem()}><Trash2 size={15}/> Delete</Button> : <span/>}<div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div></div>
      </form>
    </div>}
  </>;
}
