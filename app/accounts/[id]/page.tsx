"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from "chart.js"
import { createBrowserClient } from "@/lib/supabase/client"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Account = {
  id: string
  name: string
  slug: string
  balance: number
  percentage: number
  icon: string
  color: string
  text_color: string
  guidance?: string
}

type Transaction = {
  id: string
  title: string
  type: "revenue" | "expense" | "debit" | "loan"
  amount: number
  date: string
  notes: string
  created_at: string
}

type Allocation = {
  id: string
  account_id: string
  percentage: number
  allocated_amount: number
  account_name: string
  account_color: string
  account_text_color: string
}

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const { id } = params
  const supabase = createBrowserClient()

  // Validate UUID format before querying
  const isValidUUID = UUID_REGEX.test(id)

  useEffect(() => {
    if (!isValidUUID) {
      console.log("[v0] Invalid UUID format:", id, "- redirecting to accounts")
      router.push("/accounts")
      return
    }
    fetchAccountAndTransactions()
  }, [id, isValidUUID])

  const fetchAccountAndTransactions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", id)
        .maybeSingle()

      if (accountError) {
        console.error("Error fetching account:", accountError)
        setLoading(false)
        return
      }

      if (!accountData) {
        console.log("[v0] No account found with id:", id)
        setLoading(false)
        return
      }

      setAccount(accountData)

      const isRevenueAccount = accountData.name === "Revenue Account"

      if (isRevenueAccount) {
        // Fetch all transactions for revenue account
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(10)

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError)
        } else {
          setTransactions(transactionsData || [])
        }

        const { data: allocationsData, error: allocationsError } = await supabase
          .from("allocations")
          .select(`
            *,
            accounts:account_id (
              name,
              color,
              text_color
            )
          `)
          .eq("user_id", user.id)

        if (allocationsError) {
          console.error("Error fetching allocations:", allocationsError)
        } else {
          const formattedAllocations = (allocationsData || []).map((alloc: any) => ({
            id: alloc.id,
            account_id: alloc.account_id,
            percentage: alloc.percentage,
            allocated_amount: alloc.allocated_amount,
            account_name: alloc.accounts.name,
            account_color: alloc.accounts.color,
            account_text_color: alloc.accounts.text_color,
          }))
          setAllocations(formattedAllocations)
        }
      } else {
        // For other accounts, only fetch their specific transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("account_id", accountData.id)
          .order("date", { ascending: false })
          .limit(10)

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError)
        } else {
          setTransactions(transactionsData || [])
        }
      }

      setLoading(false)
    } catch (err) {
      console.error("Error fetching account:", err)
      setLoading(false)
    }
  }

  const inflow = transactions
    .filter((t) => t.type === "revenue" || (t.type === "loan" && t.amount > 0))
    .reduce((sum, t) => sum + t.amount, 0)

  const outflow = transactions
    .filter((t) => t.type === "expense" || t.type === "debit" || (t.type === "loan" && t.amount < 0))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netChange = inflow - outflow

  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0)
  const isRevenueAccount = account?.name === "Revenue Account"

  // Mock chart data (can be enhanced with real weekly aggregation later)
  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Inflow",
        data: [inflow * 0.2, inflow * 0.25, inflow * 0.3, inflow * 0.25],
        borderColor: "#2E7D32",
        backgroundColor: "rgba(46, 125, 50, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Outflow",
        data: [outflow * 0.2, outflow * 0.3, outflow * 0.25, outflow * 0.25],
        borderColor: "#F57C00",
        backgroundColor: "rgba(245, 124, 0, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ₹${context.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (value: any) => `₹${(value / 1000).toFixed(0)}k` } },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-6">
          <p className="text-muted-foreground">Loading account details...</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-6">
          <p className="text-muted-foreground">Account not found</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Link href="/accounts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Buckets
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">{account.name}</h2>
          {account.guidance && <p className="text-muted-foreground leading-relaxed">{account.guidance}</p>}
        </div>

        {/* Summary Card */}
        <Card style={{ borderRadius: "16px" }} className="shadow-md">
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className={`text-3xl font-bold ${account.text_color}`}>₹{account.balance.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Target Allocation</p>
                <p className="text-3xl font-bold">{account.percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={account.percentage < 40 ? "destructive" : "default"} className="rounded-full mt-1">
                  {account.percentage < 40 ? "Low" : "On Track"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {isRevenueAccount && allocations.length > 0 && (
          <Card style={{ borderRadius: "16px" }} className="shadow-md">
            <CardHeader>
              <CardTitle>Allocation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
                    <p className="text-2xl font-bold text-blue-600">₹{totalAllocated.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20">
                    <p className="text-sm text-muted-foreground mb-1">Remaining (shown above)</p>
                    <p className="text-2xl font-bold text-green-600">₹{account.balance.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Allocated to:</p>
                  {allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${allocation.account_color}`}></div>
                        <div>
                          <p className="font-semibold">{allocation.account_name}</p>
                          <p className="text-sm text-muted-foreground">{allocation.percentage}% allocated</p>
                        </div>
                      </div>
                      <p className={`text-lg font-bold ${allocation.account_text_color}`}>
                        ₹{allocation.allocated_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movement Section */}
        <Card style={{ borderRadius: "16px" }} className="shadow-md">
          <CardHeader>
            <CardTitle>Cash Movement (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Inflow this month</p>
                  <p className="text-xl font-bold text-green-600">₹{inflow.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Outflow this month</p>
                  <p className="text-xl font-bold text-orange-600">₹{outflow.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Net change</p>
                  <p className={`text-xl font-bold ${netChange >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                    {netChange >= 0 ? "+" : ""}₹{netChange.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card style={{ borderRadius: "16px" }} className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="gap-2">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet for this account</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Note</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 text-sm">{new Date(txn.date).toLocaleDateString("en-IN")}</td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={txn.type === "revenue" ? "default" : "secondary"}
                            className="rounded-full capitalize"
                          >
                            {txn.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm">{txn.title}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{txn.notes || "-"}</td>
                        <td
                          className={`py-3 px-2 text-sm font-semibold text-right ${
                            txn.type === "revenue" ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {txn.type === "revenue" ? "+" : "-"}₹{Math.abs(txn.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
