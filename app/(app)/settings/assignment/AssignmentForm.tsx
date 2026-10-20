"use client";
// P2 owns. Assignment settings form (PLAN.md §3.3).
import { useState } from "react";
import { useAction } from "@/components/ui/useAction";
import { ui } from "@/components/ui/styles";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Kit";
import { Spinner } from "@/components/ui/Spinner";
import { saveAssignmentSettings, type AssignmentSettings } from "./actions";

const LEVEL_LABEL = { NEXT_ELIGIBLE: "Next available person", BACKUP: "Backup person", MANAGER: "Manager" } as const;

export function AssignmentForm({ initial, users }: { initial: AssignmentSettings; users: { id: string; name: string }[] }) {
  const { pending, run } = useAction();
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const nameOf = (id: string | null) => users.find((u) => u.id === id)?.name;
  const secs = (n: number) => (Number.isNaN(n) ? "?" : n >= 120 && n % 60 === 0 ? `${n / 60} minutes` : `${n} seconds`);
  const who = (t: keyof typeof LEVEL_LABEL) =>
    t === "BACKUP" ? (nameOf(s.backupUserId) ? `the backup person (${nameOf(s.backupUserId)})` : "the backup person (not chosen yet)")
    : t === "MANAGER" ? (nameOf(s.managerUserId) ? `the manager (${nameOf(s.managerUserId)})` : "the manager (not chosen yet)")
    : "the next available person";
  const set = <K extends keyof AssignmentSettings>(k: K, v: AssignmentSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? NaN : Number(v));

  const setLevel = (i: number, patch: Partial<AssignmentSettings["levels"][number]>) =>
    set("levels", s.levels.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <form
      className="max-w-3xl space-y-6 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveAssignmentSettings(s), { success: "Assignment settings saved. New leads follow these rules from now on.", onSuccess: () => setSaved(s) });
      }}
    >
      <PageHeader title="Assignment and escalation" description="Choose how new leads are handed out and what happens when nobody replies. All times are in seconds." />

      <section aria-labelledby="what-h" className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-950">
        <h2 id="what-h" className="flex items-center gap-2 font-bold"><Icon name="info" className="h-4 w-4 text-emerald-700" />What happens to a new lead with these settings</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-6 marker:font-bold marker:text-emerald-700">
          <li>It goes to the next person who is <strong>Available</strong> and has fewer than <strong>{Number.isNaN(s.maxOpenLeads) ? "?" : s.maxOpenLeads}</strong> open leads.</li>
          <li>They have <strong>{secs(s.ackWindowSeconds)}</strong> to press Acknowledge.</li>
          {s.levels.map((l, i) => (
            <li key={i}>If nobody acknowledges, it moves to {who(l.type)}, who has <strong>{secs(l.seconds)}</strong>.</li>
          ))}
          <li>After the last step it stays with the last person and appears under <strong>Leads → Needs attention</strong>.</li>
          <li>A lead with no activity for <strong>{secs(s.idleSeconds)}</strong> also appears under Needs attention.</li>
        </ol>
      </section>

      <section className={`${ui.card} space-y-4`}>
        <h2 className={ui.h2}>Handing out leads</h2>
        <div className="grid gap-4 sm:grid-cols-3">
        <div className={ui.field}>
          <label htmlFor="max" className={ui.label}>Max open leads per person</label>
          <input id="max" type="number" min={1} className={ui.input} value={Number.isNaN(s.maxOpenLeads) ? "" : s.maxOpenLeads} onChange={(e) => set("maxOpenLeads", num(e.target.value))} />
        </div>
        <div className={ui.field}>
          <label htmlFor="ack" className={ui.label}>Acknowledge window (seconds)</label>
          <input id="ack" type="number" min={5} className={ui.input} value={Number.isNaN(s.ackWindowSeconds) ? "" : s.ackWindowSeconds} onChange={(e) => set("ackWindowSeconds", num(e.target.value))} />
        </div>
        <div className={ui.field}>
          <label htmlFor="idle" className={ui.label}>Idle period (seconds)</label>
          <input id="idle" type="number" min={5} className={ui.input} value={Number.isNaN(s.idleSeconds) ? "" : s.idleSeconds} onChange={(e) => set("idleSeconds", num(e.target.value))} />
        </div>
        </div>
      </section>

      <section className={`${ui.card} space-y-3`}>
        <div>
          <h2 className={ui.h2}>If nobody acknowledges in time</h2>
          <p className={`${ui.muted} mt-0.5`}>The lead moves down this list. Each level gets its own number of seconds.</p>
        </div>
        <ol className="space-y-3">
          {s.levels.map((l, i) => (
            <li key={i} className="flex flex-wrap items-end gap-3 rounded-lg bg-stone-50 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-stone-700 ring-1 ring-stone-200" aria-label={`Level ${i + 1}`}>{i + 1}</span>
              <div className={`min-w-40 flex-1 ${ui.field}`}>
                <label htmlFor={`lt-${i}`} className={ui.label}>Who gets it</label>
                <select id={`lt-${i}`} className={ui.input} value={l.type} onChange={(e) => setLevel(i, { type: e.target.value as typeof l.type })}>
                  {Object.entries(LEVEL_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
              <div className={`w-28 ${ui.field}`}>
                <label htmlFor={`ls-${i}`} className={ui.label}>Seconds</label>
                <input id={`ls-${i}`} type="number" min={5} className={ui.input} value={Number.isNaN(l.seconds) ? "" : l.seconds} onChange={(e) => setLevel(i, { seconds: num(e.target.value) })} />
              </div>
              <button type="button" className={ui.btnDanger} disabled={s.levels.length <= 1} onClick={() => set("levels", s.levels.filter((_, j) => j !== i))} aria-label={`Remove level ${i + 1}`}>
                <Icon name="trash" className="h-4 w-4" /><span className="sm:hidden">Remove</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className={ui.btn} disabled={s.levels.length >= 10} onClick={() => set("levels", [...s.levels, { type: "NEXT_ELIGIBLE", seconds: 60 }])}>
          <Icon name="plus" className="h-4 w-4" />Add level
        </button>
      </section>

      <section className={`${ui.card} grid gap-4 sm:grid-cols-2`}>
        <h2 className={`${ui.h2} sm:col-span-2`}>People to fall back on</h2>
        <div className={ui.field}>
          <label htmlFor="backup" className={ui.label}>Backup person</label>
          <select id="backup" className={ui.input} value={s.backupUserId ?? ""} onChange={(e) => set("backupUserId", e.target.value || null)}>
            <option value="">None</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className={ui.field}>
          <label htmlFor="manager" className={ui.label}>Manager</label>
          <select id="manager" className={ui.input} value={s.managerUserId ?? ""} onChange={(e) => set("managerUserId", e.target.value || null)}>
            <option value="">None</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </section>

      <section className={`${ui.card} space-y-3`}>
        <h2 className={ui.h2}>Extras</h2>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 text-sm text-stone-700 hover:bg-stone-50">
          <input type="checkbox" className={`${ui.check} mt-0.5`} checked={s.useCalendarBusy} onChange={(e) => set("useCalendarBusy", e.target.checked)} />
          <span><span className="font-semibold text-stone-900">Treat Google Calendar meetings as Busy.</span> People in a meeting are skipped when handing out leads.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 text-sm text-stone-700 hover:bg-stone-50">
          <input type="checkbox" className={`${ui.check} mt-0.5`} checked={s.autoReplyCustomer} onChange={(e) => set("autoReplyCustomer", e.target.checked)} />
          <span><span className="font-semibold text-stone-900">Auto-reply to the customer.</span> Tell new WhatsApp customers who will reply and how soon.</span>
        </label>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-stone-200 bg-white/95 p-3 shadow-md backdrop-blur">
        <span className={`mr-auto text-sm ${dirty ? "font-semibold text-amber-800" : "text-stone-500"}`}>{dirty ? "You have unsaved changes." : "All changes saved."}</span>
        <button type="button" disabled={pending || !dirty} className={ui.btnGhost} onClick={() => setS(saved)}>Undo changes</button>
        <button type="submit" disabled={pending || !dirty} className={ui.btnPrimary}>{pending && <Spinner />}{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
