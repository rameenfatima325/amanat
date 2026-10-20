"use client";
// P1 owns. Accessible tabs (arrow keys move between tabs). The open tab is kept in the address (?tab=…),
// so a link or a page reload lands on the same tab. Every panel stays mounted, so typed text is not lost.
import { useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export type TabDef = { id: string; label: string; count?: number | null; attention?: boolean; content: React.ReactNode };

export function Tabs({ tabs, param = "tab", label, defaultTab }: { tabs: TabDef[]; param?: string; label: string; defaultTab?: string }) {
  const search = useSearchParams();
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const wanted = search.get(param);
  const [active, setActive] = useState(tabs.find((t) => t.id === wanted)?.id ?? tabs.find((t) => t.id === defaultTab)?.id ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ? active : tabs[0]?.id;

  const select = (id: string, focus = false) => {
    setActive(id);
    const u = new URL(window.location.href);
    u.searchParams.set(param, id);
    window.history.replaceState(null, "", u);
    if (focus) refs.current[tabs.findIndex((t) => t.id === id)]?.focus();
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-200">
        <div role="tablist" aria-label={label} className="-mb-px flex flex-wrap gap-x-1"
          onKeyDown={(e) => {
            const i = tabs.findIndex((t) => t.id === current);
            if (e.key === "ArrowRight") { e.preventDefault(); select(tabs[(i + 1) % tabs.length].id, true); }
            if (e.key === "ArrowLeft") { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length].id, true); }
          }}>
          {tabs.map((t, i) => {
            const on = t.id === current;
            return (
              <button
                key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${base}-t-${t.id}`}
                aria-selected={on} aria-controls={`${base}-p-${t.id}`} tabIndex={on ? 0 : -1} onClick={() => select(t.id)}
                className={`relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1.5 text-sm font-semibold transition-colors ${on ? "border-emerald-700 text-emerald-900" : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"}`}
              >
                {t.label}
                {t.count != null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${t.attention && t.count > 0 ? "bg-amber-100 text-amber-900" : on ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-600"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-p-${t.id}`} aria-labelledby={`${base}-t-${t.id}`} hidden={t.id !== current} tabIndex={0} className="focus-visible:outline-none">
          {t.content}
        </div>
      ))}
    </div>
  );
}
