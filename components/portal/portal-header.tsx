"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Photographer } from "@/types"

interface PortalHeaderProps {
  photographerId: string
}

export function PortalHeader({ photographerId }: PortalHeaderProps) {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPhotographer() {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .eq("id", photographerId)
        .single()

      if (data) {
        setPhotographer(data)
      }
    }

    fetchPhotographer()
  }, [photographerId, supabase])

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Momentum Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold">
              {photographer?.business_name || "Momentum"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Client Portal
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

