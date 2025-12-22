"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { CheckCircle2, Shield } from "lucide-react"
import type { Booking } from "@/types"

interface SignatureSealProps {
  booking: Booking
}

export function SignatureSeal({ booking }: SignatureSealProps) {
  if (!booking.contract_signed_at) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      className="mt-8 pt-8 border-t-2 border-green-200"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
        {/* Digital Seal Icon */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md"
            >
              <CheckCircle2 className="h-5 w-5 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Signature Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-green-900">Certified Signature</h3>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              VERIFIED
            </span>
          </div>
          <div className="space-y-1 text-sm text-green-800">
            <p>
              <span className="font-semibold">Signed by:</span>{" "}
              <span className="font-mono">{booking.client_signature_name || booking.contract_signed_by}</span>
            </p>
            <p>
              <span className="font-semibold">Signed on:</span>{" "}
              {format(new Date(booking.contract_signed_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
            {booking.signature_ip_address && booking.signature_ip_address !== "Unknown" && (
              <p className="text-xs text-green-700">
                <span className="font-semibold">IP Address:</span>{" "}
                <span className="font-mono">{booking.signature_ip_address}</span>
                {" "}• Secure & Encrypted
              </p>
            )}
          </div>
        </div>

        {/* Legal Badge */}
        <div className="flex-shrink-0 text-center">
          <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-green-200 shadow-sm">
            <p className="text-xs font-semibold text-green-900 mb-1">Legal Effect</p>
            <p className="text-xs text-green-700">Same as handwritten signature</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}



