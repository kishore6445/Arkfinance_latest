"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MetricCard {
  label: string
  value: number
  currency?: boolean
  trend?: {
    percentage: number
    isPositive: boolean
  }
}

interface DashboardData {
  revenue: number
  expenses: number
  profit: number
  prevRevenue: number
  prevExpenses: number
  prevProfit: number
  quarterRevenue: number
  quarterExpenses: number
  quarterProfit: number
  yearRevenue: number
  yearExpenses: number
  yearProfit: number
  totalBalance: number
  runwayMonths: number
  pendingReceivables: number
  pendingInvoiceCount: number
}

interface AccountantDashboardLayoutProps {
  dashboardData: DashboardData
  onEstimatedExpenseClick?: () => void
}

function formatIndianCurrency(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (absValue >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (absValue >= 1000) return `₹${(value / 1000).toFixed(2)}K`
  return `₹${value.toFixed(0)}`
}

export function AccountantDashboardLayout({ dashboardData, onEstimatedExpenseClick }: AccountantDashboardLayoutProps) {
  const [period, setPeriod] = useState<"mtd" | "qtd" | "ytd">("mtd")

  // Guard against undefined data
  if (!dashboardData) {
    return null
  }

  const data = dashboardData
  // Calculate month-on-month growth
  const mtdRevenueGrowth = data.prevRevenue > 0 ? ((data.revenue - data.prevRevenue) / data.prevRevenue) * 100 : 0
  const mtdExpenseGrowth = data.prevExpenses > 0 ? ((data.expenses - data.prevExpenses) / data.prevExpenses) * 100 : 0
  const mtdProfitGrowth = data.prevProfit > 0 ? ((data.profit - data.prevProfit) / data.prevProfit) * 100 : 0

  // Get data based on selected period
  const getPeriodMetrics = () => {
    switch (period) {
      case "qtd":
        return {
          revenue: data.quarterRevenue,
          expenses: data.quarterExpenses,
          profit: data.quarterProfit,
        }
      case "ytd":
        return {
          revenue: data.yearRevenue,
          expenses: data.yearExpenses,
          profit: data.yearProfit,
        }
      case "mtd":
      default:
        return {
          revenue: data.revenue,
          expenses: data.expenses,
          profit: data.profit,
        }
    }
  }

  const metrics = getPeriodMetrics()
  const profitMargin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0
  const expenseRatio = metrics.revenue > 0 ? (metrics.expenses / metrics.revenue) * 100 : 0

  return (
    <div className="space-y-6 pb-20">
      {/* Period Selector */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as "mtd" | "qtd" | "ytd")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mtd">Month to Date</TabsTrigger>
            <TabsTrigger value="qtd">Quarter to Date</TabsTrigger>
            <TabsTrigger value="ytd">Year to Date</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Revenue */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-blue-900">{formatIndianCurrency(metrics.revenue)}</p>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={mtdRevenueGrowth >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {mtdRevenueGrowth >= 0 ? "+" : ""}
                        {mtdRevenueGrowth.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-600">vs last period</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-50 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-orange-900">{formatIndianCurrency(metrics.expenses)}</p>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={mtdExpenseGrowth <= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {mtdExpenseGrowth >= 0 ? "+" : ""}
                        {mtdExpenseGrowth.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-600">vs last period</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profit */}
              <Card className={`bg-gradient-to-br border-2 ${metrics.profit >= 0 ? "from-green-50 to-green-50 border-green-200" : "from-red-50 to-red-50 border-red-200"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className={`text-2xl font-bold ${metrics.profit >= 0 ? "text-green-900" : "text-red-900"}`}>
                      {formatIndianCurrency(metrics.profit)}
                    </p>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={mtdProfitGrowth >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {mtdProfitGrowth >= 0 ? "+" : ""}
                        {mtdProfitGrowth.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-600">vs last period</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profit Margin */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-purple-900">{profitMargin.toFixed(1)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${profitMargin >= 20 ? "bg-green-500" : profitMargin >= 10 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(profitMargin * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Expense Ratio */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
                  <CardDescription>{(expenseRatio).toFixed(1)}% of revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${expenseRatio <= 50 ? "bg-green-500" : expenseRatio <= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pending Receivables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Pending Receivables</CardTitle>
                  <CardDescription>{data.pendingInvoiceCount} invoices pending</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{formatIndianCurrency(data.pendingReceivables)}</p>
                </CardContent>
              </Card>

              {/* Cash Runway */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
                  <CardDescription>At current burn rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${data.runwayMonths >= 3 ? "text-green-600" : data.runwayMonths >= 1 ? "text-yellow-600" : "text-red-600"}`}>
                    {data.runwayMonths.toFixed(1)}m
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
