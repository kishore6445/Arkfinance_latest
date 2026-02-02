"use client"

import React from "react"

import { AlertCircle, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type AttentionItemType = "alert" | "pending" | "action" | "success"

interface AttentionItemProps {
  type: AttentionItemType
  title: string
  description: string
  value?: string | number
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  urgency?: "low" | "medium" | "high"
}

export function AttentionItem({
  type,
  title,
  description,
  value,
  actionLabel = "View",
  onAction,
  icon,
  urgency = "medium",
}: AttentionItemProps) {
  const typeStyles = {
    alert: {
      background: "bg-red-50 border-red-200",
      icon: "bg-red-100 text-red-600",
      title: "text-red-900",
      badge: "bg-red-100 text-red-700",
    },
    pending: {
      background: "bg-amber-50 border-amber-200",
      icon: "bg-amber-100 text-amber-600",
      title: "text-amber-900",
      badge: "bg-amber-100 text-amber-700",
    },
    action: {
      background: "bg-blue-50 border-blue-200",
      icon: "bg-blue-100 text-blue-600",
      title: "text-blue-900",
      badge: "bg-blue-100 text-blue-700",
    },
    success: {
      background: "bg-green-50 border-green-200",
      icon: "bg-green-100 text-green-600",
      title: "text-green-900",
      badge: "bg-green-100 text-green-700",
    },
  }

  const urgencyBadge = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-orange-100 text-orange-700",
    high: "bg-red-100 text-red-700",
  }

  const getIcon = () => {
    if (icon) return icon
    switch (type) {
      case "alert":
        return <AlertCircle className="h-5 w-5" />
      case "pending":
        return <Clock className="h-5 w-5" />
      case "action":
        return <TrendingUp className="h-5 w-5" />
      case "success":
        return <CheckCircle2 className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const styles = typeStyles[type]

  return (
    <Card className={`p-4 border-2 rounded-2xl ${styles.background} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`${styles.icon} p-2.5 rounded-lg flex-shrink-0 h-fit`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${styles.title} mb-1`}>{title}</h4>
          <p className="text-xs text-gray-600 mb-3">{description}</p>

          {/* Badges and value */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles.badge}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            {urgency !== "low" && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${urgencyBadge[urgency]}`}>
                {urgency === "high" ? "Urgent" : "Medium"}
              </span>
            )}
            {value && <span className="text-sm font-bold text-gray-900 ml-auto">{value}</span>}
          </div>
        </div>

        {/* Action button */}
        {actionLabel && onAction && (
          <div className="flex-shrink-0 flex items-end">
            <Button
              size="sm"
              variant="outline"
              onClick={onAction}
              className="text-xs bg-transparent hover:bg-white/50"
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
