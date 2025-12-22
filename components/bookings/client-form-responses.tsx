"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, XCircle } from "lucide-react"

interface FormField {
    id: string
    label: string
    placeholder: string
    required: boolean
}

interface ClientFormResponsesProps {
    bookingId: string
}

export function ClientFormResponses({ bookingId }: ClientFormResponsesProps) {
    const [formFields, setFormFields] = useState<FormField[]>([])
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [hasForm, setHasForm] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function loadFormData() {
            try {
                const { data, error } = await supabase
                    .from("client_forms")
                    .select("form_fields, form_data")
                    .eq("booking_id", bookingId)
                    .single()

                if (error && error.code !== "PGRST116") {
                    // PGRST116 is "not found" - that's okay
                    throw error
                }

                if (data) {
                    setHasForm(true)
                    setFormFields((data.form_fields as FormField[]) || [])
                    setFormData((data.form_data as Record<string, string>) || {})
                }
            } catch (error: any) {
                console.error("Error loading form data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadFormData()
    }, [bookingId, supabase])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Client Form Responses</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        )
    }

    if (!hasForm || formFields.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Client Form Responses</CardTitle>
                    <CardDescription>
                        No custom form has been created for this booking
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const hasResponses = Object.keys(formData).length > 0
    const answeredCount = Object.keys(formData).filter(key => formData[key]).length
    const totalFields = formFields.length

    return (
        <Card>
            <CardHeader>
                <CardTitle>Client Form Responses</CardTitle>
                <CardDescription>
                    {hasResponses
                        ? `${answeredCount} of ${totalFields} fields completed`
                        : "Client has not submitted the form yet"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasResponses ? (
                    <div className="space-y-4">
                        {formFields.map((field) => {
                            const response = formData[field.id]
                            const hasResponse = response && response.trim() !== ""

                            return (
                                <div key={field.id} className="border-b pb-3 last:border-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium flex items-center gap-1">
                                            {field.label}
                                            {field.required && <span className="text-destructive">*</span>}
                                        </p>
                                        {hasResponse ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className={`text-sm ${hasResponse ? "text-foreground" : "text-muted-foreground italic"}`}>
                                        {hasResponse ? response : "No response"}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                            The client will fill out this form in their portal before the event.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
