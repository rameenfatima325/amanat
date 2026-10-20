import { requireUserPage, can } from "@/lib/core/session";
import { NoAccess } from "@/components/ui/NoAccess";
import { LeadsClient } from "./LeadsClient";

export default async function Page({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const ctx = await requireUserPage();
  if (!can(ctx, "crm.view")) return <NoAccess what="view leads (this needs the “View CRM records” permission)" />;
  const { filter } = await searchParams;
  return (
    <LeadsClient
      canCreate={can(ctx, "crm.create")} canManageTeam={can(ctx, "users.manage")} canReassign={can(ctx, "leads.reassign")}
      seesAll={can(ctx, "dashboard.company")}
      filter={filter === "today" || filter === "escalated24h" ? filter : undefined}
    />
  );
}
