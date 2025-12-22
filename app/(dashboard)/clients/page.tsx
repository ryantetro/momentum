"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ClientsTable } from "@/components/clients/clients-table"
import { ClientsSearch } from "@/components/clients/clients-search"
import { ClientsEmptyState } from "@/components/clients/clients-empty-state"
import { ClientDetailSlideover } from "@/components/clients/client-detail-slideover"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { Client, Booking } from "@/types"

interface ClientWithBookings extends Client {
  bookings?: Booking[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithBookings[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithBookings[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<ClientWithBookings | null>(null)
  const [inquiryUrl, setInquiryUrl] = useState<string>("")
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

        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .eq("photographer_id", photographer.id)
          .order("created_at", { ascending: false })

        if (clientsError) throw clientsError

        // Fetch all bookings for these clients
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("photographer_id", photographer.id)

        if (bookingsError) throw bookingsError

        // Group bookings by client_id
        const bookingsByClient = new Map<string, Booking[]>()
        bookingsData?.forEach((booking: Booking) => {
          if (!bookingsByClient.has(booking.client_id)) {
            bookingsByClient.set(booking.client_id, [])
          }
          bookingsByClient.get(booking.client_id)?.push(booking)
        })

        // Attach bookings to clients
        const clientsWithBookings: ClientWithBookings[] = (clientsData || []).map((client: Client) => ({
          ...client,
          bookings: bookingsByClient.get(client.id) || [],
        }))

        setClients(clientsWithBookings)
        setFilteredClients(clientsWithBookings)

        // Fetch photographer username for inquiry URL
        const { data: photographerData } = await supabase
          .from("photographers")
          .select("username")
          .eq("id", photographer.id)
          .single()

        if (photographerData?.username) {
          const baseUrl = typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          setInquiryUrl(`${baseUrl}/inquiry/${photographerData.username}`)
        }
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

  const refreshClient = async () => {
    if (!selectedClient) return

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", selectedClient.id)
        .single()

      if (error) throw error

      if (data) {
        // Update the client in the clients list
        setClients(prevClients =>
          prevClients.map(c => c.id === data.id ? { ...c, ...data } : c)
        )
        setFilteredClients(prevClients =>
          prevClients.map(c => c.id === data.id ? { ...c, ...data } : c)
        )
        // Update the selected client
        setSelectedClient(prev => prev ? { ...prev, ...data } : null)
      }
    } catch (error) {
      console.error("Error refreshing client:", error)
    }
  }

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
      {filteredClients.length === 0 ? (
        <ClientsEmptyState inquiryUrl={inquiryUrl} />
      ) : (
        <ClientsTable
          clients={filteredClients}
          onClientClick={setSelectedClient}
        />
      )}
      {selectedClient && (
        <ClientDetailSlideover
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => !open && setSelectedClient(null)}
          onClientUpdate={refreshClient}
        />
      )}
    </div>
  )
}

