import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Download, FileText } from "lucide-react"
import type { Booking, Client, Photographer } from "@/types"
import { SignatureSeal } from "./signature-seal"
import { formatDateSafe } from "@/lib/utils"
import { marked } from "marked"
import { cn } from "@/lib/utils"

// Configure marked
marked.use({
  gfm: true,
  breaks: true,
})

interface ContractViewerProps {
  booking: Booking
  client: Client
  photographer?: Photographer | null
}

export function ContractViewer({ booking, client, photographer }: ContractViewerProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  if (!booking.contract_text) {
    return (
      <Card className="border border-stone-200 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No contract available for this booking.</p>
        </CardContent>
      </Card>
    )
  }

  // Replace placeholders in contract text
  const contractText = useMemo(() => {
    let text = booking.contract_text || ""

    // Helper for safe replacement
    const replace = (pattern: RegExp, value: string | null | undefined) => {
      text = text.replace(pattern, value || "_________________")
    }

    // Photographer Details
    const photographerName = photographer?.business_name ||
      (photographer?.first_name ? `${photographer.first_name} ${photographer.last_name}` : "Photographer")

    replace(/\{\{photographer_name\}\}/g, photographerName)
    replace(/\{\{photographer_email\}\}/g, photographer?.email)
    replace(/\{\{photographer_phone\}\}/g, photographer?.phone)
    replace(/\{\{photographer_address\}\}/g, "_________________")

    // Client Details
    replace(/\{\{client_name\}\}/g, client.name)
    replace(/\{\{client_email\}\}/g, client.email)
    replace(/\{\{client_phone\}\}/g, client.phone)
    replace(/\{\{client_address\}\}/g, "_________________")

    // Event/Booking Details
    replace(/\{\{event_date\}\}/g, formatDateSafe(booking.event_date, "MMMM d, yyyy"))
    replace(/\{\{agreement_date\}\}/g, formatDateSafe(booking.created_at, "MMMM d, yyyy"))
    replace(/\{\{total_price\}\}/g, `$${booking.total_price.toLocaleString()}`)
    replace(/\{\{service_type\}\}/g, booking.service_type)

    // Strip triple backticks if present
    if (text.trim().startsWith("```")) {
      text = text.trim().replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "")
    }
    return text
  }, [booking, client, photographer])

  const html = useMemo(() => {
    try {
      return marked.parse(contractText)
    } catch (e) {
      console.error("Error parsing markdown:", e)
      return contractText
    }
  }, [contractText])

  const handleDownloadPDF = () => {
    setIsPrinting(true)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setIsPrinting(false)
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contract - ${client.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            h1, h2, h3 {
              font-weight: 700;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            p { margin-bottom: 12px; }
            ul { margin-left: 20px; margin-bottom: 12px; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${html}
          ${booking.contract_signed_at ? `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #000;">
              <p><strong>Signed by:</strong> ${booking.client_signature_name || booking.contract_signed_by}</p>
              <p><strong>Signed on:</strong> ${formatDateSafe(booking.contract_signed_at, "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
      setIsPrinting(false)
    }, 250)
  }

  return (
    <Card className="border border-stone-200 shadow-xl bg-white">
      <CardHeader className="bg-gradient-to-r from-stone-50 to-white border-b border-stone-200">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-serif text-3xl text-stone-900">Contract Agreement</CardTitle>
            <p className="text-sm text-stone-600 mt-2">
              Please review the contract below. All details have been filled in for your convenience.
            </p>
          </div>
          <Button
            onClick={handleDownloadPDF}
            disabled={isPrinting}
            variant="outline"
            size="sm"
            className="shrink-0 border-stone-300 hover:bg-stone-50"
          >
            {isPrinting ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-stone-50/50">
        <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-sm border-x border-stone-100">
          <div className="p-8 md:p-12">
            <div className={cn(
              "prose prose-stone max-w-none",
              "prose-headings:text-stone-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4",
              "prose-p:text-stone-700 prose-p:leading-relaxed prose-p:mb-4",
              "prose-strong:text-stone-900 prose-strong:font-bold",
              "prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4",
              "prose-li:text-stone-700 prose-li:mb-1",
              "break-words overflow-wrap-anywhere"
            )}>
              <div dangerouslySetInnerHTML={{ __html: html as string }} />
            </div>

            <div className="mt-12 pt-8 border-t border-stone-100">
              <SignatureSeal booking={booking} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


