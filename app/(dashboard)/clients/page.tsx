"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ClientsTable } from "@/components/clients/clients-table"
import { ClientsSearch } from "@/components/clients/clients-search"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { Client } from "@/types"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchClients() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        // Get photographer ID
        const { data: photographer } = await supabase
          .from("photographers")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (!photographer) {
          return
        }

        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("photographer_id", photographer.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setClients(data || [])
        setFilteredClients(data || [])
      } catch (error) {
        console.error("Error fetching clients:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [supabase])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredClients(clients)
      return
    }

    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.includes(searchQuery))
    )
    setFilteredClients(filtered)
  }, [searchQuery, clients])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-48 animate-pulse rounded bg-muted"></div>
            <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="h-10 w-32 animate-pulse rounded bg-muted"></div>
        </div>
        <div className="h-96 animate-pulse rounded-lg border bg-muted"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client database
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <ClientsSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>
      <ClientsTable clients={filteredClients} />
    </div>
  )
}

