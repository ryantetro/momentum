"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { CheckCircle2 } from "lucide-react"

interface SignatureFormProps {
  bookingId: string
  client?: {
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string | null
  } | null
  onSuccess: () => void
}

export function SignatureForm({ bookingId, client, onSuccess }: SignatureFormProps) {
  const [clientName, setClientName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  // Address state
  const [address, setAddress] = useState(client?.address || "")
  const [city, setCity] = useState(client?.city || "")
  const [state, setState] = useState(client?.state || "")
  const [zip, setZip] = useState(client?.zip || "")
  const [country, setCountry] = useState(client?.country || "")

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      toast({
        title: "Error",
        description: "You must agree to the terms",
        variant: "destructive",
      })
      return
    }

    if (!clientName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    // Validate address if it was missing initially
    if (!client?.address && (!address || !city || !state || !zip || !country)) {
      toast({
        title: "Missing Address",
        description: "Please complete your address details",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/bookings/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          clientName: clientName.trim(),
          addressDetails: !client?.address ? {
            address,
            city,
            state,
            zip,
            country
          } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign contract")
      }

      toast({
        title: "Contract signed successfully!",
        description: "Your signature has been recorded securely."
      })

      // Add a small delay to show success animation before calling onSuccess
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign contract",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border border-stone-200 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Sign Here</CardTitle>
        <p className="text-sm text-stone-600 mt-1">
          Type your full name below to electronically sign the contract
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Address Fields - Only show if missing */}
          {!client?.address && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-stone-200 mb-4">
              <h4 className="font-medium text-sm text-stone-700">Billing Address Required</h4>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="10001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientName">Your Full Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter your full name as it appears on the contract"
              disabled={loading}
              required
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="text"
              value={new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/50">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 mt-0.5"
              disabled={loading}
              required
            />
            <Label htmlFor="agree" className="cursor-pointer text-sm leading-relaxed">
              I have read and agree to the terms and conditions of this contract. By signing, I
              acknowledge that this electronic signature has the same legal effect as a handwritten
              signature. *
            </Label>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={loading || !agreed || !clientName.trim()}
            >
              {loading ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Sign Contract
                </>
              )}
            </Button>
          </motion.div>
          <div className="pt-4 border-t border-stone-200">
            <div className="flex items-center justify-center gap-2 text-xs text-stone-600 mb-3">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="font-medium">Secure & Encrypted</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span className="font-semibold text-blue-600">Stripe</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l-2.847 6.015c-.48-.207-1.129-.489-1.691-.756zm-2.95 5.847c-1.44-.75-2.633-1.407-2.633-2.404 0-.622.5-1.095 1.43-1.095 1.728 0 3.457.858 4.726 1.631l-2.847 6.015c-.48-.207-1.129-.489-1.691-.756zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                <span className="text-xs text-stone-600 font-medium">Visa</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 1.5c5.799 0 10.5 4.701 10.5 10.5S17.799 22.5 12 22.5 1.5 17.799 1.5 12 6.201 1.5 12 1.5zm5.5 6h-11v9h11v-9zm-1.5 1.5v6h-8v-6h8z" />
                </svg>
                <span className="text-xs text-stone-600 font-medium">Mastercard</span>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



