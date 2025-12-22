"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PhotographerAvatarProps {
  logoUrl?: string | null
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PhotographerAvatar({ 
  logoUrl, 
  name, 
  size = "lg",
  className 
}: PhotographerAvatarProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(name)
  
  const sizeClasses = {
    sm: "h-12 w-12 text-sm",
    md: "h-16 w-16 text-base",
    lg: "h-24 w-24 text-2xl",
  }

  if (logoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        className={cn("relative rounded-2xl shadow-lg overflow-hidden", className)}
      >
        <Image
          src={logoUrl}
          alt={name}
          width={size === "lg" ? 96 : size === "md" ? 64 : 48}
          height={size === "lg" ? 96 : size === "md" ? 64 : 48}
          className="object-cover w-full h-full"
        />
      </motion.div>
    )
  }

  // Fallback to initials circle
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </motion.div>
  )
}



