"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { uploadLogo } from "@/lib/supabase/storage"
import { Loader2, Upload, X, Image as ImageIcon, Copy, Check, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Photographer } from "@/types"

export function BusinessProfileTab() {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Form state
  const [username, setUsername] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [studioName, setStudioName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
  })

  useEffect(() => {
    async function fetchPhotographer() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        const { data, error: fetchError } = await supabase
          .from("photographers")
          .select("*, username") // Explicitly include username to ensure it's fetched
          .eq("user_id", session.user.id)
          .single()

        if (fetchError) {
          console.error("Error fetching photographer:", fetchError)
        }

        if (data) {
          setPhotographer(data)
          // Auto-populate username if it exists (from trigger)
          // The trigger automatically generates a username when a user signs up
          // If username is null, it means the user was created before the trigger fix
          if (data.username) {
            setUsername(data.username)
          } else {
            // Username not set - this shouldn't happen for new users with the fixed trigger
            setUsername("")
          }
          setStudioName(data.studio_name || "")
          setPhone(data.phone || "")
          setWebsite(data.website || "")
          setLogoUrl(data.logo_url)
          setSocialLinks(
            (data.social_links as { instagram: string; facebook: string; twitter: string }) || {
              instagram: "",
              facebook: "",
              twitter: "",
            }
          )
        }
      } catch (error) {
        console.error("Error fetching photographer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotographer()
  }, [supabase])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !photographer) return

    setUploadingLogo(true)

    try {
      const result = await uploadLogo(file, photographer.id)
      setLogoUrl(result.url)

      // Update database
      const { error } = await supabase
        .from("photographers")
        .update({ logo_url: result.url })
        .eq("id", photographer.id)

      if (error) throw error

      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully",
      })
    } catch (error: any) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!photographer) return

    try {
      const { error } = await supabase
        .from("photographers")
        .update({ logo_url: null })
        .eq("id", photographer.id)

      if (error) throw error

      setLogoUrl(null)
      toast({
        title: "Logo removed",
        description: "Your logo has been removed",
      })
    } catch (error: any) {
      console.error("Error removing logo:", error)
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      })
    }
  }

  const validateUsername = (value: string): boolean => {
    // Alphanumeric, hyphens, underscores, 3-30 characters
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    return usernameRegex.test(value)
  }

  const checkUsernameAvailability = async (value: string) => {
    if (!value || !validateUsername(value)) {
      setUsernameAvailable(null)
      return
    }

    if (value === photographer?.username) {
      setUsernameAvailable(true)
      return
    }

    setCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from("photographers")
        .select("id")
        .ilike("username", value)
        .single()

      // If no data found, username is available
      setUsernameAvailable(!data)
    } catch (error: any) {
      // If error is "not found", username is available
      if (error.code === "PGRST116") {
        setUsernameAvailable(true)
      } else {
        setUsernameAvailable(false)
      }
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    const lowerValue = value.toLowerCase()
    setUsername(lowerValue)
    setUsernameAvailable(null)

    // Debounce username check
    if (lowerValue) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(lowerValue)
      }, 500)
      // Note: cleanup handled by component unmount
    } else {
      setUsernameAvailable(null)
    }
  }

  const handleCopyInquiryLink = () => {
    if (!username) return
    const inquiryUrl = `${window.location.origin}/inquiry/${username}`
    navigator.clipboard.writeText(inquiryUrl)
    toast({
      title: "Link copied!",
      description: "Your inquiry link has been copied to clipboard",
    })
  }

  const handleSave = async () => {
    if (!photographer) return

    // Validate username if provided
    if (username && !validateUsername(username)) {
      toast({
        title: "Invalid username",
        description: "Username must be 3-30 characters, alphanumeric with hyphens/underscores only",
        variant: "destructive",
      })
      return
    }

    if (username && usernameAvailable === false) {
      toast({
        title: "Username unavailable",
        description: "This username is already taken. Please choose another.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from("photographers")
        .update({
          username: username || null,
          studio_name: studioName || null,
          phone: phone || null,
          website: website || null,
          social_links: socialLinks,
        })
        .eq("id", photographer.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your business profile has been saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          Configure your business identity that will appear on contracts and client portals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Username / Inquiry Link */}
        <div className="space-y-2">
          <Label htmlFor="username">Public Username</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="your-username"
                  className={cn(
                    username && !validateUsername(username) && "border-red-500",
                    username && usernameAvailable === true && "border-green-500",
                    username && usernameAvailable === false && "border-red-500"
                  )}
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {username && !checkingUsername && usernameAvailable === true && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {username && !checkingUsername && usernameAvailable === false && (
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            {username && validateUsername(username) && usernameAvailable === true && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your Inquiry Link:</p>
                    <code className="text-xs break-all text-blue-600 dark:text-blue-400">
                      {typeof window !== "undefined" ? `${window.location.origin}/inquiry/${username}` : `/inquiry/${username}`}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyInquiryLink}
                    className="ml-2 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this link in your Instagram bio, website, or anywhere clients can find you.
                </p>
              </div>
            )}
            {username && !validateUsername(username) && (
              <p className="text-xs text-red-600">
                Username must be 3-30 characters, alphanumeric with hyphens/underscores only
              </p>
            )}
            {username && usernameAvailable === false && (
              <p className="text-xs text-red-600">This username is already taken</p>
            )}
            <p className="text-xs text-muted-foreground">
              Create a unique username for your public inquiry link. Clients will use this to submit booking inquiries.
            </p>
          </div>
        </div>

        {/* Studio Name */}
        <div className="space-y-2">
          <Label htmlFor="studio-name">Studio Name</Label>
          <Input
            id="studio-name"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="e.g., Pacific Light Photography"
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Professional Logo</Label>
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt="Studio logo"
                  className="h-24 w-24 object-contain border rounded-md p-2 bg-background"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload a logo (JPG, PNG, or WebP, max 20MB). Will appear on invoices and client portal. You can select photos from your Photos app.
              </p>
              {uploadingLogo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={photographer?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed through your account settings
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <Label>Social Media Links (Optional)</Label>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-sm">
                Instagram
              </Label>
              <Input
                id="instagram"
                type="url"
                value={socialLinks.instagram}
                onChange={(e) =>
                  setSocialLinks({ ...socialLinks, instagram: e.target.value })
                }
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="text-sm">
                Facebook
              </Label>
              <Input
                id="facebook"
                type="url"
                value={socialLinks.facebook}
                onChange={(e) =>
                  setSocialLinks({ ...socialLinks, facebook: e.target.value })
                }
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-sm">
                Twitter
              </Label>
              <Input
                id="twitter"
                type="url"
                value={socialLinks.twitter}
                onChange={(e) =>
                  setSocialLinks({ ...socialLinks, twitter: e.target.value })
                }
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

