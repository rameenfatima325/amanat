// The app's navigation model. Two lists:
//  - NAV: the main sidebar (everyday work and customer records). Short on purpose.
//  - SETTINGS_NAV: everything under Settings (your own account, then workspace administration).
// `perm` only hides a link; every page still checks the permission on the server.
import type { Permission } from "./permissions";

export type NavItem = {
  href: string;
  label: string;
  perm?: Permission;
  owner: "P1" | "P2" | "P3";
  section?: "work" | "customers" | "settings";
  /** Other paths that should mark this item as the current page. */
  also?: string[];
};

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", owner: "P2", section: "work" },
  { href: "/leads", label: "Leads", perm: "crm.view", owner: "P2", section: "work", also: ["/recovery"] },
  { href: "/inbox", label: "Inbox", owner: "P3", section: "work" },
  { href: "/calendar", label: "Calendar", owner: "P3", section: "work" },
  { href: "/contacts", label: "Contacts", perm: "crm.view", owner: "P1", section: "customers" },
  { href: "/companies", label: "Companies", perm: "crm.view", owner: "P1", section: "customers" },
  { href: "/opportunities", label: "Opportunities", perm: "crm.view", owner: "P1", section: "customers" },
  { href: "/payments", label: "Payments", perm: "crm.view", owner: "P3", section: "customers" },
  { href: "/lists", label: "Saved lists", perm: "crm.view", owner: "P2", section: "customers" },
  { href: "/settings", label: "Settings", owner: "P1", section: "settings", also: ["/integrations", "/audit"] },
];

export type SettingsItem = { href: string; label: string; description: string; perm?: Permission; also?: string[] };
export type SettingsGroup = { title: string; items: SettingsItem[] };

export const SETTINGS_NAV: SettingsGroup[] = [
  {
    title: "Your account",
    items: [
      { href: "/settings/profile", label: "Profile and alerts", description: "Your availability, Telegram alerts and signed-in devices." },
      { href: "/settings/calendar", label: "My calendar", description: "Connect Google Calendar so customers can be booked with you." },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/settings/users", label: "Team members", perm: "users.manage", description: "Invite people, set their level, role and availability." },
      { href: "/settings/roles", label: "Roles and permissions", perm: "users.manage", description: "Decide what each role is allowed to see and do." },
    ],
  },
  {
    title: "Leads",
    items: [
      { href: "/settings/assignment", label: "Assignment and escalation", perm: "assignment.manage", description: "Who gets new leads, how long they have to respond, and what happens next." },
    ],
  },
  {
    title: "Sales setup",
    items: [
      { href: "/settings/pipelines", label: "Pipelines", perm: "pipeline.configure", description: "The stages an opportunity moves through, and what must be filled in." },
      { href: "/settings/fields", label: "Custom fields", perm: "pipeline.configure", description: "Extra information you keep on contacts, companies and opportunities." },
    ],
  },
  {
    title: "Connections and records",
    items: [
      { href: "/integrations", label: "Integrations", description: "WhatsApp, website chat, Stripe, Google Calendar and Telegram: status and setup.", also: ["/integrations/history", "/integrations/fault-lab"] },
      { href: "/audit", label: "Audit history", perm: "audit.view", description: "Every important change, who made it and when. Tamper-proof." },
    ],
  },
];
