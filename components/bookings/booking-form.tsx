"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import type { PaymentMilestone, ContractTemplate, Client } from "@/types"

const bookingSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  service_type: z.string().min(1, "Service type is required"),
  event_date: z.string().min(1, "Event date is required"),
  event_location: z.string().optional(),
  total_price: z.string().min(1, "Total price is required"),
  deposit_amount: z.string().min(1, "Deposit amount is required"),
  payment_due_date: z.string().optional(),
  contract_template_id: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  clientId?: string
}

export function BookingForm({ clientId }: BookingFormProps) {
  const [loading, setLoading] = useState(false)
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      client_id: clientId || "",
      service_type: "wedding",
      total_price: "",
      deposit_amount: "",
    },
  })

  const totalPrice = parseFloat(watch("total_price") || "0")
  const depositAmount = parseFloat(watch("deposit_amount") || "0")

  useEffect(() => {
    async function fetchData() {
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

        // Fetch templates
        const { data: templatesData, error: templatesError } = await supabase
          .from("contract_templates")
          .select("*")
          .eq("photographer_id", photographer.id)
          .order("is_default", { ascending: false })

        if (templatesError) throw templatesError
        setTemplates(templatesData || [])

        // Fetch clients if clientId not provided
        if (!clientId) {
          const { data: clientsData, error: clientsError } = await supabase
            .from("clients")
            .select("id, name, email")
            .eq("photographer_id", photographer.id)
            .order("name")

          if (clientsError) throw clientsError
          setClients(clientsData || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [supabase, clientId])

  const onSubmit = async (data: BookingFormData) => {
    // Validate deposit amount
    const totalPriceNum = parseFloat(data.total_price)
    const depositAmountNum = parseFloat(data.deposit_amount)

    if (depositAmountNum > totalPriceNum) {
      toast({
        title: "Error",
        description: "Deposit amount cannot exceed total price",
        variant: "destructive",
      })
      return
    }

    // Validate milestones
    const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0)
    if (Math.abs(totalMilestones - totalPriceNum) > 0.01) {
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
        .eq("id", data.client_id)
        .single()

      // Get contract text if template is selected, otherwise use default from photographers table
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
      } else {
        // Fallback to default contract_template from photographers table
        // This is the master template set in Settings > Contract Defaults
        const { data: photographerData } = await supabase
          .from("photographers")
          .select("contract_template")
          .eq("id", photographer.id)
          .single()

        if (photographerData?.contract_template) {
          contractText = photographerData.contract_template
        }
      }

      // Generate portal token (UUID)
      const portalToken = crypto.randomUUID()

      // Convert payment_due_date to ISO string if provided
      const paymentDueDate = data.payment_due_date
        ? new Date(data.payment_due_date).toISOString()
        : null

      const { error } = await supabase.from("bookings").insert({
        photographer_id: photographer.id,
        client_id: data.client_id,
        client_email: client?.email || null,
        service_type: data.service_type,
        event_date: data.event_date,
        event_location: data.event_location || null,
        total_price: totalPriceNum,
        deposit_amount: depositAmountNum,
        payment_due_date: paymentDueDate,
        contract_template_id: data.contract_template_id || null,
        contract_text: contractText,
        payment_milestones: milestones,
        status: "draft",
        payment_status: "PENDING_DEPOSIT",
        portal_token: portalToken,
      })

      if (error) throw error

      toast({
        title: "Booking created successfully",
        description: "Your booking is ready to manage"
      })

      if (clientId) {
        router.push(`/clients/${data.client_id}`)
      } else {
        router.push("/bookings")
      }
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
          {/* Client Selection - only show if clientId not provided */}
          {!clientId && (
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select id="client_id" {...register("client_id")} disabled={loading}>
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email && `(${client.email})`}
                  </option>
                ))}
              </Select>
              {errors.client_id && (
                <p className="text-sm text-destructive">{errors.client_id.message}</p>
              )}
              {clients.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No clients found. <Link href="/clients" className="text-blue-600 hover:underline">Create a client first</Link>
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Input
                id="service_type"
                type="text"
                placeholder="e.g., Wedding, Sports, Corporate, Portrait..."
                {...register("service_type")}
                disabled={loading}
              />
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

          <div className="space-y-2">
            <Label htmlFor="event_location">Event Location/Venue (Optional)</Label>
            <Input
              id="event_location"
              type="text"
              placeholder="e.g., Central Park, 123 Main St, New York, NY"
              {...register("event_location")}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Venue name or address where the event will take place
            </p>
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
              <Label htmlFor="deposit_amount">Deposit Amount *</Label>
              <Input
                id="deposit_amount"
                type="number"
                step="0.01"
                min="0"
                {...register("deposit_amount")}
                placeholder="0.00"
                disabled={loading}
                onChange={(e) => {
                  register("deposit_amount").onChange(e)
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && totalPrice > 0 && value > totalPrice) {
                    toast({
                      title: "Invalid amount",
                      description: "Deposit cannot exceed total price",
                      variant: "destructive",
                    })
                  }
                }}
              />
              {errors.deposit_amount && (
                <p className="text-sm text-destructive">{errors.deposit_amount.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Required deposit amount for this booking
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

