"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Banknote,
  Users,
  Calculator,
  FileCheck,
  BarChart3,
  ArrowRight,
  Plus,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InitialAmountModal } from "@/components/initial-amount-modal"
import { useToast } from "@/hooks/use-toast"
import { FinancialOverview } from "@/components/financial-overview"
import { useDashboardView } from "@/hooks/use-dashboard-view"
import { DashboardViewToggle } from "@/components/dashboard-view-toggle"
import { OwnerDashboardLayout } from "@/components/owner-dashboard-layout"
import { AccountantDashboardLayout } from "@/components/accountant-dashboard-layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        {payload.map((entry: any, index: number) => {
          const value = entry.value
          const formatted = value.toLocaleString("en-IN")
          const percent = ((value / 200000) * 100).toFixed(1)
          return (
            <div key={index} className="text-sm">
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.name}:
              </span>{" "}
              <span className="font-medium">₹{formatted}</span>
              <span className="text-muted-foreground ml-1">• {percent}%</span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const { view, updateView, isLoaded } = useDashboardView()

  const [animatedValues, setAnimatedValues] = useState<Record<number, number>>({})
  const [showInitialAmountModal, setShowInitialAmountModal] = useState(false)
  const [hasInitialAmount, setHasInitialAmount] = useState<boolean | null>(null)
  const [showEstimatedExpenseDialog, setShowEstimatedExpenseDialog] = useState(false)
  const [estimatedMonthlyExpense, setEstimatedMonthlyExpense] = useState<number>(0)
  const [estimatedExpenseInput, setEstimatedExpenseInput] = useState<string>("")
  const [initialAmount, setInitialAmount] = useState<number | null>(null)

  const [dashboardData, setDashboardData] = useState<{
    revenue: number
    expenses: number
    profit: number
    prevRevenue: number
    prevExpenses: number
    prevProfit: number
    quarterRevenue: number
    quarterExpenses: number
    quarterProfit: number
    prevQuarterRevenue: number
    prevQuarterExpenses: number
    prevQuarterProfit: number
    yearRevenue: number
    yearExpenses: number
    yearProfit: number
    prevYearRevenue: number
    prevYearExpenses: number
    prevYearProfit: number
    totalBalance: number
    runwayMonths: number
    runwayDays: number
    loanOutstanding: number
    nextEmiDate: string
    nextEmiAmount: number
    repaymentProgress: number
    cashFlowData: Array<{ month: string; inflow: number; outflow: number }>
    pendingReceivables: number
    pendingInvoiceCount: number
    overdueInvoiceCount: number
    highExpenseAlerts: Array<{ category: string; amount: number; percentageChange: number }>
    unallocatedCash: number
    upcomingCompliance: Array<{ title: string; daysUntil: number; category: string }>
  }>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    prevRevenue: 0,
    prevExpenses: 0,
    prevProfit: 0,
    quarterRevenue: 0,
    quarterExpenses: 0,
    quarterProfit: 0,
    prevQuarterRevenue: 0,
    prevQuarterExpenses: 0,
    prevQuarterProfit: 0,
    yearRevenue: 0,
    yearExpenses: 0,
    yearProfit: 0,
    prevYearRevenue: 0,
    prevYearExpenses: 0,
    prevYearProfit: 0,
    totalBalance: 0,
    runwayMonths: 0,
    runwayDays: 0,
    loanOutstanding: 0,
    nextEmiDate: "",
    nextEmiAmount: 0,
    repaymentProgress: 0,
    cashFlowData: [],
    pendingReceivables: 0,
    pendingInvoiceCount: 0,
    overdueInvoiceCount: 0,
    highExpenseAlerts: [],
    unallocatedCash: 0,
    upcomingCompliance: [],
  })
  const [loading, setLoading] = useState(true)
  const fetchDashboardDataRef = useRef<() => Promise<void> | null>(null)

  const fetchDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: settings } = await supabase
        .from("user_settings")
        .select("initial_amount, estimated_monthly_expense")
        .eq("user_id", user.id)
        .single()

      setEstimatedMonthlyExpense(settings?.estimated_monthly_expense || 0)
      setInitialAmount(settings?.initial_amount || null)

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (!transactions) {
        setLoading(false)
        return
      }

      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // Calculate current quarter (0-based)
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const currentQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
      const prevQuarterStart = currentQuarter === 0 
        ? new Date(now.getFullYear() - 1, 9, 1) 
        : new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
      const prevQuarterEnd = currentQuarter === 0 
        ? new Date(now.getFullYear(), 12, 0) 
        : new Date(now.getFullYear(), currentQuarter * 3, 0)

      // Calculate year data
      const currentYearStart = new Date(now.getFullYear(), 0, 1)
      const prevYearStart = new Date(now.getFullYear() - 1, 0, 1)
      const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31)

      const currentMonthTransactions = transactions.filter((t) => new Date(t.date) >= currentMonthStart)
      const prevMonthTransactions = transactions.filter(
        (t) => new Date(t.date) >= prevMonthStart && new Date(t.date) <= prevMonthEnd,
      )

      const currentQuarterTransactions = transactions.filter((t) => new Date(t.date) >= currentQuarterStart)
      const prevQuarterTransactions = transactions.filter(
        (t) => new Date(t.date) >= prevQuarterStart && new Date(t.date) <= prevQuarterEnd,
      )

      const currentYearTransactions = transactions.filter((t) => new Date(t.date) >= currentYearStart)
      const prevYearTransactions = transactions.filter(
        (t) => new Date(t.date) >= prevYearStart && new Date(t.date) <= prevYearEnd,
      )

      const revenue = currentMonthTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expenses = currentMonthTransactions
        .filter((t) => t.type === "expense" || t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const profit = revenue - expenses

      const prevRevenue = prevMonthTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const prevExpenses = prevMonthTransactions
        .filter((t) => t.type === "expense" || t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const prevProfit = prevRevenue - prevExpenses

      // Calculate quarterly metrics
      const quarterRevenue = currentQuarterTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const quarterExpenses = currentQuarterTransactions
        .filter((t) => t.type === "expense" || t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const quarterProfit = quarterRevenue - quarterExpenses

      const prevQuarterRevenue = prevQuarterTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const prevQuarterExpenses = prevQuarterTransactions
        .filter((t) => t.type === "expense" || t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const prevQuarterProfit = prevQuarterRevenue - prevQuarterExpenses

      // Calculate yearly metrics
      const yearRevenue = currentYearTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const yearExpenses = currentYearTransactions
        .filter((t) => t.type === "expense" || t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const yearProfit = yearRevenue - yearExpenses

      const prevYearRevenue = prevYearTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const prevYearExpenses = prevYearTransactions
        .filter((t) => t.type === "expense" || t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const prevYearProfit = prevYearRevenue - prevYearExpenses
      const totalRevenue = transactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const totalExpenses = transactions
        .filter((t) => t.type === "expense" || t.type === "debit" || t.type === "loan")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const totalBalance = initialAmount !== null ? Number(initialAmount) + totalRevenue - totalExpenses : 0

      const avgMonthlyExpenses = settings?.estimated_monthly_expense || expenses || 1
      const runwayMonths = totalBalance / avgMonthlyExpenses
      const runwayDays = Math.floor(runwayMonths * 30)

      const loanTransactions = transactions.filter((t) => t.type === "loan")
      const loansReceived = loanTransactions
        .filter((t) => t.category === "loans_received")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const loansPaid = loanTransactions
        .filter((t) => t.category === "loans_paid" || t.category === "interest_paid")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const loanOutstanding = loansReceived - loansPaid

      const nextEmiDate = "15 Jul"
      const nextEmiAmount = 12500
      const repaymentProgress = loansReceived > 0 ? (loansPaid / loansReceived) * 100 : 0

      const cashFlowData = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthTransactions = transactions.filter(
          (t) => new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd,
        )

        const inflow = monthTransactions
          .filter((t) => t.type === "revenue")
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const outflow = monthTransactions
          .filter((t) => t.type === "expense" || t.type === "debit" || t.type === "loan")
          .reduce((sum, t) => sum + Number(t.amount), 0)

        cashFlowData.push({
          month: monthStart.toLocaleString("en-US", { month: "short" }),
          inflow,
          outflow,
        })
      }

      // Calculate pending receivables from invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, grand_total, status, due_date")
        .eq("user_id", user.id)

      const pendingInvoices = invoices?.filter((inv) => inv.status !== "paid") || []
      const overdueInvoices = pendingInvoices.filter((inv) => new Date(inv.due_date) < now) || []
      const pendingReceivables = pendingInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0)
      const pendingInvoiceCount = pendingInvoices.length
      const overdueInvoiceCount = overdueInvoices.length

      // Calculate high expense alerts (compare current month to previous month)
      const highExpenseAlerts = []
      if (prevExpenses > 0) {
        const expenseChangePercent = ((expenses - prevExpenses) / prevExpenses) * 100
        if (expenseChangePercent > 20) {
          // Alert if expenses increased more than 20%
          highExpenseAlerts.push({
            category: "Overall Expenses",
            amount: expenses,
            percentageChange: expenseChangePercent,
          })
        }
      }

      // Calculate unallocated cash (pending allocations in allocations table)
      const { data: allocations } = await supabase
        .from("allocations")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "pending")

      const unallocatedCash = allocations?.reduce((sum, alloc) => sum + Number(alloc.amount), 0) || 0

      // Fetch upcoming compliance deadlines (next 30 days)
      const { data: compliance } = await supabase
        .from("compliance_deadlines")
        .select("title, deadline_date, category")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .gte("deadline_date", now.toISOString().split("T")[0])
        .lte("deadline_date", new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("deadline_date", { ascending: true })
        .limit(3)

      const upcomingCompliance = (compliance || []).map((item) => ({
        title: item.title,
        daysUntil: Math.floor((new Date(item.deadline_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        category: item.category,
      }))

      setDashboardData({
        revenue,
        expenses,
        profit,
        prevRevenue,
        prevExpenses,
        prevProfit,
        quarterRevenue,
        quarterExpenses,
        quarterProfit,
        prevQuarterRevenue,
        prevQuarterExpenses,
        prevQuarterProfit,
        yearRevenue,
        yearExpenses,
        yearProfit,
        prevYearRevenue,
        prevYearExpenses,
        prevYearProfit,
        totalBalance,
        runwayMonths,
        runwayDays,
        loanOutstanding,
        nextEmiDate,
        nextEmiAmount,
        repaymentProgress,
        cashFlowData,
        pendingReceivables,
        pendingInvoiceCount,
        overdueInvoiceCount,
        highExpenseAlerts,
        unallocatedCash,
        upcomingCompliance,
      })

      setLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [hasInitialAmount])

  // Refetch data when page becomes visible (returns from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  useEffect(() => {
    const checkInitialAmount = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data, error } = await supabase
          .from("user_settings")
          .select("initial_amount")
          .eq("user_id", user.id)
          .single()

        if (error || !data || data.initial_amount === null) {
          setHasInitialAmount(false)
          setShowInitialAmountModal(true)
        } else {
          setHasInitialAmount(true)
        }
      } catch (error) {
        console.error("[v0] Error checking initial amount:", error)
      }
    }

    checkInitialAmount()
  }, [])

  useEffect(() => {
    if (loading) return

    const metrics = [
      { value: dashboardData.revenue },
      { value: dashboardData.expenses },
      { value: dashboardData.profit },
      { value: dashboardData.runwayMonths },
    ]

    metrics.forEach((metric, index) => {
      let start = 0
      const end = typeof metric.value === "number" ? metric.value : 0
      const duration = 800
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setAnimatedValues((prev) => ({ ...prev, [index]: end }))
          clearInterval(timer)
        } else {
          setAnimatedValues((prev) => ({ ...prev, [index]: Math.floor(start) }))
        }
      }, 16)

      return () => clearInterval(timer)
    })
  }, [loading, dashboardData])

  const handleInitialAmountComplete = (amount: number) => {
    setShowInitialAmountModal(false)
    setHasInitialAmount(true)
    setInitialAmount(amount)
    toast({
      title: "Success!",
      description: "Your initial amount has been saved and Revenue Account created.",
    })
    router.refresh()
  }

  const handleSaveEstimatedExpense = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const amount = Number.parseFloat(estimatedExpenseInput)
      if (isNaN(amount) || amount < 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("user_settings")
        .update({ estimated_monthly_expense: amount })
        .eq("user_id", user.id)

      if (error) throw error

      setEstimatedMonthlyExpense(amount)
      setShowEstimatedExpenseDialog(false)
      setEstimatedExpenseInput("")
      toast({
        title: "Success!",
        description: "Estimated monthly expense updated successfully.",
      })

      window.location.reload()
    } catch (error) {
      console.error("[v0] Error saving estimated expense:", error)
      toast({
        title: "Error",
        description: "Failed to save estimated monthly expense.",
        variant: "destructive",
      })
    }
  }

  const metrics = [
    {
      title: "Revenue (MTD)",
      value: dashboardData.revenue,
      prevMonth: dashboardData.prevRevenue,
      trend:
        dashboardData.prevRevenue > 0
          ? `${(((dashboardData.revenue - dashboardData.prevRevenue) / dashboardData.prevRevenue) * 100).toFixed(1)}%`
          : "+0%",
      isPositive: dashboardData.revenue >= dashboardData.prevRevenue,
      color: "text-[#2E7D32]",
    },
    {
      title: "Expenses (MTD)",
      value: dashboardData.expenses,
      prevMonth: dashboardData.prevExpenses,
      trend:
        dashboardData.prevExpenses > 0
          ? `${(((dashboardData.expenses - dashboardData.prevExpenses) / dashboardData.prevExpenses) * 100).toFixed(1)}%`
          : "+0%",
      isPositive: dashboardData.expenses <= dashboardData.prevExpenses,
      color: "text-[#F57C00]",
    },
    {
      title: "Profit (MTD)",
      value: dashboardData.profit,
      prevMonth: dashboardData.prevProfit,
      trend:
        dashboardData.prevProfit !== 0
          ? `${(((dashboardData.profit - dashboardData.prevProfit) / Math.abs(dashboardData.prevProfit)) * 100).toFixed(1)}%`
          : "+0%",
      isPositive: dashboardData.profit >= dashboardData.prevProfit,
      color: "text-[#1565C0]",
    },
    {
      title: "Runway",
      value: dashboardData.runwayMonths,
      display: `${Math.round(dashboardData.runwayMonths)} months`,
      prevMonth: 0,
      prevDisplay: "",
      trend: "+0%",
      isPositive: true,
      color: "text-blue-600",
      subtitle: `${dashboardData.runwayDays} days`,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">Loading dashboard...</div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <InitialAmountModal open={showInitialAmountModal} onComplete={handleInitialAmountComplete} />

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header Section with Toggle */}
        <div className="space-y-4">
          <div className="space-y-1 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground">Welcome back, Rajesh</h2>
            <p className="text-muted-foreground">Let's see how your business is flowing.</p>
          </div>
          
          {/* View Toggle - Only show when page is loaded */}
          {isLoaded && (
            <div className="flex justify-end">
              <DashboardViewToggle currentView={view} onViewChange={updateView} />
            </div>
          )}
        </div>

        {/* Initial Amount Setup Alert */}
        {hasInitialAmount === false && !showInitialAmountModal && (
          <Card className="shadow-md bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Set Your Initial Amount</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      Add your starting business amount to begin tracking your finances.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowInitialAmountModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Add Initial Amount
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conditional View Rendering */}
        {view === "owner" && isLoaded ? (
          <OwnerDashboardLayout dashboardData={dashboardData} />
        ) : isLoaded ? (
          <AccountantDashboardLayout
            dashboardData={dashboardData}
            onEstimatedExpenseClick={() => setShowEstimatedExpenseDialog(true)}
          />
        ) : null}
      </main>

      <Dialog open={showEstimatedExpenseDialog} onOpenChange={setShowEstimatedExpenseDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shadow-sm bg-transparent"
            onClick={() => setEstimatedExpenseInput(estimatedMonthlyExpense.toString())}
          >
            {estimatedMonthlyExpense > 0 ? "Update" : "Set"} Expense
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Estimated Monthly Expense</DialogTitle>
            <DialogDescription>
              Set your estimated monthly expense to calculate accurate runway.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="estimated-expense">Amount (₹)</Label>
              <Input
                id="estimated-expense"
                type="number"
                placeholder="Enter estimated monthly expense"
                value={estimatedExpenseInput}
                onChange={(e) => setEstimatedExpenseInput(e.target.value)}
              />
              {estimatedMonthlyExpense > 0 && (
                <p className="text-sm text-muted-foreground">
                  Current: ₹{estimatedMonthlyExpense.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEstimatedExpenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEstimatedExpense}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FinancialOverview and detailed metrics - Only show in Accountant view */}
      {view === "accountant" && (
        <>
          <FinancialOverview 
            mtdData={{
              revenue: dashboardData.revenue,
              expenses: dashboardData.expenses,
              profit: dashboardData.profit,
              prevRevenue: dashboardData.prevRevenue,
              prevExpenses: dashboardData.prevExpenses,
              prevProfit: dashboardData.prevProfit,
            }}
            quarterData={{
              revenue: dashboardData.quarterRevenue,
              expenses: dashboardData.quarterExpenses,
              profit: dashboardData.quarterProfit,
              prevRevenue: dashboardData.prevQuarterRevenue,
              prevExpenses: dashboardData.prevQuarterExpenses,
              prevProfit: dashboardData.prevQuarterProfit,
            }}
            yearData={{
              revenue: dashboardData.yearRevenue,
              expenses: dashboardData.yearExpenses,
              profit: dashboardData.yearProfit,
              prevRevenue: dashboardData.prevYearRevenue,
              prevExpenses: dashboardData.prevYearExpenses,
              prevProfit: dashboardData.prevYearProfit,
            }}
          />

          <TooltipProvider>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <UITooltip key={metric.title}>
                  <TooltipTrigger asChild>
                    <Card
                      className="animate-fade-slide-up hover:shadow-lg transition-all duration-150 cursor-pointer"
                      style={{
                        animationDelay: `${(index + 1) * 100}ms`,
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className={`text-[2.0625rem] font-bold ${metric.color} flex items-baseline gap-1`}>
                          {metric.title !== "Runway" && <span>₹</span>}
                          <span className="font-mono tabular-nums">
                            {metric.display || (animatedValues[index] || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {metric.subtitle && <p className="text-xs text-muted-foreground">{metric.subtitle}</p>}
                        <div className="flex items-center gap-1 text-sm">
                          {metric.isPositive ? (
                            <TrendingUp className="h-4 w-4 text-[#2E7D32]" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-[#F57C00]" />
                          )}
                          <span className={metric.isPositive ? "text-[#2E7D32]" : "text-[#F57C00]"}>{metric.trend}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      Current: {metric.display || `₹${metric.value.toLocaleString("en-IN")}`}
                      <br />
                      Previous: {metric.prevDisplay || `₹${metric.prevMonth?.toLocaleString("en-IN")}`}
                      {metric.title === "Runway" && (
                        <>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            Based on ₹{dashboardData.totalBalance.toLocaleString("en-IN")} total balance
                            <br />
                            {estimatedMonthlyExpense > 0
                              ? `Using estimated expense: ₹${estimatedMonthlyExpense.toLocaleString("en-IN")}/month`
                              : "Using MTD expenses (set estimated expense for accuracy)"}
                          </span>
                        </>
                      )}
                    </p>
                  </TooltipContent>
                </UITooltip>
              ))}
            </div>
          </TooltipProvider>
        </>
      )}

      {/* Integrated Insights section showing data from all modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Integrated Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">ABC Technologies</span>
                <span className="text-sm font-semibold text-primary">₹58,500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">XYZ Corp India</span>
                <span className="text-sm font-semibold text-primary">₹42,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">GHI Traders</span>
                <span className="text-sm font-semibold text-primary">₹32,000</span>
              </div>
              <Link href="/clients">
                <Button variant="link" className="w-full text-xs p-0 h-auto">
                  View all customers →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Payroll Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Total Employees</span>
                <span className="text-sm font-semibold text-primary">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Monthly Payroll</span>
                <span className="text-sm font-semibold text-primary">₹8.5L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Pending Payments</span>
                <span className="text-sm font-semibold text-orange-600">3</span>
              </div>
              <Link href="/payroll">
                <Button variant="link" className="w-full text-xs p-0 h-auto">
                  Manage payroll →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Compliance Due
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">GSTR-1</span>
                <span className="text-xs text-orange-600 font-medium">Due in 5 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">GSTR-3B</span>
                <span className="text-xs text-orange-600 font-medium">Due in 14 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">TDS Return</span>
                <span className="text-xs text-green-600 font-medium">Filed</span>
              </div>
              <Link href="/compliance">
                <Button variant="link" className="w-full text-xs p-0 h-auto">
                  View compliance →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
