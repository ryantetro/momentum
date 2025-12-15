"use client"

import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { Photographer } from "@/types"

export function Header() {
  const { user } = useAuth()
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      supabase
        .from("photographers")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setPhotographer(data)
        })
    }
  }, [user, supabase])

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="Momentum Logo"
          width={32}
          height={32}
          className="object-contain"
        />
        <h2 className="text-lg font-semibold">
          {photographer?.business_name || "Welcome"}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
      </div>
    </header>
  )
}

