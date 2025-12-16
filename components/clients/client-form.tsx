"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  clientId?: string
  initialData?: {
    name: string
    email: string
    phone?: string
  }
}

export function ClientForm({ clientId, initialData }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/sign-in")
        return
      }

      // Get photographer ID
      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) {
        throw new Error("Photographer not found")
      }

      if (clientId) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
          })
          .eq("id", clientId)
          .eq("photographer_id", photographer.id)

        if (error) throw error

        toast({ title: "Client updated successfully" })
      } else {
        // Create new client
        const { error } = await supabase.from("clients").insert({
          photographer_id: photographer.id,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
        })

        if (error) throw error

        toast({ title: "Client created successfully" })
      }

      router.push("/clients")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save client",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{clientId ? "Edit Client" : "Add New Client"}</CardTitle>
        <CardDescription>
          {clientId
            ? "Update client information"
            : "Add a new client to your database"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="John Doe"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="+1 234 567 8900"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : clientId ? "Update Client" : "Create Client"}
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


