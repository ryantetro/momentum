"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Edit, Trash2 } from "lucide-react"
import type { ContractTemplate } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toaster"

interface TemplateListProps {
  templates: ContractTemplate[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No templates yet. Create your first contract template.
        </p>
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

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

      const { error } = await supabase
        .from("contract_templates")
        .delete()
        .eq("id", id)
        .eq("photographer_id", photographer.id)

      if (error) throw error

      toast({ title: "Template deleted successfully" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {template.is_default && (
                <Badge variant="default">Default</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {template.content.substring(0, 150)}...
            </p>
            <div className="flex gap-2">
              <Link href={`/contracts/${template.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

