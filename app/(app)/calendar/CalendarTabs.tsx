"use client";
import { Tabs, type TabDef } from "@/components/ui/Tabs";
import { AppointmentList } from "@/lib/integrations/ui/Calendar";

export function CalendarTabs({ team }: { team: boolean }) {
  const tabs: TabDef[] = [
    {
      id: "mine", label: "My appointments",
      content: <div className="rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-xs"><AppointmentList query={{ mine: "1" }} emptyText="No upcoming appointments with you. They appear here when someone books a customer with you." /></div>,
    },
  ];
  if (team) {
    tabs.push({
      id: "team", label: "Whole team",
      content: <div className="rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-xs"><AppointmentList query={{ upcoming: "1" }} emptyText="No upcoming appointments for anyone in the team." /></div>,
    });
  }
  return <Tabs label="Appointments" tabs={tabs} />;
}
