"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface Allocation {
  id: string
  amount: number
  percentage: number
  status: string
  created_at: string
  to_account: {
    id: string
    name: string
    slug: string
    color: string
    text_color: string
    icon: string
  }
  from_account: {
    id: string
    name: string
    balance: number
  }
  transaction: {
    id: string
    description: string
    amount: number
    created_at: string
  }
}

interface GroupedAllocation {
  account: any
  total: number
  allocations: Allocation[]
}

export default function SweepExecutionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [pendingAllocations, setPendingAllocations] = useState<Allocation[]>([])
  const [groupedAllocations, setGroupedAllocations] = useState<Record<string, GroupedAllocation>>({})
  const [totalPending, setTotalPending] = useState(0)

  useEffect(() => {
    fetchPendingAllocations()
  }, [])

  const fetchPendingAllocations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/sweep")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pending allocations")
      }

      setPendingAllocations(data.pendingAllocations)
      setGroupedAllocations(data.groupedAllocations)
      setTotalPending(data.totalPending)
    } catch (error: any) {
      console.error("[v0] Error fetching allocations:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteSweep = async () => {
    if (pendingAllocations.length === 0) {
      toast({
        title: "No Pending Allocations",
        description: "There are no pending allocations to execute.",
      })
      return
    }

    setExecuting(true)
    try {
      const response = await fetch("/api/sweep", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute sweep")
      }

      toast({
        title: "Sweep Completed!",
        description: `Successfully completed ${data.completed} allocation(s). ${data.failed > 0 ? `${data.failed} failed.` : ""}`,
      })

      // Refresh the data
      await fetchPendingAllocations()
    } catch (error: any) {
      console.error("[v0] Error executing sweep:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setExecuting(false)
    }
  }

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

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">Sweep Execution</h2>
            <p className="text-muted-foreground leading-relaxed">
              Execute pending allocations and distribute funds to accounts
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle>Sweep Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Pending Allocations:</span>
              <span className="text-2xl font-bold">{pendingAllocations.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Amount to Distribute:</span>
              <span className="text-2xl font-bold text-green-600">₹{totalPending.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Allocations */}
        {pendingAllocations.length === 0 ? (
          <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Pending Allocations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All allocations have been executed. Add revenue transactions to create new pending allocations.
                </p>
              </div>
              <Button onClick={() => router.push("/transactions/new")}>Add Transaction</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grouped by Account */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Allocation Preview</h3>
              {Object.entries(groupedAllocations).map(([accountId, group]) => (
                <Card key={accountId} className="shadow-lg" style={{ borderRadius: "16px" }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${group.account.color} bg-opacity-10`}>
                          <div className={`h-6 w-6 ${group.account.text_color}`}>●</div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{group.account.name}</h4>
                          <p className="text-sm text-muted-foreground">{group.allocations.length} allocation(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">+₹{group.total.toLocaleString("en-IN")}</div>
                        <p className="text-xs text-muted-foreground">Total to allocate</p>
                      </div>
                    </div>

                    {/* Individual Allocations */}
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      {group.allocations.map((allocation) => (
                        <div
                          key={allocation.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{allocation.transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(allocation.transaction.created_at).toLocaleDateString("en-IN")} •{" "}
                              {allocation.percentage}% of ₹{allocation.transaction.amount.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{allocation.amount.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Execute Button */}
            <Card className="shadow-xl border-2" style={{ borderRadius: "16px" }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-8 w-8 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold">Ready to Execute Sweep</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This will move ₹{totalPending.toLocaleString("en-IN")} from your revenue account to{" "}
                      {Object.keys(groupedAllocations).length} target account(s).
                    </p>
                  </div>
                  <Button
                    onClick={handleExecuteSweep}
                    disabled={executing}
                    className="h-12 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        Execute Sweep
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
