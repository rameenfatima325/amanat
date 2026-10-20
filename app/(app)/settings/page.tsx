// Settings home: every settings page the signed-in person may open, grouped and explained in one line each.
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Kit";
import { visibleSettings } from "@/components/settings/SettingsShell";

const ICON: Record<string, IconName> = {
  "/settings/profile": "user", "/settings/calendar": "calendar", "/settings/users": "userCog", "/settings/roles": "key",
  "/settings/assignment": "shuffle", "/settings/pipelines": "columns", "/settings/fields": "sliders", "/integrations": "plug", "/audit": "shield",
};

export default async function SettingsHome() {
  const groups = await visibleSettings();
  const admin = groups.some((g) => g.title !== "Your account");
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description={admin ? "Your own account first, then how the workspace runs: team, lead rules, sales setup and connections." : "Your account, calendar and alerts. Ask an admin if something about the workspace needs changing."}
      />
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`sg-${g.title}`} className="space-y-3">
          <h2 id={`sg-${g.title}`} className="text-xs font-bold uppercase tracking-wider text-stone-500">{g.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="group flex h-full gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-md">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                    <Icon name={ICON[i.href] ?? "sliders"} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-bold text-stone-900">{i.label}<Icon name="chevronRight" className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5" /></span>
                    <span className="mt-0.5 block text-sm leading-6 text-stone-600">{i.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
