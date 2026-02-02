"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

interface Account {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  text_color: string
  balance: number
}

interface AllocationData {
  account_id: string
  percentage: number
  allocated_amount: number
}

export default function AllocateFundsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [allocations, setAllocations] = useState<Record<string, AllocationData>>({})
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch user accounts (exclude Revenue Account from allocation targets)
        const { data: accountsData, error: accountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .neq("slug", "revenue-account")
          .order("created_at", { ascending: true })

        if (accountsError) throw accountsError

        // Fetch user settings to get initial amount
        const { data: settingsData, error: settingsError } = await supabase
          .from("user_settings")
          .select("initial_amount")
          .eq("user_id", user.id)
          .single()

        if (settingsError) throw settingsError

        // Calculate total revenue from transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("type", "revenue")

        if (transactionsError) throw transactionsError

        const totalRevenue = transactionsData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const totalAvailableAmount = Number(settingsData.initial_amount) + totalRevenue

        // Fetch existing allocations
        const { data: allocationsData, error: allocationsError } = await supabase
          .from("allocations")
          .select("*")
          .eq("user_id", user.id)

        if (allocationsError) throw allocationsError

        // Initialize allocations state
        const allocationsMap: Record<string, AllocationData> = {}
        accountsData?.forEach((account) => {
          const existing = allocationsData?.find((a) => a.account_id === account.id)
          allocationsMap[account.id] = {
            account_id: account.id,
            percentage: existing?.percentage || 0,
            allocated_amount: existing?.allocated_amount || 0,
          }
        })

        setAccounts(accountsData || [])
        setAllocations(allocationsMap)
        setTotalAvailable(totalAvailableAmount)
      } catch (error: any) {
        console.error("[v0] Error fetching data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePercentageChange = (accountId: string, newPercentage: string) => {
    const percentage = Number.parseFloat(newPercentage) || 0
    const allocated_amount = (totalAvailable * percentage) / 100

    setAllocations((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        percentage,
        allocated_amount,
      },
    }))
  }

  const handleAmountChange = (accountId: string, newAmount: string) => {
    const allocated_amount = Number.parseFloat(newAmount) || 0
    const percentage = totalAvailable > 0 ? (allocated_amount / totalAvailable) * 100 : 0

    setAllocations((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        percentage,
        allocated_amount,
      },
    }))
  }

  const handleRecalculate = () => {
    const updated: Record<string, AllocationData> = {}
    Object.entries(allocations).forEach(([accountId, data]) => {
      updated[accountId] = {
        ...data,
        allocated_amount: (totalAvailable * data.percentage) / 100,
      }
    })
    setAllocations(updated)
    toast({
      title: "Recalculated",
      description: "Amounts updated based on current percentages.",
    })
  }

  const handleSaveAllocation = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // Prepare allocation records
      const allocationRecords = Object.values(allocations).map((allocation) => ({
        user_id: user.id,
        account_id: allocation.account_id,
        percentage: allocation.percentage,
        allocated_amount: allocation.allocated_amount,
      }))

      // Upsert allocations (insert or update)
      for (const record of allocationRecords) {
        const { error } = await supabase.from("allocations").upsert(record, { onConflict: "user_id,account_id" })

        if (error) throw error

        // Update account balance
        const { error: balanceError } = await supabase
          .from("accounts")
          .update({ balance: record.allocated_amount })
          .eq("id", record.account_id)

        if (balanceError) throw balanceError
      }

      toast({
        title: "Success!",
        description: "Fund allocation saved successfully.",
      })

      router.push("/accounts")
    } catch (error: any) {
      console.error("[v0] Error saving allocations:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save allocations",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const totalPercentage = Object.values(allocations).reduce((sum, a) => sum + a.percentage, 0)
  const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + a.allocated_amount, 0)

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
            <h2 className="text-3xl font-bold">Allocate Funds</h2>
            <p className="text-muted-foreground leading-relaxed">
              Total available: ₹{totalAvailable.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {accounts.length === 0 ? (
          <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Money Buckets Found</h3>
                <p className="text-sm text-muted-foreground">Create some money buckets first to allocate funds.</p>
              </div>
              <Button onClick={() => router.push("/accounts")}>Go to Money Buckets</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Allocation Table */}
            <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 pb-3 border-b text-sm font-semibold text-muted-foreground">
                    <div className="col-span-4">Money Bucket</div>
                    <div className="col-span-2 text-center">%</div>
                    <div className="col-span-4 text-right">Amount</div>
                    <div className="col-span-2 text-center">Status</div>
                  </div>

                  {/* Account Rows */}
                  {accounts.map((account) => {
                    const allocation = allocations[account.id]
                    return (
                      <div
                        key={account.id}
                        className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        {/* Account Name */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${account.color} bg-opacity-10`}>
                            <div className={`h-5 w-5 ${account.text_color}`}>●</div>
                          </div>
                          <span className="font-semibold">{account.name}</span>
                        </div>

                        {/* Percentage Input */}
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={allocation?.percentage || 0}
                            onChange={(e) => handlePercentageChange(account.id, e.target.value)}
                            className="h-9 text-center rounded-lg"
                          />
                        </div>

                        {/* Amount Input */}
                        <div className="col-span-4">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              value={allocation?.allocated_amount || 0}
                              onChange={(e) => handleAmountChange(account.id, e.target.value)}
                              className="h-9 text-right font-mono rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    )
                  })}

                  {/* Total Row */}
                  <div className="grid grid-cols-12 gap-4 pt-3 border-t font-bold">
                    <div className="col-span-4">Total</div>
                    <div className="col-span-2 text-center">{totalPercentage.toFixed(1)}%</div>
                    <div className="col-span-4 text-right">₹{totalAllocated.toLocaleString("en-IN")}</div>
                    <div className="col-span-2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleRecalculate} className="flex-1 h-12 rounded-full bg-transparent">
                Recalculate
              </Button>

              <Button
                onClick={handleSaveAllocation}
                disabled={saving}
                className="flex-1 h-12 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Allocation"
                )}
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
