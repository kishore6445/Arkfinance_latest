"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type TimePeriod = "mtd" | "quarter" | "year"

interface FinancialMetrics {
  revenue: number
  expenses: number
  profit: number
  prevRevenue: number
  prevExpenses: number
  prevProfit: number
}

interface FinancialOverviewProps {
  mtdData: FinancialMetrics
  quarterData: FinancialMetrics
  yearData: FinancialMetrics
}

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

const MetricCard = ({ 
  label, 
  current, 
  previous, 
  isProfit = false 
}: { 
  label: string
  current: number
  previous: number
  isProfit?: boolean
}) => {
  const change = calculateChange(current, previous)
  const isPositive = isProfit ? change >= 0 : change >= 0
  const displayCurrent = current.toLocaleString("en-IN", { maximumFractionDigits: 0 })
  const displayPrevious = previous.toLocaleString("en-IN", { maximumFractionDigits: 0 })

  return (
    <div className="space-y-2 p-4 bg-card rounded-lg border border-border hover:border-foreground/20 transition-colors">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold tracking-tight">
          ₹{displayCurrent}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-semibold mb-1",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Prev: ₹{displayPrevious}
      </p>
    </div>
  )
}

const PeriodButton = ({ 
  period, 
  active, 
  onClick 
}: { 
  period: TimePeriod
  active: boolean
  onClick: () => void
}) => {
  const labels: Record<TimePeriod, string> = {
    mtd: "This Month",
    quarter: "This Quarter",
    year: "This Year",
  }

  return (
    <Button
      onClick={onClick}
      variant={active ? "default" : "outline"}
      size="sm"
      className="min-w-28"
    >
      {labels[period]}
    </Button>
  )
}

export function FinancialOverview({ mtdData, quarterData, yearData }: FinancialOverviewProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>("mtd")

  const periodMap: Record<TimePeriod, FinancialMetrics> = {
    mtd: mtdData,
    quarter: quarterData,
    year: yearData,
  }

  const data = periodMap[activePeriod]

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex gap-2 border-b border-border pb-4">
        <PeriodButton period="mtd" active={activePeriod === "mtd"} onClick={() => setActivePeriod("mtd")} />
        <PeriodButton period="quarter" active={activePeriod === "quarter"} onClick={() => setActivePeriod("quarter")} />
        <PeriodButton period="year" active={activePeriod === "year"} onClick={() => setActivePeriod("year")} />
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Revenue"
          current={data.revenue}
          previous={data.prevRevenue}
        />
        <MetricCard
          label="Expenses"
          current={data.expenses}
          previous={data.prevExpenses}
        />
        <MetricCard
          label="Net Profit"
          current={data.profit}
          previous={data.prevProfit}
          isProfit
        />
      </div>

      {/* Multi-Period Comparison Summary */}
      <Card className="bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="text-base">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* MTD Summary */}
            <div className="space-y-3 p-3 bg-background/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Month</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-semibold">₹{mtdData.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  <span className="font-semibold">₹{mtdData.expenses.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-px bg-border"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit</span>
                  <span className={cn(
                    "font-bold text-lg",
                    mtdData.profit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ₹{mtdData.profit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quarter Summary */}
            <div className="space-y-3 p-3 bg-background/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Quarter</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-semibold">₹{quarterData.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  <span className="font-semibold">₹{quarterData.expenses.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-px bg-border"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit</span>
                  <span className={cn(
                    "font-bold text-lg",
                    quarterData.profit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ₹{quarterData.profit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Year Summary */}
            <div className="space-y-3 p-3 bg-background/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Year</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-semibold">₹{yearData.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  <span className="font-semibold">₹{yearData.expenses.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-px bg-border"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit</span>
                  <span className={cn(
                    "font-bold text-lg",
                    yearData.profit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ₹{yearData.profit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
