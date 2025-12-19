"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Download, FileText } from "lucide-react"
import type { Booking, Client } from "@/types"
import { markdownToHtml, isMarkdown } from "@/lib/markdown"
import { SignatureSeal } from "./signature-seal"

interface ContractViewerProps {
  booking: Booking
  client: Client
}

export function ContractViewer({ booking, client }: ContractViewerProps) {
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
  let contractText = booking.contract_text
    .replace(/\{\{client_name\}\}/g, client.name)
    .replace(/\{\{event_date\}\}/g, format(new Date(booking.event_date), "MMMM d, yyyy"))
    .replace(/\{\{total_price\}\}/g, `$${booking.total_price.toLocaleString()}`)
    .replace(/\{\{service_type\}\}/g, booking.service_type)

  // Check if contract text is Markdown
  if (isMarkdown(contractText)) {
    // Convert Markdown to HTML
    contractText = markdownToHtml(contractText)
  } else {
    // Check if contract text contains HTML tags
    const hasHTML = /<[a-z][\s\S]*>/i.test(contractText)

    // If no HTML, convert line breaks to <br> tags
    if (!hasHTML) {
      contractText = contractText.split('\n').map((line, i) => 
        line.trim() ? `<p class="mb-3">${line}</p>` : '<br/>'
      ).join('')
    }
  }

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
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Playfair Display', serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.8;
              color: #1a1a1a;
            }
            h1, h2, h3 {
              font-weight: 600;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            p {
              margin-bottom: 12px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${contractText}
          ${booking.contract_signed_at ? `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #000;">
              <p><strong>Signed by:</strong> ${booking.client_signature_name || booking.contract_signed_by}</p>
              <p><strong>Signed on:</strong> ${format(new Date(booking.contract_signed_at), "MMMM d, yyyy 'at' h:mm a")}</p>
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
      <CardContent className="p-8 md:p-12">
        <div className="page-view-container max-w-4xl mx-auto">
          <div className="page-view bg-white shadow-2xl rounded-sm border border-stone-200">
            <div className="page-content max-h-[700px] overflow-y-auto">
              <div 
                className="prose prose-lg max-w-none font-serif text-stone-900 contract-content"
                style={{
                  fontFamily: '"Playfair Display", "Lora", "Georgia", serif',
                }}
                dangerouslySetInnerHTML={{ __html: contractText }}
              />
            </div>
          </div>
        </div>
        <style jsx global>{`
          .page-view-container {
            width: 100%;
            max-width: 8.5in;
            margin: 0 auto;
          }
          
          .page-view {
            width: 100%;
            min-height: 11in;
            aspect-ratio: 8.5 / 11;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            background: linear-gradient(to bottom, #fafafa 0%, #ffffff 2%, #ffffff 98%, #fafafa 100%);
          }
          
          .page-content {
            flex: 1;
            padding: 1in;
            background: white;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
          }
          
          .contract-content h1,
          .contract-content h2,
          .contract-content h3 {
            font-weight: 600;
            margin-top: 1em;
            margin-bottom: 0.5em;
            color: #1a1a1a;
          }
          
          .contract-content h2 {
            font-size: 1.25em;
          }
          
          .contract-content p {
            margin-bottom: 0.75em;
            line-height: 1.6;
          }
          
          .contract-content ul,
          .contract-content ol {
            margin-left: 1.5em;
            margin-bottom: 0.75em;
          }
          
          .contract-content strong {
            font-weight: 600;
          }
          
          @media (max-width: 768px) {
            .page-content {
              padding: 0.5in;
            }
          }
        `}</style>
        <SignatureSeal booking={booking} />
      </CardContent>
    </Card>
  )
}


