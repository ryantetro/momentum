"use client"

import { useState, useEffect } from "react"
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
import type { ContractTemplate } from "@/types"

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Content is required"),
  is_default: z.boolean().default(false),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateFormProps {
  templateId?: string
  initialData?: ContractTemplate
}

export function TemplateForm({ templateId, initialData }: TemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      name: "",
      content: "",
      is_default: false,
    },
  })

  const isDefault = watch("is_default")

  const onSubmit = async (data: TemplateFormData) => {
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

      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("contract_templates")
          .update({ is_default: false })
          .eq("photographer_id", photographer.id)
      }

      if (templateId) {
        // Update
        const { error } = await supabase
          .from("contract_templates")
          .update({
            name: data.name,
            content: data.content,
            is_default: data.is_default,
          })
          .eq("id", templateId)
          .eq("photographer_id", photographer.id)

        if (error) throw error

        toast({ title: "Template updated successfully" })
      } else {
        // Create
        const { error } = await supabase.from("contract_templates").insert({
          photographer_id: photographer.id,
          name: data.name,
          content: data.content,
          is_default: data.is_default,
        })

        if (error) throw error

        toast({ title: "Template created successfully" })
      }

      router.push("/contracts")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{templateId ? "Edit Template" : "Create Template"}</CardTitle>
        <CardDescription>
          {templateId
            ? "Update your contract template"
            : "Create a new contract template with placeholders"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Standard Wedding Contract"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Contract Content *</Label>
            <textarea
              id="content"
              {...register("content")}
              rows={15}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter contract text here. Use {{client_name}}, {{event_date}}, {{total_price}} as placeholders."
              disabled={loading}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Available placeholders: {"{{client_name}}"}, {"{{event_date}}"}, {"{{total_price}}"}, {"{{service_type}}"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_default"
              checked={isDefault}
              onChange={(e) => setValue("is_default", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
              disabled={loading}
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default template
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : templateId ? "Update Template" : "Create Template"}
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


