"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"

interface FormField {
  id: string
  label: string
  placeholder: string
  required: boolean
}

interface CustomFormBuilderProps {
  bookingId: string
}

export function CustomFormBuilder({ bookingId }: CustomFormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function loadForm() {
      try {
        const { data, error } = await supabase
          .from("client_forms")
          .select("form_fields")
          .eq("booking_id", bookingId)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" - that's okay
          throw error
        }

        if (data && data.form_fields) {
          setFields(data.form_fields as FormField[])
        }
      } catch (error: any) {
        console.error("Error loading form:", error)
      }
    }

    loadForm()
  }, [bookingId, supabase])

  const addField = () => {
    if (fields.length >= 10) {
      toast({
        title: "Limit reached",
        description: "Maximum 10 fields allowed",
        variant: "destructive",
      })
      return
    }

    const newField: FormField = {
      id: Math.random().toString(36).substring(7),
      label: "",
      placeholder: "",
      required: false,
    }
    setFields([...fields, newField])
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    )
  }

  const saveForm = async () => {
    setSaving(true)
    try {
      // Check if form exists
      const { data: existing } = await supabase
        .from("client_forms")
        .select("id")
        .eq("booking_id", bookingId)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("client_forms")
          .update({
            form_fields: fields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase.from("client_forms").insert({
          booking_id: bookingId,
          form_fields: fields,
        })

        if (error) throw error
      }

      toast({ title: "Form saved successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save form",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Client Form</CardTitle>
        <CardDescription>
          Create a custom form for your client to fill out (up to 10 fields)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No form fields yet. Add your first field to get started.
            </p>
            <Button onClick={addField} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Field {index + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`label-${field.id}`}>Label *</Label>
                      <Input
                        id={`label-${field.id}`}
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        placeholder="e.g., Venue Address"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`placeholder-${field.id}`}>
                        Placeholder
                      </Label>
                      <Input
                        id={`placeholder-${field.id}`}
                        value={field.placeholder}
                        onChange={(e) =>
                          updateField(field.id, {
                            placeholder: e.target.value,
                          })
                        }
                        placeholder="e.g., Enter the venue address"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field.id, { required: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`required-${field.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Required field
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {fields.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addField}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              )}
              <Button
                type="button"
                onClick={saveForm}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Form"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

