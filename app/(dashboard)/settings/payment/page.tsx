import { redirect } from "next/navigation"

export default function PaymentSettingsPage() {
  redirect("/settings?tab=payments")
}


