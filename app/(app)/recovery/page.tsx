// The recovery queue now lives on the Leads page ("Needs attention" tab). Old links keep working.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/leads?tab=attention");
}
