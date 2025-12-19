"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react"
import type { ServicePackage } from "@/types"

export function ServicePackagesTab() {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    service_type: "",
    total_price: "",
    deposit_percentage: "",
    deposit_amount: "",
    is_default: false,
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPackages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching packages:", {
          error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      setPackages(data || [])
    } catch (error: any) {
      // Better error logging
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      const errorCode = error?.code || 'UNKNOWN'
      const errorDetails = error?.details || error?.hint || ''
      
      console.error("Error fetching packages:", {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        fullError: error,
      })
      
      toast({
        title: "Error",
        description: errorMessage || "Failed to load service packages. The service_packages table may not exist. Please run the migration: supabase/migrations/013_add_service_packages.sql",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      service_type: "",
      total_price: "",
      deposit_percentage: "",
      deposit_amount: "",
      is_default: false,
    })
    setEditingId(null)
  }

  function handleEdit(pkg: ServicePackage) {
    setFormData({
      name: pkg.name,
      service_type: pkg.service_type,
      total_price: pkg.total_price.toString(),
      deposit_percentage: pkg.deposit_percentage?.toString() || "",
      deposit_amount: pkg.deposit_amount?.toString() || "",
      is_default: pkg.is_default,
    })
    setEditingId(pkg.id)
  }

  async function handleSave() {
    if (!formData.name || !formData.total_price) {
      toast({
        title: "Error",
        description: "Name and total price are required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) {
        throw new Error("Photographer not found")
      }

      const packageData: any = {
        photographer_id: photographer.id,
        name: formData.name,
        service_type: formData.service_type,
        total_price: parseFloat(formData.total_price),
        is_default: formData.is_default,
      }

      // Handle deposit (either percentage or fixed amount)
      if (formData.deposit_amount) {
        packageData.deposit_amount = parseFloat(formData.deposit_amount)
        packageData.deposit_percentage = null
      } else if (formData.deposit_percentage) {
        packageData.deposit_percentage = parseFloat(formData.deposit_percentage) / 100
        packageData.deposit_amount = null
      }

      // If setting as default, unset other defaults for same service type
      if (formData.is_default) {
        let unsetQuery = supabase
          .from("service_packages")
          .update({ is_default: false })
          .eq("photographer_id", photographer.id)
          .eq("service_type", formData.service_type)
        
        // Only exclude the current package if we're editing (not creating)
        if (editingId) {
          unsetQuery = unsetQuery.neq("id", editingId)
        }

        const { error: unsetError } = await unsetQuery

        if (unsetError) throw unsetError
      }

      if (editingId) {
        // Update existing package
        const { error } = await supabase
          .from("service_packages")
          .update(packageData)
          .eq("id", editingId)

        if (error) throw error
        toast({
          title: "Success",
          description: "Service package updated",
        })
      } else {
        // Create new package
        const { error } = await supabase.from("service_packages").insert(packageData)

        if (error) throw error
        toast({
          title: "Success",
          description: "Service package created",
        })
      }

      resetForm()
      fetchPackages()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service package",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this package?")) return

    try {
      const { error } = await supabase.from("service_packages").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Service package deleted",
      })

      fetchPackages()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service package",
        variant: "destructive",
      })
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Packages</CardTitle>
          <CardDescription>
            Create pricing packages that will auto-fill when converting inquiries. Packages are
            automatically matched by service type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold">
              {editingId ? "Edit Package" : "Create New Package"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="package-name">Package Name *</Label>
                <Input
                  id="package-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wedding - Gold Package"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="package-service-type">Service Type *</Label>
                <Input
                  id="package-service-type"
                  type="text"
                  placeholder="e.g., Wedding, Sports, Corporate..."
                  value={formData.service_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      service_type: e.target.value,
                    })
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-total-price">Total Price *</Label>
              <Input
                id="package-total-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_price}
                onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                placeholder="0.00"
                disabled={saving}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="package-deposit-percentage">Deposit Percentage</Label>
                <Input
                  id="package-deposit-percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.deposit_percentage}
                  onChange={(e) => setFormData({ ...formData, deposit_percentage: e.target.value })}
                  placeholder="20"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of total price (e.g., 20 for 20%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package-deposit-amount">Or Fixed Deposit Amount</Label>
                <Input
                  id="package-deposit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  placeholder="0.00"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Fixed amount (takes precedence over percentage)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="package-default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="package-default" className="cursor-pointer">
                Set as default for this service type
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingId ? "Update Package" : "Create Package"}
                  </>
                )}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Packages List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Packages</h3>
            {packages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No packages yet. Create your first package above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {packages.map((pkg) => {
                  const depositDisplay = pkg.deposit_amount
                    ? `$${pkg.deposit_amount.toLocaleString()}`
                    : pkg.deposit_percentage
                    ? `${(pkg.deposit_percentage * 100).toFixed(0)}%`
                    : "Not set"

                  return (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{pkg.name}</span>
                          {pkg.is_default && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="capitalize">{pkg.service_type}</span> • $
                          {pkg.total_price.toLocaleString()} • Deposit: {depositDisplay}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                          disabled={saving}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pkg.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

