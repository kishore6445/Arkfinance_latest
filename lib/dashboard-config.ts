/**
 * Dashboard Configuration & Constants
 * Defines alert thresholds and business rules for the owner dashboard
 */

export const EXPENSE_ALERT_CONFIG = {
  // Percentage change threshold for expense alerts
  PERCENTAGE_CHANGE_THRESHOLD: 20, // Alert if expenses increase >20% from previous period
  
  // Budget exceeded threshold
  BUDGET_EXCEEDED_THRESHOLD: 10, // Alert if expenses exceed estimated by >10%
  
  // High expense amount threshold (absolute)
  HIGH_EXPENSE_AMOUNT: 50000, // Alert if single transaction >50k
}

export const CASH_FLOW_CONFIG = {
  // Runway thresholds for color coding
  RUNWAY_CRITICAL_THRESHOLD: 1, // < 1 month = critical (red)
  RUNWAY_WARNING_THRESHOLD: 3, // 1-3 months = warning (yellow)
  // >= 3 months = healthy (green)
  
  // Cash balance thresholds
  LOW_CASH_THRESHOLD: 10000, // Alert if cash < 10k
}

export const COMPLIANCE_CONFIG = {
  // Days before deadline to show reminder
  REMINDER_DAYS: 7,
  
  // Standard compliance dates (can be customized per user)
  COMPLIANCE_CATEGORIES: {
    GST: "gst",
    INCOME_TAX: "income_tax",
    AUDIT: "audit",
    FILING: "filing",
    OTHER: "other",
  },
}

export const INVOICE_CONFIG = {
  // Overdue invoice threshold (days)
  OVERDUE_DAYS_THRESHOLD: 0, // Any invoice past due date is overdue
  
  // Pending receivables alert threshold
  PENDING_RECEIVABLES_THRESHOLD: 100000, // Alert if pending > 1 lakh
}

export const ALLOCATION_CONFIG = {
  // Unallocated cash alert threshold
  UNALLOCATED_ALERT_THRESHOLD: 50000, // Alert if unallocated > 50k
}

/**
 * Calculate if a value requires an alert based on thresholds
 */
export const alertThresholds = {
  isHighExpense: (current: number, previous: number): boolean => {
    if (previous === 0) return false
    const changePercent = ((current - previous) / previous) * 100
    return changePercent > EXPENSE_ALERT_CONFIG.PERCENTAGE_CHANGE_THRESHOLD
  },

  isLowCash: (balance: number): boolean => {
    return balance < CASH_FLOW_CONFIG.LOW_CASH_THRESHOLD
  },

  isCriticalRunway: (months: number): boolean => {
    return months < CASH_FLOW_CONFIG.RUNWAY_CRITICAL_THRESHOLD
  },

  isLowRunway: (months: number): boolean => {
    return months >= CASH_FLOW_CONFIG.RUNWAY_CRITICAL_THRESHOLD && 
           months < CASH_FLOW_CONFIG.RUNWAY_WARNING_THRESHOLD
  },

  isPendingReceivablesHigh: (amount: number): boolean => {
    return amount > INVOICE_CONFIG.PENDING_RECEIVABLES_THRESHOLD
  },

  isUnallocatedCashHigh: (amount: number): boolean => {
    return amount > ALLOCATION_CONFIG.UNALLOCATED_ALERT_THRESHOLD
  },
}

/**
 * Get color indicator based on runway months
 */
export const getRunwayColor = (months: number): "red" | "yellow" | "green" => {
  if (months < CASH_FLOW_CONFIG.RUNWAY_CRITICAL_THRESHOLD) return "red"
  if (months < CASH_FLOW_CONFIG.RUNWAY_WARNING_THRESHOLD) return "yellow"
  return "green"
}

/**
 * Get status label for invoice
 */
export const getInvoiceStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
  }
  return statusMap[status] || "Unknown"
}
