"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Sparkles, Copy, Check, Mail, ExternalLink } from "lucide-react"
import { MilestonesBuilder } from "./milestones-builder"
import type { Booking, ContractTemplate, PaymentMilestone, ServicePackage } from "@/types"
import { useRouter } from "next/navigation"
import { generateStandardMilestones, calculateDepositAmount } from "@/lib/bookings/milestone-helpers"

interface InquiryConversionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking
  onConversionSuccess?: () => void
}

type ModalState = "form" | "success"

export function InquiryConversionModal({
  open,
  onOpenChange,
  booking,
  onConversionSuccess,
}: InquiryConversionModalProps) {
  const [modalState, setModalState] = useState<ModalState>("form")
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [totalPrice, setTotalPrice] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [contractTemplateId, setContractTemplateId] = useState("")
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([])
  const [useStandardMilestones, setUseStandardMilestones] = useState(true)
  const [portalUrl, setPortalUrl] = useState<string>("")
  const [generatedContract, setGeneratedContract] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setModalState("form")
      setTotalPrice("")
      setDepositAmount("")
      setSelectedPackageId("")
      setMilestones([])
      setUseStandardMilestones(true)
      setPortalUrl("")
      setGeneratedContract("")
      fetchTemplates()
      fetchPackages()
    }
  }, [open])

  // Auto-select default package when packages are loaded
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageId) {
      const defaultPackage = packages.find(
        (pkg) => pkg.is_default && pkg.service_type === booking.service_type
      )
      if (defaultPackage) {
        handlePackageSelect(defaultPackage.id)
      }
    }
  }, [packages, booking.service_type])

  // Auto-generate milestones when package is selected and standard milestones is enabled
  useEffect(() => {
    if (
      useStandardMilestones &&
      totalPrice &&
      depositAmount &&
      booking.event_date &&
      parseFloat(totalPrice) > 0 &&
      parseFloat(depositAmount) > 0
    ) {
      const generated = generateStandardMilestones(
        parseFloat(totalPrice),
        parseFloat(depositAmount),
        booking.event_date
      )
      setMilestones(generated)
    }
  }, [useStandardMilestones, totalPrice, depositAmount, booking.event_date])

  async function fetchTemplates() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) return

      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("photographer_id", photographer.id)
        .order("is_default", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  async function fetchPackages() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) return

      const { data, error } = await supabase
        .from("service_packages")
        .select("*")
        .eq("photographer_id", photographer.id)
        .eq("service_type", booking.service_type)
        .order("is_default", { ascending: false })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error("Error fetching packages:", error)
    }
  }

  function handlePackageSelect(packageId: string) {
    setSelectedPackageId(packageId)
    const selectedPackage = packages.find((pkg) => pkg.id === packageId)
    if (selectedPackage) {
      setTotalPrice(selectedPackage.total_price.toString())
      
      // Calculate deposit amount
      let deposit = 0
      if (selectedPackage.deposit_amount) {
        deposit = selectedPackage.deposit_amount
      } else if (selectedPackage.deposit_percentage) {
        deposit = calculateDepositAmount(
          selectedPackage.total_price,
          selectedPackage.deposit_percentage
        )
      }
      setDepositAmount(deposit.toString())
    }
  }

  async function handleConvert() {
    // Prevent conversion if booking status is no longer "Inquiry"
    if (booking.status !== "Inquiry") {
      toast({
        title: "Error",
        description: "This inquiry has already been converted or the status has changed.",
        variant: "destructive",
      })
      onOpenChange(false)
      return
    }

    if (!totalPrice || !depositAmount) {
      toast({
        title: "Error",
        description: "Total price and deposit amount are required",
        variant: "destructive",
      })
      return
    }

    const totalPriceNum = parseFloat(totalPrice)
    const depositAmountNum = parseFloat(depositAmount)

    if (depositAmountNum > totalPriceNum) {
      toast({
        title: "Error",
        description: "Deposit amount cannot exceed total price",
        variant: "destructive",
      })
      return
    }

    // Validate milestones
    const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0)
    if (Math.abs(totalMilestones - totalPriceNum) > 0.01) {
      toast({
        title: "Error",
        description: "Milestone amounts must equal the total price",
        variant: "destructive",
      })
      return
    }

    if (milestones.length === 0) {
      toast({
        title: "Error",
        description: "At least one payment milestone is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Get base contract template
      let baseContractText = null
      if (contractTemplateId) {
        const { data: template } = await supabase
          .from("contract_templates")
          .select("content")
          .eq("id", contractTemplateId)
          .single()

        if (template) {
          baseContractText = template.content
        }
      } else {
        // Fallback to default contract_template from photographers table
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const { data: photographerData } = await supabase
            .from("photographers")
            .select("contract_template")
            .eq("user_id", session.user.id)
            .single()

          if (photographerData?.contract_template) {
            baseContractText = photographerData.contract_template
          }
        }
      }

      if (!baseContractText) {
        toast({
          title: "Error",
          description: "No contract template found. Please set up a default contract in Settings.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Generate contract with AI
      const clientName = booking.client?.name || "Client"
      const eventDate = new Date(booking.event_date).toLocaleDateString()
      const serviceType = booking.service_type
      const inquiryMessage = booking.inquiry_message || ""

      // Call AI to enhance contract with inquiry details (optional - falls back to base template if fails)
      let finalContractText = baseContractText
      
      if (inquiryMessage) {
        try {
          const aiResponse = await fetch("/api/ai/generate-contract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requirements: `Base contract template: ${baseContractText.substring(0, 500)}... Client inquiry message: "${inquiryMessage}". Enhance this contract with the client's specific needs mentioned in their inquiry.`,
            }),
          })

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            if (aiData.contract) {
              finalContractText = aiData.contract
            }
          }
        } catch (error) {
          // Silently fall back to base template if AI generation fails
          console.warn("AI contract generation failed, using base template:", error)
        }
      }

      // Replace all placeholders
      finalContractText = finalContractText
        .replace(/\{\{client_name\}\}/g, clientName)
        .replace(/\{\{event_date\}\}/g, eventDate)
        .replace(/\{\{total_price\}\}/g, `$${totalPriceNum.toLocaleString()}`)
        .replace(/\{\{service_type\}\}/g, serviceType)

      // Generate portal URL
      const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const portalUrlValue = `${baseUrl}/portal/${booking.portal_token}`

      // Update booking status to PROPOSAL_SENT
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "PROPOSAL_SENT",
          total_price: totalPriceNum,
          deposit_amount: depositAmountNum,
          contract_template_id: contractTemplateId || null,
          contract_text: finalContractText,
          payment_milestones: milestones,
          payment_status: "PENDING_DEPOSIT",
        })
        .eq("id", booking.id)

      if (error) throw error

      setGeneratedContract(finalContractText)
      setPortalUrl(portalUrlValue)
      setModalState("success")
      
      // Call success callback to refresh parent page
      if (onConversionSuccess) {
        onConversionSuccess()
      }
      
      toast({
        title: "Proposal generated!",
        description: "Your proposal has been created and is ready to send.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate proposal",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  async function handleSendEmail() {
    try {
      const response = await fetch("/api/bookings/send-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      toast({
        title: "Email sent!",
        description: "The proposal has been sent to your client.",
      })

      // Call success callback to refresh parent page
      if (onConversionSuccess) {
        onConversionSuccess()
      }

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      })
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast({
      title: "Link copied!",
      description: "Portal link copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePreviewPortal() {
    window.open(portalUrl, "_blank")
  }

  // Success State UI
  if (modalState === "success") {
    const contractPreview = generatedContract.split("\n").slice(0, 3).join("\n")
    const autoFilledFields = [
      "Client Name",
      "Event Date",
      "Total Price",
      "Service Type",
      "Payment Terms",
    ]

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Proposal Ready!
            </DialogTitle>
            <DialogDescription>
              Your proposal has been generated and is ready to send to your client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview Card */}
            <div className="rounded-lg border p-6 bg-muted/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Proposal Preview</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Client:</span>{" "}
                      <span className="font-medium">{booking.client?.name}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Event Date:</span>{" "}
                      <span className="font-medium">
                        {new Date(booking.event_date).toLocaleDateString()}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Service Type:</span>{" "}
                      <span className="font-medium capitalize">{booking.service_type}</span>
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                  AI has auto-filled {autoFilledFields.length} fields
                </div>
              </div>

              <div className="mt-4 p-4 bg-background rounded border max-h-40 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {contractPreview}
                  {"\n..."}
                </pre>
              </div>
            </div>

            {/* Portal Link */}
            <div className="space-y-2">
              <Label>Client Portal Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={portalUrl}
                  readOnly
                  className="font-mono text-xs"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreviewPortal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleSendEmail} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Mail className="mr-2 h-4 w-4" />
              Send Proposal via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Form State UI
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Inquiry to Booking</DialogTitle>
          <DialogDescription>
            Set the pricing and contract details to convert this inquiry into a full booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pre-filled Info Display */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Client Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {booking.client?.name}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span> {booking.client?.email}
              </div>
              <div>
                <span className="text-muted-foreground">Event Date:</span>{" "}
                {new Date(booking.event_date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Service Type:</span>{" "}
                {booking.service_type}
              </div>
            </div>
            {booking.inquiry_message && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-muted-foreground text-sm">Message:</span>
                <p className="text-sm mt-1 italic">"{booking.inquiry_message}"</p>
              </div>
            )}
          </div>

          {/* Service Package Dropdown */}
          {packages.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="servicePackage">Service Package</Label>
              <Select
                id="servicePackage"
                value={selectedPackageId}
                onChange={(e) => handlePackageSelect(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a package (optional)</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} {pkg.is_default && "(Default)"} - ${pkg.total_price.toLocaleString()}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a package will auto-fill pricing and generate payment milestones
              </p>
            </div>
          )}

          {/* Pricing Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Total Price *</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                min="0"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount *</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>

          {/* Standard Milestones Toggle */}
          {totalPrice && parseFloat(totalPrice) > 0 && (
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/50">
              <div className="flex-1 space-y-1">
                <Label htmlFor="standard-milestones" className="text-base font-semibold">
                  Standard Milestones
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create Deposit and Final Payment milestones (due 30 days before
                  event)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="standard-milestones"
                  checked={useStandardMilestones}
                  onChange={(e) => setUseStandardMilestones(e.target.checked)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          )}

          {/* Contract Template (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="contractTemplate">Contract Template (Optional)</Label>
            <Select
              id="contractTemplate"
              value={contractTemplateId}
              onChange={(e) => setContractTemplateId(e.target.value)}
              disabled={loading}
            >
              <option value="">Use default template from Settings</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.is_default && "(Default)"}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              AI will enhance the template with details from the client's inquiry message
            </p>
          </div>

          {/* Payment Milestones */}
          {totalPrice && parseFloat(totalPrice) > 0 && !useStandardMilestones && (
            <MilestonesBuilder
              totalPrice={parseFloat(totalPrice)}
              milestones={milestones}
              onChange={setMilestones}
            />
          )}

          {/* Milestone Summary (when using standard milestones) */}
          {useStandardMilestones && milestones.length > 0 && (
            <div className="rounded-lg border bg-muted p-4">
              <h4 className="font-semibold mb-3">Payment Schedule</h4>
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex justify-between text-sm">
                    <span>
                      {milestone.name} {milestone.due_date && `(Due ${new Date(milestone.due_date).toLocaleDateString()})`}
                    </span>
                    <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${milestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Proposal...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate & Send Proposal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
