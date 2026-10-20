"use client";
// P2 owns. Home (F5.1–F5.5). Answers three questions, top to bottom:
//   1. What needs my attention?  2. What is happening?  3. Where do I go next?
// Every figure comes from lib/metrics through getDashboard (Q12); each one links to the list behind it (F5.3).
// Without company-wide access every figure is limited to the signed-in person (F5.4). Refreshes every 3 seconds.
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAction } from "@/components/ui/useAction";
import { ui } from "@/components/ui/styles";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Avatar, Notice } from "@/components/ui/Kit";
import { Spinner } from "@/components/ui/Spinner";
import { STATUS_DOT } from "../leads/StatusSelector";
import { acknowledgeLead } from "../leads/actions";
import { Countdown } from "../leads/Countdown";
import { fetchLeads } from "../leads/LeadsClient";
import { byUrgency } from "../leads/LeadCard";
import { getDashboard, saveDashboardPrefs, type DashboardData } from "./actions";
import { TILES } from "./tiles";

const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function duration(s: number | null): string {
  if (s === null) return "No data yet";
  const r = Math.round(s);
  if (r < 60) return `${r}s`;
  if (r < 3600) return `${Math.floor(r / 60)}m ${r % 60}s`;
  return `${Math.floor(r / 3600)}h ${Math.floor((r % 3600) / 60)}m`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const STATUS_LABEL = { AVAILABLE: "Available", BUSY: "Busy", ON_LEAVE: "On leave", OFFLINE: "Offline" } as const;

/** One figure in the "At a glance" strip. Links to the records behind it. */
function Stat({ label, value, note, href, icon, alert }: { label: string; value: React.ReactNode; note?: string; href?: string; icon: IconName; alert?: boolean }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
        <Icon name={icon} className={`h-3.5 w-3.5 ${alert ? "text-amber-600" : "text-stone-400"}`} />{label}
      </span>
      <span className={`mt-1 block text-xl font-bold tabular-nums tracking-tight ${alert ? "text-amber-800" : "text-stone-900"}`}>{value}</span>
      {note && <span className="mt-0.5 block text-[11px] leading-4 text-stone-500">{note}</span>}
    </>
  );
  const box = "block min-w-0 px-4 py-3.5";
  return href ? <Link href={href} className={`${box} transition-colors hover:bg-stone-50`}>{body}</Link> : <div className={box}>{body}</div>;
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">{children}</h2>
      {action}
    </div>
  );
}

export function DashboardClient({ firstName, canReassign }: { firstName: string; canReassign: boolean }) {
  const { data, error, mutate } = useSWR("dashboard", async () => {
    const r = await getDashboard();
    if (!r.ok) throw new Error(r.error);
    return { d: r.data, at: Date.now() };
  }, { refreshInterval: 3000 });
  const leads = useSWR("leads", () => fetchLeads(), { refreshInterval: 3000 });
  const { pending, run } = useAction();
  const ack = useAction();
  const [editing, setEditing] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);

  if (error && !data) return <Notice tone="bad" title="Could not load your home page.">{error.message} This page retries on its own.</Notice>;
  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <p className="sr-only" role="status">Loading…</p>
        <div className="h-9 w-64 animate-pulse rounded-lg bg-stone-200/70" />
        <div className="h-32 animate-pulse rounded-xl border border-stone-200 bg-white" />
        <div className="h-24 animate-pulse rounded-xl border border-stone-200 bg-white" />
      </div>
    );
  }
  const d: DashboardData = data.d;
  const show = (id: string) => !d.hidden.includes(id);

  const mine = leads.data ? leads.data.rows.filter((l) => l.isMine && l.status === "ASSIGNED").sort(byUrgency) : [];
  const actionItems = mine.length + (d.recovery > 0 ? 1 : 0);

  // Group the pipeline rows by stage (one row per stage, one amount per currency).
  const stages: { id: string; name: string; count: number; values: string[] }[] = [];
  for (const p of d.pipeline) {
    let s = stages.find((x) => x.id === p.stageId);
    if (!s) { s = { id: p.stageId, name: p.stage, count: 0, values: [] }; stages.push(s); }
    s.count += p.count;
    s.values.push(p.value === null ? "•••••" : `${p.currency} ${num(p.value)}`);
  }
  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const totalDeals = stages.reduce((n, s) => n + s.count, 0);

  const stats = [
    show("newLeads") && <Stat key="n" icon="leads" label="New leads today" value={num(d.newLeads)} href={`/leads?filter=today${d.company ? "&tab=all" : ""}`} />,
    show("firstResponse") && <Stat key="f" icon="timer" label="Avg. first response" value={duration(d.firstResponseSeconds)} note="Last 7 days" href="/leads" />,
    show("escalations") && <Stat key="e" icon="arrowUp" label="Escalations (24 h)" value={num(d.escalations.escalations)} note={`+ ${d.escalations.manual} manual ${d.escalations.manual === 1 ? "reassign" : "reassigns"}`} href={`/leads?filter=escalated24h${d.company ? "&tab=all" : ""}`} alert={d.escalations.escalations > 0} />,
    show("recovery") && <Stat key="r" icon="lifebuoy" label="Needs attention" value={num(d.recovery)} note="Recovery queue" href="/leads?tab=attention" alert={d.recovery > 0} />,
    show("payments") && <Stat key="p" icon="card" label="Paid this month" value={`PKR ${num(d.payments)}`} note="Paid minus refunds" href="/payments?month=current" />,
    show("atRisk") && <Stat key="a" icon="alert" label="Revenue at risk" value={d.atRisk.value === null ? "•••••" : `${d.atRisk.currency} ${num(d.atRisk.value)}`} note={`${d.atRisk.count} overdue or unassigned`} href="/leads?tab=attention" alert={d.atRisk.count > 0} />,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className={ui.h1}>{greeting()}, {firstName}</h1>
          <p className="text-sm text-stone-600">{d.company ? "Here is what needs you, and how the whole workspace is doing." : "Here is what needs you, and how your own leads and deals are doing."}</p>
        </div>
        <button type="button" className={ui.btnGhost} aria-expanded={editing} onClick={() => { setHidden(d.hidden); setEditing((e) => !e); }}>
          <Icon name={editing ? "x" : "sliders"} className="h-4 w-4" /> {editing ? "Close" : "Customize"}
        </button>
      </header>

      {editing && (
        <form
          className={`${ui.card} animate-fade-in space-y-4`}
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveDashboardPrefs({ hiddenTiles: hidden }), { success: "Home page saved.", onSuccess: () => { setEditing(false); mutate(); } });
          }}
        >
          <fieldset>
            <legend className={ui.h2}>Show these on your home page</legend>
            <p className={`${ui.muted} mt-0.5`}>Hidden items are only hidden for you. Items that need your attention are always shown.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TILES.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50 has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/50">
                  <input type="checkbox" className={ui.check} checked={!hidden.includes(t.id)}
                    onChange={(e) => setHidden((h) => (e.target.checked ? h.filter((x) => x !== t.id) : [...h, t.id]))} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button type="submit" className={ui.btnPrimary} disabled={pending}>{pending && <Spinner />}{pending ? "Saving…" : "Save"}</button>
            <button type="button" className={ui.btn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* 1. What needs my attention */}
      <section aria-labelledby="todo-h" className="space-y-3">
        <SectionTitle action={<Link href="/leads" className="text-sm font-semibold text-emerald-800 hover:underline">All my leads</Link>}>
          <span id="todo-h">Needs your attention</span>
        </SectionTitle>
        {actionItems === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-sm text-emerald-950">
            <Icon name="checkCircle" className="h-5 w-5 text-emerald-700" />
            <span><strong>You are all caught up.</strong> No leads are waiting for you to acknowledge{d.company ? " and nothing is in the recovery queue" : ""}.</span>
          </div>
        ) : (
          <div className={ui.cardFlush}>
            <ul className="divide-y divide-stone-100">
              {mine.slice(0, 5).map((l) => (
                <li key={l.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Link href={`/contacts/${l.contactId}`} className="font-bold text-stone-900 hover:text-emerald-800 hover:underline">{l.contactName}</Link>
                    <p className="text-sm text-stone-600">New lead for you. Acknowledge it before the timer runs out.</p>
                  </div>
                  {l.msLeft !== null && leads.data && <Countdown msLeft={l.msLeft} receivedAt={leads.data.receivedAt} />}
                  <button type="button" disabled={ack.pending} className={ui.btnPrimary}
                    onClick={() => ack.run(() => acknowledgeLead({ leadId: l.id }), { success: "Lead acknowledged. It is yours now.", onSuccess: () => { leads.mutate(); mutate(); } })}>
                    {ack.pending ? <Spinner /> : <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />}Acknowledge
                  </button>
                </li>
              ))}
              {mine.length > 5 && (
                <li className="px-5 py-3 text-sm"><Link href="/leads" className={ui.link}>{mine.length - 5} more waiting for you</Link></li>
              )}
              {d.recovery > 0 && (
                <li>
                  <Link href="/leads?tab=attention" className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-stone-50">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700"><Icon name="lifebuoy" className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-stone-900">{d.recovery} {d.recovery === 1 ? "lead needs" : "leads need"} someone to step in</span>
                      <span className="block text-sm text-stone-600">Overdue, unassigned, escalated more than once, idle, or the owner is away.{canReassign ? " Reassign them from the list." : ""}</span>
                    </span>
                    <Icon name="chevronRight" className="h-4 w-4 text-stone-400" />
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </section>

      {/* 2. What is happening */}
      {stats.length > 0 && (
        <section aria-labelledby="glance-h" className="space-y-3">
          <SectionTitle><span id="glance-h">{d.company ? "Workspace at a glance" : "Your figures"}</span></SectionTitle>
          <div className={`${ui.cardFlush} grid grid-cols-2 divide-stone-100 sm:grid-cols-3 xl:grid-cols-6 [&>*]:border-b [&>*]:border-r [&>*]:border-stone-100`}>
            {stats}
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {show("pipeline") ? (
          <section className={ui.cardFlush} aria-labelledby="pipe-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200 px-5 py-4">
              <h2 id="pipe-h" className={ui.h2}>Open pipeline by stage</h2>
              <Link href="/opportunities?view=board" className="text-sm font-semibold text-emerald-800 hover:underline">{totalDeals} open {totalDeals === 1 ? "deal" : "deals"} · Board</Link>
            </div>
            {stages.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-600">No open opportunities. <Link href="/opportunities" className={ui.link}>Create one</Link> from a customer who is interested.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {stages.map((s) => (
                  <li key={s.id}>
                    <Link href={`/opportunities?stage=${s.id}`} className="group grid gap-2 px-5 py-3 transition-colors hover:bg-stone-50 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                      <span className="min-w-0 truncate text-sm font-semibold text-stone-900 group-hover:text-emerald-800">{s.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                          <span className="block h-full rounded-full bg-emerald-600/80" style={{ width: `${Math.max(4, (s.count / maxCount) * 100)}%` }} />
                        </span>
                        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-stone-600">{s.count} {s.count === 1 ? "deal" : "deals"}</span>
                      </span>
                      <span className="flex flex-wrap gap-x-3 text-sm font-semibold tabular-nums text-stone-900 sm:justify-end">
                        {s.values.map((v, i) => <span key={i}>{v}</span>)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : <span />}

        <div className="space-y-6">
          {show("appointments") && (
            <section className={ui.cardFlush} aria-labelledby="appts-h">
              <div className="flex items-baseline justify-between gap-2 border-b border-stone-200 px-5 py-4">
                <h2 id="appts-h" className={ui.h2}>Next 7 days <span className="font-semibold tabular-nums text-stone-500">({d.appointments.count})</span></h2>
                <Link href="/calendar" className="text-sm font-semibold text-emerald-800 hover:underline">Calendar</Link>
              </div>
              {d.appointments.next.length === 0 ? (
                <p className="px-5 py-5 text-sm text-stone-600">No appointments booked. Book one from a customer or opportunity.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {d.appointments.next.map((a) => {
                    const dt = new Date(a.startUtc);
                    return (
                      <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="grid w-11 shrink-0 rounded-lg border border-stone-200 text-center leading-tight">
                          <span className="rounded-t-lg bg-stone-50 text-[10px] font-bold uppercase text-stone-500">{dt.toLocaleDateString(undefined, { month: "short" })}</span>
                          <span className="py-0.5 text-sm font-bold tabular-nums text-stone-900">{dt.getDate()}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-stone-900">{a.title}</span>
                          <span className="block text-xs text-stone-600">{dt.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {show("availability") && d.company && (
            <section className={ui.cardFlush} aria-labelledby="team-h">
              <div className="flex items-baseline justify-between gap-2 border-b border-stone-200 px-5 py-4">
                <h2 id="team-h" className={ui.h2}>Team availability</h2>
                <Link href="/leads?tab=team" className="text-sm font-semibold text-emerald-800 hover:underline">Team</Link>
              </div>
              <p className="flex flex-wrap gap-x-4 gap-y-1 px-5 pt-3 text-xs font-semibold text-stone-600">
                {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOT[k]}`} />{d.availability.counts[k]} {STATUS_LABEL[k]}</span>
                ))}
              </p>
              <ul className="space-y-2 px-5 py-3">
                {d.availability.people.map((p) => (
                  <li key={p.name} className="flex items-center gap-2.5 text-sm">
                    <Avatar name={p.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-stone-800">{p.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-stone-600"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status] ?? "bg-stone-400"}`} />{STATUS_LABEL[p.status as keyof typeof STATUS_LABEL] ?? p.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* 3. Where to go next */}
      <nav aria-label="Shortcuts" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/leads", icon: "leads" as IconName, title: "Leads", text: "Acknowledge and work your leads" },
          { href: "/inbox", icon: "inbox" as IconName, title: "Inbox", text: "Reply to customer messages" },
          { href: "/opportunities", icon: "target" as IconName, title: "Opportunities", text: "Move deals through the pipeline" },
          { href: "/calendar", icon: "calendar" as IconName, title: "Calendar", text: "See upcoming appointments" },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-xs transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-md">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-700"><Icon name={x.icon} className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-sm font-bold text-stone-900">{x.title}</span><span className="block truncate text-xs text-stone-600">{x.text}</span></span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
