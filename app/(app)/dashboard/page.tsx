import Link from "next/link";
import { requireUserPage, can } from "@/lib/core/session";
import { PageHeader, Panel } from "@/components/ui/Kit";
import { ui } from "@/components/ui/styles";
import { DashboardClient } from "./DashboardClient";

export default async function Page() {
  const ctx = await requireUserPage();
  if (!can(ctx, "crm.view")) {
    // Without CRM access there are no figures to show; point to the pages this person can use.
    return (
      <div className="space-y-6">
        <PageHeader title={`Welcome, ${ctx.name.split(" ")[0]}`} description="Your role does not include customer records, so there are no figures here. Ask an admin if you need them." />
        <Panel title="Where to go">
          <div className="flex flex-wrap gap-2">
            <Link href="/inbox" className={ui.btn}>Inbox</Link>
            <Link href="/calendar" className={ui.btn}>Calendar</Link>
            <Link href="/settings/profile" className={ui.btn}>Profile and alerts</Link>
          </div>
        </Panel>
      </div>
    );
  }
  return <DashboardClient firstName={ctx.name.split(" ")[0]} canReassign={can(ctx, "leads.reassign")} />;
}
