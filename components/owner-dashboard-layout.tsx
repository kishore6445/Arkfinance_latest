"use client"

import { AlertCircle, Plus, FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"

interface DashboardData {
  revenue: number
  expenses: number
  profit: number
  totalBalance: number
  runwayMonths: number
  pendingReceivables: number
  pendingInvoiceCount: number
  overdueInvoiceCount: number
  highExpenseAlerts: Array<{ category: string; amount: number; percentageChange: number }>
  unallocatedCash: number
  upcomingCompliance: Array<{ title: string; daysUntil: number; category: string }>
  prevRevenue: number
  prevExpenses: number
}

interface OwnerDashboardLayoutProps {
  dashboardData: DashboardData
  onViewDetails?: (section: string) => void
}

function formatIndianCurrency(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (absValue >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (absValue >= 1000) return `₹${(value / 1000).toFixed(2)}K`
  return `₹${value.toFixed(0)}`
}

export function OwnerDashboardLayout({ dashboardData, onViewDetails }: OwnerDashboardLayoutProps) {
  const [showCompliance, setShowCompliance] = useState(false)
  const [expandedSnapshot, setExpandedSnapshot] = useState(false)

  // Guard against undefined data
  if (!dashboardData) {
    return null
  }

  // SECTION 1: CEO Summary - 3 cards only with vibrant gradients
  const summaryCards = [
    {
      label: "Cash Balance",
      value: formatIndianCurrency(dashboardData.totalBalance),
      gradient: "bg-gradient-to-br from-blue-50 to-blue-50 border-blue-200",
      textColor: "text-blue-900",
    },
    {
      label: "This Month Revenue",
      value: formatIndianCurrency(dashboardData.revenue),
      gradient: dashboardData.revenue >= 0 ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200",
      textColor: dashboardData.revenue >= 0 ? "text-green-900" : "text-red-900",
    },
    {
      label: "Runway",
      value: `${dashboardData.runwayMonths.toFixed(1)} months`,
      gradient: dashboardData.runwayMonths < 1 ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200" : dashboardData.runwayMonths < 3 ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200" : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
      textColor: dashboardData.runwayMonths < 1 ? "text-red-900" : dashboardData.runwayMonths < 3 ? "text-yellow-900" : "text-green-900",
    },
  ]

  // SECTION 2: Action Required Today - max 2 items
  const actionItems = []

  if (dashboardData.overdueInvoiceCount > 0) {
    actionItems.push({
      title: `${dashboardData.overdueInvoiceCount} Overdue Invoice${dashboardData.overdueInvoiceCount > 1 ? "s" : ""}`,
      action: "Collect",
      href: "/invoices",
    })
  }

  if (dashboardData.unallocatedCash > 0) {
    actionItems.push({
      title: `${formatIndianCurrency(dashboardData.unallocatedCash)} Pending Allocation`,
      action: "Allocate",
      href: "/accounts",
    })
  }

  // SECTION 5: Next compliance deadline
  const nextCompliance = dashboardData.upcomingCompliance?.[0]
  const complianceText = nextCompliance ? `Next compliance due in ${nextCompliance.daysUntil} days` : null

  return (
    <div className="space-y-6 pb-20">
      {/* SECTION 1: CEO Summary - Vibrant gradient cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`shadow-sm border-2 rounded-2xl ${card.gradient}`}>
            <CardContent className="pt-6 pb-4">
              <p className="text-sm text-gray-600 mb-2">{card.label}</p>
              <p className={`text-3xl font-bold ${card.textColor}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECTION 2: Action Required Today */}
      {actionItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Action Required Today</h3>
          <div className="space-y-2">
            {actionItems.slice(0, 2).map((item, idx) => (
              <Link key={idx} href={item.href}>
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <Button size="sm" variant="outline" className="bg-transparent">
                    {item.action}
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: This Month Snapshot - Collapsible with vibrant sub-cards */}
      <div className="border rounded-lg">
        <button
          onClick={() => setExpandedSnapshot(!expandedSnapshot)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-foreground">This Month Snapshot</h3>
          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${expandedSnapshot ? "rotate-180" : ""}`} />
        </button>

        {expandedSnapshot && (
          <div className="px-4 pb-4 border-t space-y-3">
            {/* Revenue Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900">Revenue</span>
                  <span className="font-bold text-green-900 text-lg">{formatIndianCurrency(dashboardData.revenue)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-yellow-900">Expenses</span>
                  <span className="font-bold text-yellow-900 text-lg">{formatIndianCurrency(dashboardData.expenses)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Profit Card */}
            <Card className={`border-2 rounded-2xl ${dashboardData.profit >= 0 ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${dashboardData.profit >= 0 ? "text-green-900" : "text-red-900"}`}>Profit</span>
                  <span className={`font-bold text-lg ${dashboardData.profit >= 0 ? "text-green-900" : "text-red-900"}`}>
                    {formatIndianCurrency(dashboardData.profit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* SECTION 4: Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/transactions/new">
          <Button className="w-full bg-transparent" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </Link>
        <Link href="/reports">
          <Button className="w-full bg-transparent" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </Link>
      </div>

      {/* SECTION 5: Compliance */}
      {complianceText && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowCompliance(!showCompliance)}
            className="flex items-center justify-between w-full text-left p-3 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <p className="text-sm font-medium text-foreground">{complianceText}</p>
            <ChevronDown className={`h-4 w-4 transition-transform ${showCompliance ? "rotate-180" : ""}`} />
          </button>

          {showCompliance && dashboardData.upcomingCompliance && (
            <div className="mt-3 pl-3 space-y-2 border-l-2 border-muted">
              {dashboardData.upcomingCompliance.map((item, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category.toUpperCase()} - Due in {item.daysUntil} days</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
