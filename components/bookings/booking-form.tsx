"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MilestonesBuilder } from "./milestones-builder"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import type { PaymentMilestone, ContractTemplate } from "@/types"

const bookingSchema = z.object({
  service_type: z.enum(["wedding", "portrait"]),
  event_date: z.string().min(1, "Event date is required"),
  total_price: z.string().min(1, "Total price is required"),
  deposit_amount: z.string().optional(),
  payment_due_date: z.string().optional(),
  contract_template_id: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  clientId: string
}

export function BookingForm({ clientId }: BookingFormProps) {
  const [loading, setLoading] = useState(false)
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service_type: "wedding",
      total_price: "",
    },
  })

  const totalPrice = parseFloat(watch("total_price") || "0")

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        const { data: photographer } = await supabase
          .from("photographers")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (!photographer) return

        const { data, error } = await supabase
          .from("contract_templates")
          .select("*")
          .eq("photographer_id", photographer.id)
          .order("is_default", { ascending: false })

        if (error) throw error

        setTemplates(data || [])
      } catch (error) {
        console.error("Error fetching templates:", error)
      }
    }

    fetchTemplates()
  }, [supabase])

  const onSubmit = async (data: BookingFormData) => {
    // Validate milestones
    const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0)
    if (Math.abs(totalMilestones - totalPrice) > 0.01) {
      toast({
        title: "Error",
        description: "Milestone amounts must equal the booking total",
        variant: "destructive",
      })
      return
    }

    if (milestones.length === 0) {
      toast({
        title: "Error",
        description: "At least one payment milestone is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/sign-in")
        return
      }

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) {
        throw new Error("Photographer not found")
      }

      // Get client email for payment reminders
      const { data: client } = await supabase
        .from("clients")
        .select("email")
        .eq("id", clientId)
        .single()

      // Get contract text if template is selected
      let contractText = null
      if (data.contract_template_id) {
        const { data: template } = await supabase
          .from("contract_templates")
          .select("content")
          .eq("id", data.contract_template_id)
          .single()

        if (template) {
          contractText = template.content
        }
      }

      const totalPriceNum = parseFloat(data.total_price)
      const depositAmount = data.deposit_amount 
        ? parseFloat(data.deposit_amount)
        : totalPriceNum * 0.2 // Default to 20% if not specified

      // Convert payment_due_date to ISO string if provided
      const paymentDueDate = data.payment_due_date
        ? new Date(data.payment_due_date).toISOString()
        : null

      const { error } = await supabase.from("bookings").insert({
        photographer_id: photographer.id,
        client_id: clientId,
        client_email: client?.email || null,
        service_type: data.service_type,
        event_date: data.event_date,
        total_price: totalPriceNum,
        deposit_amount: depositAmount,
        payment_due_date: paymentDueDate,
        contract_template_id: data.contract_template_id || null,
        contract_text: contractText,
        payment_milestones: milestones,
        status: "draft",
        payment_status: "PENDING_DEPOSIT",
      })

      if (error) throw error

      toast({ title: "Booking created successfully" })
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Booking</CardTitle>
        <CardDescription>
          Add a new booking for this client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select id="service_type" {...register("service_type")} disabled={loading}>
                <option value="wedding">Wedding</option>
                <option value="portrait">Portrait</option>
              </Select>
              {errors.service_type && (
                <p className="text-sm text-destructive">{errors.service_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                {...register("event_date")}
                disabled={loading}
              />
              {errors.event_date && (
                <p className="text-sm text-destructive">{errors.event_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_price">Total Price *</Label>
              <Input
                id="total_price"
                type="number"
                step="0.01"
                min="0"
                {...register("total_price")}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.total_price && (
                <p className="text-sm text-destructive">{errors.total_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Deposit Amount (Optional)</Label>
              <Input
                id="deposit_amount"
                type="number"
                step="0.01"
                min="0"
                {...register("deposit_amount")}
                placeholder="Auto-calculated if empty"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default (20% of total)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_due_date">Payment Due Date (Optional)</Label>
            <Input
              id="payment_due_date"
              type="date"
              {...register("payment_due_date")}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Set a due date to enable automated payment reminders (sent 3 days before)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_template_id">Contract Template</Label>
            <Select
              id="contract_template_id"
              {...register("contract_template_id")}
              disabled={loading}
            >
              <option value="">None</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.is_default && "(Default)"}
                </option>
              ))}
            </Select>
          </div>

          <MilestonesBuilder
            totalPrice={totalPrice}
            milestones={milestones}
            onChange={setMilestones}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || totalPrice <= 0}>
              {loading ? "Creating..." : "Create Booking"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

