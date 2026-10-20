"use client";
// P2 owns. The lead workspace: my leads, all open leads, the recovery queue ("Needs attention") and the team.
// Lists refresh every 3 seconds (Q11). Every action is enforced again on the server.
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAction } from "@/components/ui/useAction";
import { ui } from "@/components/ui/styles";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Notice, PageHeader } from "@/components/ui/Kit";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, type TabDef } from "@/components/ui/Tabs";
import { createManualLead, listLeads, type LeadRow } from "./actions";
import { AwayNotice } from "./StatusSelector";
import { TeamPanel } from "./TeamPanel";
import { LeadCard, byUrgency } from "./LeadCard";
import { RecoveryClient, fetchRecovery } from "../recovery/RecoveryClient";

const FILTER_LABEL: Record<string, string> = { today: "new leads today", escalated24h: "leads escalated in the last 24 hours (a lead escalated twice appears once)" };

export async function fetchLeads(filter?: string): Promise<{ rows: LeadRow[]; receivedAt: number }> {
  const r = await listLeads({ filter });
  if (!r.ok) throw new Error(r.error);
  return { rows: r.data, receivedAt: Date.now() };
}

function LeadList({ rows, receivedAt, canReassign, onChanged, empty }: {
  rows: LeadRow[] | undefined; receivedAt: number; canReassign: boolean; onChanged: () => void; empty: React.ReactNode;
}) {
  if (!rows) {
    return (
      <div className="space-y-3" aria-busy="true">
        <p className="sr-only" role="status">Loading leads…</p>
        {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl border border-stone-200 bg-white" />)}
      </div>
    );
  }
  if (rows.length === 0) return <>{empty}</>;
  return (
    <ul className="space-y-3">
      {rows.map((l) => <li key={l.id}><LeadCard lead={l} receivedAt={receivedAt} canReassign={canReassign} onChanged={onChanged} /></li>)}
    </ul>
  );
}

export function LeadsClient({ canCreate, canManageTeam, canReassign, seesAll, filter }: {
  canCreate: boolean; canManageTeam: boolean; canReassign: boolean; seesAll: boolean; filter?: string;
}) {
  const { data, error, mutate } = useSWR(filter ? `leads:${filter}` : "leads", () => fetchLeads(filter), { refreshInterval: 3000 });
  const { data: recovery } = useSWR("recovery", fetchRecovery, { refreshInterval: 3000 });
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const all = data ? [...data.rows].sort(byUrgency) : undefined;
  const mine = all?.filter((l) => l.isMine);
  const waiting = mine?.filter((l) => l.status === "ASSIGNED").length ?? 0;
  const receivedAt = data?.receivedAt ?? 0;
  const refresh = () => { mutate(); };

  const myEmpty = (
    <EmptyState icon="checkCircle" title={filter ? "None of your leads match this view" : "You have no open leads"}
      action={seesAll ? undefined : <Link href="/contacts" className={ui.btn}>Go to contacts</Link>}>
      New leads are handed out automatically to people who are Available. Make sure your status at the top of the page is set to Available.
    </EmptyState>
  );

  const tabs: TabDef[] = [
    { id: "mine", label: "My leads", count: mine?.length ?? null, content: <LeadList rows={mine} receivedAt={receivedAt} canReassign={canReassign} onChanged={refresh} empty={myEmpty} /> },
  ];
  if (seesAll) {
    tabs.push({
      id: "all", label: "All open leads", count: all?.length ?? null,
      content: <LeadList rows={all} receivedAt={receivedAt} canReassign={canReassign} onChanged={refresh}
        empty={<EmptyState icon="leads" title={filter ? "No leads match this view" : "No open leads"}>New leads from the web form, website chat and WhatsApp appear here as soon as they arrive.</EmptyState>} />,
    });
  }
  tabs.push({ id: "attention", label: "Needs attention", count: recovery?.length ?? null, attention: true, content: <RecoveryClient canReassign={canReassign} /> });
  if (canManageTeam) tabs.push({ id: "team", label: "Team", content: <div className="max-w-2xl"><TeamPanel /></div> });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Every enquiry has one accountable owner. Acknowledge yours before the timer runs out, or the lead moves to the next person."
        actions={canCreate && (
          <button type="button" className={open ? ui.btn : ui.btnPrimary} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <Icon name={open ? "x" : "plus"} className="h-4 w-4" /> {open ? "Close" : "New lead"}
          </button>
        )}
      />

      {waiting > 0 && (
        <Notice tone="warn" role="status" title={`${waiting} ${waiting === 1 ? "lead is" : "leads are"} waiting for you to acknowledge.`}>
          They are at the top of My leads, with the least time left first.
        </Notice>
      )}
      {filter && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800">
          <Icon name="filter" className="h-4 w-4 text-stone-500" />
          <span>Showing {FILTER_LABEL[filter] ?? "filtered leads"}.</span>
          <Link href="/leads" className={ui.link}>Show all open leads</Link>
        </div>
      )}
      <AwayNotice />

      {open && (
        <form
          className={`${ui.card} animate-fade-in space-y-4`}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            const v = (k: string) => String(f.get(k) ?? "");
            run(() => createManualLead({ name: v("name"), phone: v("phone"), email: v("email") }), {
              success: "Lead created and assigned.",
              onSuccess: () => { form.reset(); setOpen(false); mutate(); },
            });
          }}
        >
          <div>
            <h2 className={ui.h2}>Add a lead by hand</h2>
            <p className={`${ui.muted} mt-0.5`}>For walk-ins and phone calls. It is assigned to someone right away.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={ui.field}>
              <label htmlFor="nl-name" className={ui.label}>Customer name</label>
              <input id="nl-name" name="name" required maxLength={100} autoComplete="off" placeholder="e.g. Ahmed Raza" className={ui.input} />
            </div>
            <div className={ui.field}>
              <label htmlFor="nl-phone" className={ui.label}>Phone number</label>
              <input id="nl-phone" name="phone" type="tel" required maxLength={30} placeholder="0300 1234567" className={ui.input} />
            </div>
            <div className={ui.field}>
              <label htmlFor="nl-email" className={ui.label}>Email <span className="font-normal text-stone-500">(optional)</span></label>
              <input id="nl-email" name="email" type="email" maxLength={200} placeholder="name@example.com" className={ui.input} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={ui.btnPrimary}>{pending && <Spinner />}{pending ? "Creating…" : "Create lead"}</button>
            <button type="button" className={ui.btn} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {error && <Notice tone="bad" title="Could not load leads.">{error.message} Check your connection; this page retries on its own.</Notice>}
      <Tabs label="Lead views" tabs={tabs} defaultTab={filter && seesAll ? "all" : undefined} />
    </div>
  );
}
