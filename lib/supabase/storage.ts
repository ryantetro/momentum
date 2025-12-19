import { createClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export interface UploadResult {
  url: string
  path: string
}

export async function uploadLogo(
  file: File,
  photographerId: string
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPG, PNG, or WebP image."
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
    throw new Error(`File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB. Please choose a smaller image.`)
  }

  const supabase = createClient()

  // Get file extension
  const fileExt = file.name.split(".").pop() || "jpg"
  const fileName = `logo.${fileExt}`
  const filePath = `${photographerId}/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from("logos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true, // Replace existing file if it exists
    })

  if (error) {
    console.error("Error uploading logo:", error)
    
    // Provide helpful error message if bucket doesn't exist
    if (error.message?.includes("Bucket not found") || error.message?.includes("not found")) {
      throw new Error(
        "Storage bucket 'logos' not found. Please run 'node scripts/create-storage-buckets.js' to create it, or create it manually in your Supabase dashboard under Storage."
      )
    }
    
    // Provide helpful error message if RLS policy is blocking
    if (error.message?.includes("row-level security") || error.message?.includes("RLS") || error.message?.includes("policy")) {
      throw new Error(
        "Storage RLS policy error. Please run the SQL migration 'supabase/migrations/016_storage_policies.sql' in your Supabase SQL editor to set up the required policies."
      )
    }
    
    throw new Error(`Failed to upload logo: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(filePath)

  if (!publicUrl) {
    throw new Error("Failed to get public URL for uploaded logo")
  }

  return {
    url: publicUrl,
    path: filePath,
  }
}

export async function deleteLogo(photographerId: string): Promise<void> {
  const supabase = createClient()
  const filePath = `${photographerId}/logo.*`

  // List files in the photographer's folder
  const { data: files, error: listError } = await supabase.storage
    .from("logos")
    .list(photographerId)

  if (listError) {
    console.error("Error listing files:", listError)
    return
  }

  // Delete all logo files (in case of different extensions)
  const logoFiles = files?.filter((file) => file.name.startsWith("logo.")) || []
  const pathsToDelete = logoFiles.map((file) => `${photographerId}/${file.name}`)

  if (pathsToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from("logos")
      .remove(pathsToDelete)

    if (deleteError) {
      console.error("Error deleting logo:", deleteError)
    }
  }
}

