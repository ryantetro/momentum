"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { File, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface BookingFile {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

interface BookingFilesProps {
  bookingId: string
  portalToken: string
}

export function BookingFiles({ bookingId, portalToken }: BookingFilesProps) {
  const [files, setFiles] = useState<BookingFile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadFiles() {
      try {
        // Fetch via API route that verifies portal token
        const response = await fetch(
          `/api/bookings/files?bookingId=${bookingId}&portalToken=${portalToken}`
        )
        const data = await response.json()

        if (data.files) {
          setFiles(data.files)
        }
      } catch (error: any) {
        console.error("Error loading files:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [bookingId, portalToken])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (files.length === 0) {
    return null // Don't show if no files
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
        <CardDescription>
          Files shared by your photographer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} •{" "}
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.file_url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

