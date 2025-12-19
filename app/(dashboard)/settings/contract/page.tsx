import { redirect } from "next/navigation"

export default function ContractSettingsPage() {
  redirect("/settings?tab=legal")
}



