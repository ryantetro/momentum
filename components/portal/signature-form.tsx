"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"

interface SignatureFormProps {
  bookingId: string
  onSuccess: () => void
}

export function SignatureForm({ bookingId, onSuccess }: SignatureFormProps) {
  const [clientName, setClientName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

    try {
      const response = await fetch("/api/bookings/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          clientName: clientName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign contract")
      }

      toast({ title: "Contract signed successfully" })
      onSuccess()
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
    <Card>
      <CardHeader>
        <CardTitle>Sign Contract</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Your Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="text"
              value={new Date().toLocaleDateString()}
              disabled
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
              disabled={loading}
              required
            />
            <Label htmlFor="agree" className="cursor-pointer">
              I agree to the terms and conditions of this contract *
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !agreed || !clientName.trim()}>
            {loading ? "Signing..." : "Sign Contract"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


