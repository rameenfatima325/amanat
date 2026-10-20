"use client";
// Secondary menu for everything under Settings. On phones it collapses to a "Back to all settings" link.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { isActive } from "@/components/ui/NavLinks";
import type { SettingsGroup } from "@/lib/shared/nav";

export function SettingsNav({ groups }: { groups: SettingsGroup[] }) {
  const path = usePathname();
  if (path === "/settings") return null;
  const current = groups.flatMap((g) => g.items).find((i) => isActive(path, i.href, i.also));
  return (
    <>
      <nav aria-label="Settings" className="lg:hidden">
        <Link href="/settings" className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-stone-600 hover:text-stone-900">
          <Icon name="arrowLeft" className="h-4 w-4" /> All settings{current ? <span className="sr-only"> (now on {current.label})</span> : null}
        </Link>
      </nav>
      <nav aria-label="Settings" className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <Link href="/settings" className="block px-3 text-sm font-bold text-stone-900 hover:text-emerald-800">Settings</Link>
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map((i) => {
                  const on = isActive(path, i.href, i.also);
                  return (
                    <li key={i.href}>
                      <Link href={i.href} aria-current={on ? "page" : undefined}
                        className={`block rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "bg-white text-emerald-900 shadow-xs ring-1 ring-stone-200" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}>
                        {i.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
