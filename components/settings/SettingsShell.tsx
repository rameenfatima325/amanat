// Wraps every settings page (including Integrations and Audit history) with the settings menu.
// Links the user may not open are hidden here; each page still checks permissions on the server.
import { requireUserPage, can } from "@/lib/core/session";
import { SETTINGS_NAV } from "@/lib/shared/nav";
import { SettingsNav } from "./SettingsNav";

export async function visibleSettings() {
  const ctx = await requireUserPage();
  return SETTINGS_NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(ctx, i.perm)) })).filter((g) => g.items.length > 0);
}

export async function SettingsShell({ children }: { children: React.ReactNode }) {
  const groups = await visibleSettings();
  return (
    <div className="space-y-5 lg:grid lg:gap-8 lg:space-y-0 lg:has-[>nav]:grid-cols-[13rem_minmax(0,1fr)]">
      <SettingsNav groups={groups} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
