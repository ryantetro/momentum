"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toaster"
import { Bell, Mail } from "lucide-react"

export function NotificationsTab() {
  const supabase = createClient()
  const { toast } = useToast()
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setLoading(false)
          return
        }

        const { data: photographer, error } = await supabase
          .from("photographers")
          .select("auto_reminders_enabled")
          .eq("user_id", session.user.id)
          .single()

        if (error) {
          // Check if error is due to missing column (column doesn't exist yet)
          if (error.code === "PGRST116" || error.message?.includes("column") || error.message?.includes("does not exist")) {
            console.log("auto_reminders_enabled column not found, defaulting to false. Please run migration 018_add_auto_reminders.sql")
            setAutoRemindersEnabled(false)
            setLoading(false)
            return
          }
          console.error("Error fetching notification settings:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })
          setLoading(false)
          return
        }

        if (photographer) {
          setAutoRemindersEnabled(photographer.auto_reminders_enabled || false)
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [supabase])

  const handleToggleAutoReminders = async (enabled: boolean) => {
    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "Please log in to update settings",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from("photographers")
        .update({ auto_reminders_enabled: enabled })
        .eq("user_id", session.user.id)

      if (error) {
        // Check if error is due to missing column
        if (error.code === "42703" || error.message?.includes("column") || error.message?.includes("does not exist")) {
          throw new Error("The auto_reminders_enabled column doesn't exist yet. Please run migration 018_add_auto_reminders.sql in your Supabase SQL editor.")
        }
        throw error
      }

      setAutoRemindersEnabled(enabled)
      toast({
        title: "Settings updated",
        description: enabled
          ? "Automated payment reminders are now enabled"
          : "Automated payment reminders are now disabled",
      })
    } catch (error: any) {
      console.error("Error updating notification settings:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please ensure the database migration has been run.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Automated Payment Reminders
          </CardTitle>
          <CardDescription>
            Configure automated email reminders for unpaid balances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="auto-reminders" className="text-base font-medium">
                Enable Automated Payment Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Momentum will automatically email your clients a link to pay their remaining balance 24 hours after their event date if a balance is still detected.
              </p>
            </div>
            <Switch
              id="auto-reminders"
              checked={autoRemindersEnabled}
              onCheckedChange={handleToggleAutoReminders}
              disabled={saving}
            />
          </div>

          {autoRemindersEnabled && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    How it works
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>24 hours after an event, if a balance is still due, your client will receive a friendly reminder email</li>
                    <li>The email includes a direct link to pay their remaining balance</li>
                    <li>If payment is still not received after 7 days, a follow-up reminder will be sent</li>
                    <li>You'll receive a notification when a client pays after receiving a reminder</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
