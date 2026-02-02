"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Save, Info, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Account {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  text_color: string
}

interface AllocationSetting {
  account_id: string
  percentage: number
  account?: Account
}

export default function AllocationSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<Record<string, number>>({})
  const [sweepFrequency, setSweepFrequency] = useState<"monthly" | "quarterly">("monthly")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Fetch accounts (exclude revenue account as it's the source)
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .neq("slug", "revenue-account")
        .order("created_at", { ascending: true })

      if (accountsError) throw accountsError

      // Fetch existing allocation settings
      const response = await fetch("/api/allocation-settings")
      const { settings: existingSettings } = await response.json()

      // Initialize settings state
      const settingsMap: Record<string, number> = {}
      accountsData?.forEach((account) => {
        const existing = existingSettings?.find((s: any) => s.account_id === account.id)
        settingsMap[account.id] = existing?.percentage || 0
      })

      // Get sweep frequency from first setting
      if (existingSettings && existingSettings.length > 0) {
        setSweepFrequency(existingSettings[0].sweep_frequency || "monthly")
      }

      setAccounts(accountsData || [])
      setSettings(settingsMap)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePercentageChange = (accountId: string, value: string) => {
    const percentage = Number.parseFloat(value) || 0
    setSettings((prev) => ({
      ...prev,
      [accountId]: percentage,
    }))
  }

  const handleSave = async () => {
    // Validate total equals 100%
    const total = Object.values(settings).reduce((sum, val) => sum + val, 0)
    if (Math.abs(total - 100) > 0.01) {
      toast({
        title: "Invalid Allocation",
        description: `Total allocation must equal 100%. Current total: ${total.toFixed(1)}%`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const settingsArray = Object.entries(settings).map(([account_id, percentage]) => ({
        account_id,
        percentage,
      }))

      const response = await fetch("/api/allocation-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: settingsArray,
          sweep_frequency: sweepFrequency,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: "Allocation settings saved successfully",
      })

      router.push("/admin")
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const totalPercentage = Object.values(settings).reduce((sum, val) => sum + val, 0)
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">Allocation Settings</h2>
            <p className="text-muted-foreground leading-relaxed">Set global allocation percentages for all revenue</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="shadow-xl border-blue-200 dark:border-blue-900" style={{ borderRadius: "16px" }}>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  These percentages will be applied to <strong>all revenue</strong> automatically during the sweep
                  process. Revenue is initially recorded in the Operating Account, then redistributed based on these
                  rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sweep Frequency */}
        <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sweep Frequency
            </CardTitle>
            <CardDescription>How often should funds be automatically allocated?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={sweepFrequency} onValueChange={(value: "monthly" | "quarterly") => setSweepFrequency(value)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Allocation Percentages */}
        <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle>Money Bucket Allocation Percentages</CardTitle>
            <CardDescription>Total must equal 100%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${account.color} bg-opacity-10`}>
                    <div className={`h-5 w-5 ${account.text_color}`}>●</div>
                  </div>
                  <Label htmlFor={account.id} className="font-semibold cursor-pointer">
                    {account.name}
                  </Label>
                </div>
                <div className="flex items-center gap-2 w-32">
                  <Input
                    id={account.id}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings[account.id] || 0}
                    onChange={(e) => handlePercentageChange(account.id, e.target.value)}
                    className="h-10 text-right rounded-lg"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="pt-4 border-t flex items-center justify-between">
              <span className="font-bold text-lg">Total Allocation</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    isValidTotal ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {totalPercentage.toFixed(1)}%
                </span>
                {isValidTotal ? (
                  <span className="text-green-600 dark:text-green-400">✓</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()} className="flex-1 h-12 rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !isValidTotal}
            className="flex-1 h-12 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
