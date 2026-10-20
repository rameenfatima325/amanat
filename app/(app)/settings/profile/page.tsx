// Your own account: availability, Telegram alerts, calendar and signed-in devices (F3.2, I4.3, F1.1).
import Link from "next/link";
import { requireUserPage, can } from "@/lib/core/session";
import { Avatar, Detail, PageHeader, Panel } from "@/components/ui/Kit";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { TelegramConnectButton } from "@/components/slots/TelegramIntegrationCard";
import { StatusSelector } from "../../leads/StatusSelector";
import { logoutAllAction } from "../../../(auth)/actions";

const LEVEL = { OWNER: "Owner", ADMIN: "Admin", USER: "User" } as const;

export default async function ProfilePage() {
  const ctx = await requireUserPage();
  const crm = can(ctx, "crm.view");
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Profile and alerts" description="How you appear to the team, how you hear about urgent leads, and where you are signed in." />

      <Panel id="me" title="Your account">
        <div className="flex items-center gap-4">
          <Avatar name={ctx.name} size="lg" />
          <dl className="grid flex-1 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Detail label="Name">{ctx.name}</Detail>
            <Detail label="Email"><span className="break-all">{ctx.email}</span></Detail>
            <Detail label="Level">{LEVEL[ctx.level]}</Detail>
          </dl>
        </div>
      </Panel>

      {crm && (
        <Panel id="avail" title="Availability" description="New leads only go to people who are Available. You can also change this from the top bar on any page.">
          <StatusSelector />
        </Panel>
      )}

      {crm && (
        <Panel id="tg" title="Telegram alerts" description="Get a Telegram message when a lead is escalated to you, with a button to acknowledge it straight away.">
          <TelegramConnectButton />
        </Panel>
      )}

      <Panel id="cal" title="Calendar" description="Connect Google Calendar so customers can be booked with you and your meetings count as Busy.">
        <Link href="/settings/calendar" className={ui.btn}><Icon name="calendar" className="h-4 w-4" />Open My calendar</Link>
      </Panel>

      <Panel id="devices" title="Signed-in devices" description="Lost a phone or used a shared computer? Sign out everywhere. You will need to log in again on this device too.">
        <form action={logoutAllAction}>
          <button className={ui.btnDanger}><Icon name="power" className="h-4 w-4" />Log out of all devices</button>
        </form>
      </Panel>
    </div>
  );
}
