"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"

interface FormField {
  id: string
  label: string
  placeholder: string
  required: boolean
}

interface CustomFormProps {
  bookingId: string
  portalToken: string
}

export function CustomForm({ bookingId, portalToken }: CustomFormProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function loadForm() {
      try {
        console.log("[Client] Fetching form for token:", portalToken)
        // Use the API route to fetch form data (public access via token)
        const response = await fetch(`/api/portal/form/${portalToken}`)

        console.log("[Client] API Response status:", response.status)

        if (!response.ok) {
          throw new Error("Failed to load form")
        }

        const data = await response.json()
        console.log("[Client] Form data received:", data)

        if (data) {
          if (data.form_fields) {
            console.log("[Client] Setting fields:", data.form_fields.length)
            setFields(data.form_fields as FormField[])
          }
          if (data.form_data) {
            setFormData(data.form_data as Record<string, string>)
          }
        }
      } catch (error: any) {
        console.error("Error loading form:", error)
      } finally {
        setLoading(false)
      }
    }

    if (portalToken) {
      loadForm()
    }
  }, [portalToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/bookings/save-form-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          portalToken,
          formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save form data")
      }

      toast({ title: "Form submitted successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (fields.length === 0) {
    return null // Don't show form if no fields
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
        <CardDescription>
          Please fill out the following information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.id}
                value={formData[field.id] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [field.id]: e.target.value })
                }
                placeholder={field.placeholder}
                required={field.required}
                disabled={saving}
              />
            </div>
          ))}
          <Button type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

