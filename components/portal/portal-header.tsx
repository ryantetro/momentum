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

  const photographerName =
    photographer?.business_name || photographer?.studio_name || photographer?.email || "Photographer"

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {photographer?.logo_url ? (
              <Image
                src={photographer.logo_url}
                alt={`${photographerName} Logo`}
                width={56}
                height={56}
                className="object-contain rounded-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm">
                {photographerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900">{photographerName}</h1>
              <p className="text-sm text-stone-600">Client Portal</p>
            </div>
          </div>
          <div className="text-xs text-stone-500">
            Powered by <span className="font-semibold text-stone-700">Momentum</span>
          </div>
        </div>
      </div>
    </header>
  )
}

