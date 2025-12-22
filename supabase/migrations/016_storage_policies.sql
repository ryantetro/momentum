-- ============================================================================
-- Migration 016: Storage RLS Policies
-- This migration creates RLS policies for Supabase Storage buckets to allow
-- photographers to upload and manage their own logos and booking files.
-- ============================================================================

-- Policies for logos bucket
-- Photographers can upload their own logos (files in their photographer_id folder)
CREATE POLICY "Photographers can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE user_id = auth.uid()
  )
);

-- Photographers can view their own logos
CREATE POLICY "Photographers can view their own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE user_id = auth.uid()
  )
);

-- Photographers can update their own logos
CREATE POLICY "Photographers can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE user_id = auth.uid()
  )
);

-- Photographers can delete their own logos
CREATE POLICY "Photographers can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE user_id = auth.uid()
  )
);

-- Public can view logos (since logos bucket is public)
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Policies for booking-files bucket
-- Photographers can upload files for their bookings
CREATE POLICY "Photographers can upload files for their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM bookings 
    WHERE photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  )
);

-- Photographers can view files for their bookings
CREATE POLICY "Photographers can view files for their bookings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM bookings 
    WHERE photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  )
);

-- Photographers can delete files for their bookings
CREATE POLICY "Photographers can delete files for their bookings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'booking-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM bookings 
    WHERE photographer_id IN (
      SELECT id FROM photographers WHERE user_id = auth.uid()
    )
  )
);



