"use client"

import React from "react"

import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface PrimaryMetricsCardProps {
  title: string
  value: number
  trend?: {
    percentage: number
    isPositive: boolean
  }
  unit?: string
  status?: "healthy" | "warning" | "critical"
  subtitle?: string
  icon?: React.ReactNode
}

export function PrimaryMetricsCard({
  title,
  value,
  trend,
  unit = "₹",
  status = "healthy",
  subtitle,
  icon,
}: PrimaryMetricsCardProps) {
  const statusColors = {
    healthy: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
    warning: "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200",
    critical: "bg-gradient-to-br from-red-50 to-rose-50 border-red-200",
  }

  const statusTextColors = {
    healthy: "text-green-900",
    warning: "text-yellow-900",
    critical: "text-red-900",
  }

  const statusBadgeColors = {
    healthy: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700",
  }

  const trendColor = trend?.isPositive
    ? "text-green-600"
    : status === "critical"
      ? "text-red-600"
      : "text-amber-600"

  return (
    <Card className={`p-8 border-2 rounded-3xl ${statusColors[status]} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="space-y-6">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>

        {/* Main value */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${statusTextColors[status]}`}>
              {unit}
              {(value / 100000).toFixed(1)}
            </span>
            <span className="text-lg text-gray-600">L</span>
          </div>

          {/* Trend indicator */}
          {trend && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${trendColor}`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold">{Math.abs(trend.percentage)}%</span>
              </div>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex gap-2">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColors[status]}`}>
            {status === "critical" && <AlertCircle className="h-3 w-3" />}
            <span className="capitalize">{status}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
