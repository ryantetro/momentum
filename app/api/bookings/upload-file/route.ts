import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bookingId = formData.get("bookingId") as string
    const portalToken = formData.get("portalToken") as string | null

    if (!file || !bookingId) {
      return NextResponse.json(
        { error: "Missing file or bookingId" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Check Authorization: Either authenticated Photographer OR Client with Portal Token
    const supabase = await createClient()
    const adminClient = createAdminClient()

    let uploaderId: string | undefined = undefined
    let isPhotographer = false

    if (portalToken) {
      // 1. Client Upload (via Portal Token)
      // Verify token matches booking ID AND fetch photographer_id directly
      const { data: bookingCheck, error: tokenError } = await adminClient
        .from("bookings")
        .select("id, photographer_id")
        .eq("id", bookingId)
        .eq("portal_token", portalToken)
        .single()

      if (tokenError || !bookingCheck) {
        return NextResponse.json({ error: "Invalid portal token" }, { status: 403 })
      }

      // The table expects a valid photographer ID in uploaded_by.
      // For client uploads, we attribute it to the booking's photographer.
      if (bookingCheck.photographer_id) {
        uploaderId = bookingCheck.photographer_id
      } else {
        console.warn("No photographer_id found for booking", bookingId)
        // If this happens, we might still fail FK constraint, but this is the best we can do
        // unless we make the column nullable in schema (which we are avoiding here).
      }

    } else {
      // 2. Photographer Upload (via Session)
      let user = null

      // Check for Authorization header first (more reliable)
      const authHeader = request.headers.get('Authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data, error } = await supabase.auth.getUser(token)
        if (!error && data.user) {
          user = data.user
        }
      }

      // Fallback to cookie-based getUser if header didn't work
      if (!user) {
        try {
          const { data, error } = await supabase.auth.getUser()
          if (!error && data.user) {
            user = data.user
          } else if (error) {
            console.error("[Upload] Cookie auth error:", error)
          }
        } catch (e) {
          console.error("[Upload] Session check failed:", e)
        }
      }

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!photographer) {
        return NextResponse.json(
          { error: "Photographer not found" },
          { status: 404 }
        )
      }

      uploaderId = photographer.id
      isPhotographer = true

      // Verify photographer owns booking
      const { data: bookingCheck, error: bookingError } = await supabase
        .from("bookings")
        .select("id")
        .eq("id", bookingId)
        .eq("photographer_id", photographer.id)
        .single()

      if (bookingError || !bookingCheck) {
        return NextResponse.json(
          { error: "Booking not found or access denied" },
          { status: 404 }
        )
      }
    }


    // Generate unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${bookingId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("booking-files")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("booking-files").getPublicUrl(fileName)

    // Save file metadata to database
    // Use adminClient if it's a client upload (bypassing RLS), otherwise standard supabase client is fine,
    // actually adminClient is safer/easier for both since we validated permission above.
    const { error: dbError } = await adminClient.from("booking_files").insert({
      booking_id: bookingId,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: uploaderId, // Null for clients
    })

    if (dbError) {
      console.error("DB Insert Error:", dbError)
      // If database insert fails, try to delete the uploaded file
      await adminClient.storage.from("booking-files").remove([fileName])
      throw dbError
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}

