import { Card, PageHeading, StatusBadge } from "@/components/ui";
import { CheckCircle2, ExternalLink, Info, PlugZap } from "lucide-react";

const configuredServerUrl = process.env.NEXT_PUBLIC_N8N_VAPI_SERVER_URL;
const serverUrl = configuredServerUrl && !configuredServerUrl.includes("YOUR_N8N_HOST")
  ? configuredServerUrl
  : undefined;

export function SettingsView() {
  return <>
    <PageHeading eyebrow="Connections" title="Settings" description="Configure Supabase, n8n, and Vapi for the voice agent."/>
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><PlugZap size={20}/></span><div><h2 className="font-semibold">Vapi server webhook</h2><p className="mt-1 text-xs text-muted">Set this endpoint as the Vapi assistant server URL and for all three function tools.</p></div></div>
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">n8n production URL</p><StatusBadge value={serverUrl ? "ready" : "cancelled"} labels={{ ready: "Configured", cancelled: "Not configured" }}/></div>
          <div className="mt-3 overflow-x-auto rounded-lg bg-paper px-3 py-2.5 font-mono text-xs text-[#45534a]">{serverUrl || "Set NEXT_PUBLIC_N8N_VAPI_SERVER_URL in .env.local"}</div>
          <p className="mt-2 text-xs leading-5 text-muted">After activating the imported n8n workflow, use its production URL ending in /webhook/vapi-server (not /webhook-test/).</p>
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-5"><div className="flex gap-3"><Info size={18} className="mt-0.5 shrink-0 text-[#52765f]"/><div><h2 className="font-semibold">Connect Vapi</h2><p className="mt-2 text-sm leading-6 text-muted">Import <code className="rounded bg-paper px-1">n8n/voice-agent-workflow.json</code> into n8n, configure its Supabase and Vapi webhook variables, then activate it. Add the get_menu, save_order, and save_booking function tools to your Vapi assistant using the endpoint above.</p></div></div>
          <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline" href="https://docs.vapi.ai/tools/custom-tools" target="_blank" rel="noreferrer">Vapi function tools guide <ExternalLink size={14}/></a>
        </Card>
        <Card className="p-5"><div className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700"/><div><h2 className="font-semibold">Database setup</h2><p className="mt-2 text-sm leading-6 text-muted">Run <code className="rounded bg-paper px-1">supabase/schema.sql</code> in the Supabase SQL Editor to create the dashboard tables, authenticated-user policies, and live order/reservation updates.</p></div></div></Card>
      </div>
    </div>
  </>;
}
