import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "RESEND_API_KEY is not set. Email functionality will not work."
  )
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}) {
  if (!resend) {
    console.warn("Resend client not initialized. Email not sent:", {
      to,
      subject,
    })
    return { success: false, error: "Resend not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Momentum <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
      ...(replyTo && { reply_to: replyTo }),
    })

    if (error) {
      console.error("Error sending email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error sending email:", error)
    return { success: false, error: error.message }
  }
}

