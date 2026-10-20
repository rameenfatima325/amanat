// Appointments in one place: yours, and (with CRM access) everyone's upcoming ones (I3.5, I3.6).
// Booking itself starts from a customer, because every appointment belongs to a contact.
import Link from "next/link";
import { requireUserPage, can } from "@/lib/core/session";
import { myCalendar } from "@/lib/integrations/appointments";
import { Notice, PageHeader } from "@/components/ui/Kit";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { CalendarTabs } from "./CalendarTabs";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const ctx = await requireUserPage();
  const me = await myCalendar(ctx);
  const c = me.connection;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Customer appointments, shown in your time zone. To book one, open the customer or opportunity and use “Book an appointment”."
        actions={<>
          {can(ctx, "crm.view") && <Link href="/opportunities" className={ui.btn}><Icon name="target" className="h-4 w-4" />Book from an opportunity</Link>}
          <Link href="/settings/calendar" className={ui.btnGhost}><Icon name="sliders" className="h-4 w-4" />Calendar connection</Link>
        </>}
      />
      {!c && (
        <Notice tone="info" title="Your calendar is not connected yet.">
          Customers can only be booked with people who have a connected calendar. <Link href="/settings/calendar" className="font-semibold underline">Connect it on My calendar</Link>.
        </Notice>
      )}
      {c?.status === "NEEDS_RECONNECT" && (
        <Notice tone="warn" title="Your Google Calendar connection expired.">
          You can&apos;t be booked until you reconnect. <Link href="/settings/calendar" className="font-semibold underline">Reconnect on My calendar</Link>.
        </Notice>
      )}
      <CalendarTabs team={can(ctx, "crm.view")} />
    </div>
  );
}
