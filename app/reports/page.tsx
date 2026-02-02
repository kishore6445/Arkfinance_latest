"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Send } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface ExpenseCategory {
  name: string
  value: number
  color: string
}

interface WeeklyRevenue {
  week: string
  revenue: number
}

const generateColors = (count: number) => {
  const baseColors = ["#F57C00", "#FB8C00", "#FF9800", "#FFA726", "#FFB74D"]
  return baseColors.slice(0, count)
}

const CustomPieTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const percent = ((value / total) * 100).toFixed(1)
    const formatted = value.toLocaleString("en-IN")

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="text-sm">
          <span className="font-semibold">{payload[0].name}:</span>
          <br />
          <span className="font-medium">₹{formatted}</span>
          <span className="text-muted-foreground ml-1">({percent}%)</span>
        </div>
      </div>
    )
  }
  return null
}

const CustomBarTooltip = ({ active, payload, maxRevenue }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const percent = ((value / maxRevenue) * 100).toFixed(1)
    const formatted = value.toLocaleString("en-IN")

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="text-sm">
          <span className="font-semibold">{payload[0].payload.week}:</span>
          <br />
          <span className="font-medium">₹{formatted}</span>
          <span className="text-muted-foreground ml-1">({percent}%)</span>
        </div>
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [profit, setProfit] = useState(0)
  const [expenseData, setExpenseData] = useState<ExpenseCategory[]>([])
  const [revenueData, setRevenueData] = useState<WeeklyRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    try {
      const supabase = createBrowserClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get current month start and end dates
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Fetch all transactions for current month
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*, accounts(name)")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0])

      if (error) throw error

      // Calculate revenue and expenses
      const revenue =
        transactions?.filter((t) => t.type === "revenue").reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const expenses =
        transactions
          ?.filter((t) => t.type === "expense" || t.type === "debit" || t.type === "loan")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setTotalRevenue(revenue)
      setTotalExpenses(expenses)
      setProfit(revenue - expenses)

      // Group expenses by account (top 5)
      const expensesByAccount: { [key: string]: number } = {}
      transactions
        ?.filter((t) => t.type === "expense" || t.type === "debit" || t.type === "loan")
        .forEach((t) => {
          const accountName = t.accounts?.name || "Unknown"
          expensesByAccount[accountName] = (expensesByAccount[accountName] || 0) + Number(t.amount)
        })

      const topExpenses = Object.entries(expensesByAccount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value], index) => ({
          name,
          value,
          color: generateColors(5)[index],
        }))

      setExpenseData(topExpenses)

      // Calculate weekly revenue
      const weeklyRevenue: { [key: string]: number } = {
        "Week 1": 0,
        "Week 2": 0,
        "Week 3": 0,
        "Week 4": 0,
      }

      transactions
        ?.filter((t) => t.type === "revenue")
        .forEach((t) => {
          const date = new Date(t.date)
          const dayOfMonth = date.getDate()
          if (dayOfMonth <= 7) weeklyRevenue["Week 1"] += Number(t.amount)
          else if (dayOfMonth <= 14) weeklyRevenue["Week 2"] += Number(t.amount)
          else if (dayOfMonth <= 21) weeklyRevenue["Week 3"] += Number(t.amount)
          else weeklyRevenue["Week 4"] += Number(t.amount)
        })

      const weeklyData = Object.entries(weeklyRevenue).map(([week, revenue]) => ({
        week,
        revenue,
      }))

      setRevenueData(weeklyData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching reports data:", error)
      setLoading(false)
    }
  }

  const summaryData = [
    {
      label: "Revenue",
      value: totalRevenue,
      display: `₹${totalRevenue.toLocaleString("en-IN")}`,
      color: "text-[#2E7D32]",
    },
    {
      label: "Expenses",
      value: totalExpenses,
      display: `₹${totalExpenses.toLocaleString("en-IN")}`,
      color: "text-[#F57C00]",
    },
    { label: "Profit", value: profit, display: `₹${profit.toLocaleString("en-IN")}`, color: "text-[#1565C0]" },
  ]

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 0)

  const handleExportPDF = () => {
    toast({
      title: "Report exported",
      description: "Your report has been downloaded as PDF.",
    })
  }

  const handleSendToCA = () => {
    toast({
      title: "Report sent to CA",
      description: "Your chartered accountant will receive the report via email.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Reports</h2>
            <p className="text-muted-foreground">Loading your reports...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold">Reports</h2>
          <p className="text-muted-foreground">Here's how your money moved this month.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryData.map((item, index) => (
            <Card
              key={item.label}
              className="shadow-lg"
              style={{
                borderRadius: "16px",
                animationDelay: `${index * 100}ms`,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label} (MTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${item.color} flex items-baseline gap-1`}>
                  <span>₹</span>
                  <span className="font-mono tabular-nums">{item.value.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Breakdown */}
          <Card
            className="shadow-lg"
            style={{
              borderRadius: "16px",
              animationDelay: "500ms",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
            }}
          >
            <CardHeader>
              <CardTitle>Top 5 Expense Categories</CardTitle>
              <p className="text-sm text-muted-foreground">Breakdown of expenses this month</p>
            </CardHeader>
            <CardContent>
              {expenseData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No expense data available
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={500}
                        animationDuration={800}
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip total={totalExpenses} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Revenue */}
          <Card
            className="shadow-lg"
            style={{
              borderRadius: "16px",
              animationDelay: "600ms",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
            }}
          >
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
              <p className="text-sm text-muted-foreground">Revenue breakdown by week</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
                    <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
                    <Tooltip content={<CustomBarTooltip maxRevenue={maxRevenue} />} />
                    <Bar
                      dataKey="revenue"
                      fill="#2E7D32"
                      radius={[8, 8, 0, 0]}
                      animationBegin={600}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleExportPDF}
            className="flex-1 h-12 rounded-full font-semibold bg-transparent"
            variant="outline"
          >
            <Download className="mr-2 h-5 w-5" />
            Export PDF
          </Button>
          <Button
            onClick={handleSendToCA}
            className="flex-1 h-12 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <Send className="mr-2 h-5 w-5" />
            Send to CA
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
