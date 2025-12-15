import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bookingId = formData.get("bookingId") as string

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

    const supabase = await createClient()

    // Verify booking exists and user has access
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: photographer } = await supabase
      .from("photographers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!photographer) {
      return NextResponse.json(
        { error: "Photographer not found" },
        { status: 404 }
      )
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, photographer_id")
      .eq("id", bookingId)
      .eq("photographer_id", photographer.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 404 }
      )
    }

    // Use admin client for storage operations
    const adminClient = createAdminClient()

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
    const { error: dbError } = await supabase.from("booking_files").insert({
      booking_id: bookingId,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: photographer.id,
    })

    if (dbError) {
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

