"use client";
// P1 owns. Sidebar links, grouped, with icons: marks the current page and closes the phone menu after a tap (Q7).
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { listLeads } from "@/app/(app)/leads/actions";
import { Icon, type IconName } from "./Icon";

const ICONS: Record<string, IconName> = {
  "/dashboard": "dashboard", "/leads": "leads", "/inbox": "inbox", "/calendar": "calendar",
  "/contacts": "users", "/companies": "building", "/opportunities": "target", "/lists": "bookmark", "/payments": "card",
  "/settings": "sliders",
};

const SECTIONS = [
  { key: "work", title: "Daily work" },
  { key: "customers", title: "Customers and sales" },
] as const;

export type NavLinkItem = { href: string; label: string; section?: string; also?: string[] };

export function closeNav() {
  const t = document.getElementById("nav-toggle") as HTMLInputElement | null;
  if (t) t.checked = false;
}

export const isActive = (path: string, href: string, also: string[] = []) =>
  [href, ...also].some((h) => path === h || path.startsWith(h + "/"));

/** Number of leads waiting for the signed-in person to acknowledge. */
function useWaitingCount(enabled: boolean) {
  const { data } = useSWR(enabled ? "nav-waiting" : null, async () => {
    const r = await listLeads({});
    if (!r.ok) return 0;
    return r.data.filter((l) => l.isMine && l.status === "ASSIGNED").length;
  }, { refreshInterval: 3000 });
  return data ?? 0;
}

function NavLink({ item, path, badge }: { item: NavLinkItem; path: string; badge?: number }) {
  const active = isActive(path, item.href, item.also);
  return (
    <Link
      href={item.href}
      onClick={closeNav}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-emerald-50 text-emerald-900" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-emerald-700" />}
      <Icon name={ICONS[item.href] ?? "chevronRight"} className={`h-[18px] w-[18px] ${active ? "text-emerald-700" : "text-stone-400 group-hover:text-stone-600"}`} />
      <span className="flex-1">{item.label}</span>
      {!!badge && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-900 ring-1 ring-amber-200">
          {badge}<span className="sr-only"> waiting for you</span>
        </span>
      )}
    </Link>
  );
}

export function NavLinks({ items }: { items: NavLinkItem[] }) {
  const path = usePathname();
  const waiting = useWaitingCount(items.some((i) => i.href === "/leads"));
  const settings = items.find((i) => i.section === "settings");
  return (
    <div className="flex h-full flex-col gap-6">
      {SECTIONS.map((s) => {
        const list = items.filter((i) => (i.section ?? "work") === s.key);
        if (list.length === 0) return null;
        return (
          <div key={s.key}>
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{s.title}</p>
            <ul className="space-y-0.5">
              {list.map((n) => <li key={n.href}><NavLink item={n} path={path} badge={n.href === "/leads" ? waiting : undefined} /></li>)}
            </ul>
          </div>
        );
      })}
      {settings && (
        <ul className="mt-auto border-t border-stone-100 pt-3">
          <li><NavLink item={settings} path={path} /></li>
        </ul>
      )}
    </div>
  );
}
