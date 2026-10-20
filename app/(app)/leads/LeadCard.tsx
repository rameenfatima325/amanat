"use client";
// P2 owns. One lead: who owns it, its state, how it got to them, and the next step. Used on Leads and Home.
import Link from "next/link";
import { useAction } from "@/components/ui/useAction";
import { ui } from "@/components/ui/styles";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { acknowledgeLead, type LeadRow } from "./actions";
import { Countdown } from "./Countdown";
import { ReassignMenu } from "./ReassignMenu";
import { LeadStatusBadge, SourceBadge } from "./LeadBadges";

/** How the lead reached its current owner. Automatic escalation and manual reassignment are kept clearly apart. */
export const HOW: Record<string, { label: string; icon: IconName; tone: string }> = {
  AUTO: { label: "Assigned automatically", icon: "shuffle", tone: "text-stone-600" },
  ESCALATION: { label: "Escalated: the previous owner did not acknowledge in time", icon: "arrowUp", tone: "text-amber-800" },
  MANUAL: { label: "Reassigned by a manager", icon: "user", tone: "text-sky-800" },
  ABSENCE: { label: "Moved: the previous owner went away", icon: "plane", tone: "text-sky-800" },
};

/** Waiting-for-me first (least time left first), then nobody assigned, then the rest, newest first. */
export function byUrgency(a: LeadRow, b: LeadRow) {
  const rank = (l: LeadRow) => (l.isMine && l.status === "ASSIGNED" ? 0 : l.status === "UNASSIGNED" ? 1 : l.status === "ASSIGNED" ? 2 : l.status === "NEW" ? 3 : 4);
  return rank(a) - rank(b) || (a.msLeft ?? Infinity) - (b.msLeft ?? Infinity) || b.createdAt.localeCompare(a.createdAt);
}

function nextStep(l: LeadRow, canReassign: boolean): string {
  if (l.isMine && l.status === "ASSIGNED") return "Acknowledge before the timer runs out, then contact the customer.";
  if (l.isMine && l.status === "ACKNOWLEDGED") return "Contact the customer and record what happened: send a message, add a note or move the opportunity.";
  if (l.status === "UNASSIGNED") return canReassign ? "Nobody has this lead. Choose someone with “Reassign to”." : "Nobody has this lead yet. A manager has been told.";
  if (l.status === "ASSIGNED") return `Waiting for ${l.ownerName ?? "the owner"} to acknowledge.`;
  if (l.status === "NEW") return "Being assigned to someone now.";
  return `${l.ownerName ?? "The owner"} is working on it.`;
}

export function LeadCard({ lead: l, receivedAt, canReassign, onChanged }: { lead: LeadRow; receivedAt: number; canReassign: boolean; onChanged: () => void }) {
  const { pending, run } = useAction();
  const mineWaiting = l.isMine && l.status === "ASSIGNED";
  const how = l.lastKind ? HOW[l.lastKind] : null;
  return (
    <article aria-label={`Lead: ${l.contactName}`} className={`rounded-xl border bg-white p-4 shadow-xs sm:p-5 ${mineWaiting ? "border-amber-300 ring-1 ring-amber-200" : l.status === "UNASSIGNED" ? "border-red-200" : "border-stone-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Link href={`/contacts/${l.contactId}`} className="block truncate text-base font-bold text-stone-900 hover:text-emerald-800 hover:underline">{l.contactName}</Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <LeadStatusBadge status={l.status} />
            <SourceBadge source={l.source} />
            {l.escalations > 0 && <span className="text-xs font-semibold text-amber-800">Escalated {l.escalations}×</span>}
          </div>
        </div>
        {l.msLeft !== null && <Countdown msLeft={l.msLeft} receivedAt={receivedAt} />}
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="text-stone-500">Owner</dt>
        <dd className="font-semibold text-stone-900">{l.isMine ? "You" : (l.ownerName ?? "Nobody yet")}</dd>
        {how && (<>
          <dt className="text-stone-500">How</dt>
          <dd className={`flex items-start gap-1.5 ${how.tone}`}><Icon name={how.icon} className="mt-0.5 h-3.5 w-3.5" />{how.label}</dd>
        </>)}
        {l.reason && (<>
          <dt className="text-stone-500">Why</dt>
          <dd className="text-stone-700">{l.reason}</dd>
        </>)}
        <dt className="text-stone-500">Next step</dt>
        <dd className="font-medium text-stone-900">{nextStep(l, canReassign)}</dd>
      </dl>

      <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        {mineWaiting ? (
          <button type="button" disabled={pending} onClick={() => run(() => acknowledgeLead({ leadId: l.id }), { success: "Lead acknowledged. It is yours now.", onSuccess: onChanged })}
            className={`${ui.btnPrimary} !h-11 !px-6 !text-[15px]`}>
            {pending ? <Spinner /> : <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />} Acknowledge
          </button>
        ) : (
          <Link href={`/contacts/${l.contactId}`} className={l.isMine ? ui.btnPrimary : ui.btn}>Open contact <Icon name="arrowRight" className="h-4 w-4" /></Link>
        )}
        {mineWaiting && <Link href={`/contacts/${l.contactId}`} className={ui.btnGhost}>Open contact</Link>}
        {canReassign && l.status !== "NEW" && <div className="sm:ml-auto"><ReassignMenu leadId={l.id} currentOwnerName={l.ownerName} onDone={onChanged} /></div>}
      </div>
    </article>
  );
}
