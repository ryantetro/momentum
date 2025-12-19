"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import type { Booking, Client, Photographer } from "@/types"
import { ProgressIndicator } from "./progress-indicator"

interface PortalHeroProps {
  client: Client
  booking: Booking
  photographer: Photographer | null
  isSigned?: boolean
}

export function PortalHero({ client, booking, photographer, isSigned }: PortalHeroProps) {
  const photographerName =
    photographer?.business_name || photographer?.studio_name || photographer?.email || "Photographer"

  const capitalizedServiceType =
    booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)

  // Use hero_image_url if available, otherwise use a gradient
  const heroImageUrl = (photographer as any)?.hero_image_url || null

  return (
    <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden">
      {/* Background Image or Gradient */}
      {heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt="Studio Hero"
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700" />
      )}

      {/* Dark Overlay Gradient for Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

      {/* Photographer Logo Overlay (top left) */}
      {photographer?.logo_url && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-6 left-6 z-10"
        >
          <Image
            src={photographer.logo_url}
            alt={`${photographerName} Logo`}
            width={80}
            height={80}
            className="object-contain rounded-lg bg-white/10 backdrop-blur-sm p-2 shadow-lg"
          />
        </motion.div>
      )}

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute bottom-40 md:bottom-64 left-0 right-0 px-6 md:px-12 z-10"
      >
        <h1 className="text-3xl md:text-6xl font-serif font-bold text-white mb-3 drop-shadow-lg leading-tight">
          Welcome, {client.name}!
        </h1>
        <p className="text-lg md:text-2xl text-stone-100 font-light drop-shadow-md">
          Your proposal for your <strong className="font-semibold">{capitalizedServiceType}</strong> is ready for review.
        </p>
      </motion.div>

      {/* Glassmorphism Progress Indicator Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8 z-10"
      >
        <div className="backdrop-blur-md bg-white/90 rounded-2xl shadow-2xl border border-white/20 p-4 md:p-8">
          <ProgressIndicator booking={booking} isSigned={isSigned} />
        </div>
      </motion.div>
    </div>
  )
}

