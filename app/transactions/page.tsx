"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Filter, Download, Calendar, ChevronDown, ChevronUp, Paperclip, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

export default function AllTransactionsPage() {
  const { toast } = useToast()
  const supabase = createBrowserClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("this-month")
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [isCAView, setIsCAView] = useState(false)
  const [accountingSubtypes, setAccountingSubtypes] = useState<any[]>([])
  const [paginatedTransactions, setPaginatedTransactions] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState<number>(0)

  useEffect(() => {
    fetchTransactions()
    fetchAccountingSubtypes()
  }, [])

  async function fetchAccountingSubtypes() {
    const { data, error } = await supabase
      .from("accounting_subtypes")
      .select("*, accounting_types(name)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (!error && data) {
      setAccountingSubtypes(data)
    }
  }

  async function fetchTransactions() {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching transactions:", error)
        toast({
          title: "Error",
          description: "Failed to load transactions.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccountingTypeChange = async (txnId: string, accountingType: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          accounting_type: accountingType,
          accounting_subtype: null,
          classification_status: accountingType ? "classified" : "recorded",
        })
        .eq("id", txnId)

      if (error) throw error

      setTransactions((prev) =>
        prev.map((txn) =>
          txn.id === txnId
            ? {
                ...txn,
                accounting_type: accountingType,
                accounting_subtype: null,
                classification_status: accountingType ? "classified" : "recorded",
              }
            : txn,
        ),
      )

      toast({
        title: "Saved",
      })
    } catch (error) {
      console.error("[v0] Error updating accounting type:", error)
      toast({
        title: "Error",
        description: "Failed to update accounting type.",
        variant: "destructive",
      })
    }
  }

  const handleAccountingSubtypeChange = async (txnId: string, subtypeId: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          accounting_subtype: subtypeId,
          classification_status: "classified",
        })
        .eq("id", txnId)

      if (error) throw error

      setTransactions((prev) =>
        prev.map((txn) =>
          txn.id === txnId ? { ...txn, accounting_subtype: subtypeId, classification_status: "classified" } : txn,
        ),
      )

      toast({
        title: "Saved",
      })
    } catch (error) {
      console.error("[v0] Error updating accounting subtype:", error)
      toast({
        title: "Error",
        description: "Failed to update accounting subtype.",
        variant: "destructive",
      })
    }
  }

  const handleNeedsInfo = async (txnId: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ classification_status: "needs_info" })
        .eq("id", txnId)

      if (error) throw error

      setTransactions((prev) =>
        prev.map((txn) => (txn.id === txnId ? { ...txn, classification_status: "needs_info" } : txn)),
      )

      toast({
        title: "Flagged",
        description: "Transaction marked as needing more information.",
      })
    } catch (error) {
      console.error("[v0] Error flagging transaction:", error)
    }
  }

  const normalizeUserType = (type: string) => {
    if (type === "debit" || type === "loan") return "expense"
    return type
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        searchQuery === "" ||
        (txn.title && txn.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (txn.notes && txn.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (txn.category && txn.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (txn.id && txn.id.toLowerCase().includes(searchQuery.toLowerCase()))

      const normalizedType = normalizeUserType(txn.type)
      const matchesType = filterType === "all" || normalizedType === filterType

      let matchesDate = true
      if (dateFilter === "this-week") {
        const today = new Date()
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        matchesDate = new Date(txn.date) >= startOfWeek && new Date(txn.date) <= endOfWeek
      } else if (dateFilter === "this-month") {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        matchesDate = new Date(txn.date) >= startOfMonth && new Date(txn.date) <= endOfMonth
      } else if (dateFilter === "this-quarter") {
        const today = new Date()
        const quarter = Math.floor((today.getMonth() + 3) / 3)
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3 - 3, 1)
        const endOfQuarter = new Date(today.getFullYear(), quarter * 3, 0)
        matchesDate = new Date(txn.date) >= startOfQuarter && new Date(txn.date) <= endOfQuarter
      } else if (dateFilter === "this-year") {
        const today = new Date()
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        const endOfYear = new Date(today.getFullYear(), 11, 31)
        matchesDate = new Date(txn.date) >= startOfYear && new Date(txn.date) <= endOfYear
      } else if (dateFilter === "custom") {
        matchesDate =
          customStartDate === "" ||
          customEndDate === "" ||
          (new Date(txn.date) >= new Date(customStartDate) && new Date(txn.date) <= new Date(customEndDate))
      }

      return matchesSearch && matchesType && matchesDate
    })
  }, [transactions, searchQuery, filterType, dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage
    const end = start + rowsPerPage
    setPaginatedTransactions(filteredTransactions.slice(start, end))
    setTotalPages(Math.ceil(filteredTransactions.length / rowsPerPage))
  }, [filteredTransactions, currentPage, rowsPerPage])

  const handleExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Your transactions are being exported as ${format.toUpperCase()}. This will download shortly.`,
    })
  }

  const getStatusBadge = (txn: any) => {
    const status = txn.classification_status || (txn.accounting_type ? "classified" : "recorded")

    if (status === "classified") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Classified
        </Badge>
      )
    } else if (status === "needs_info") {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Needs Info
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Recorded
        </Badge>
      )
    }
  }

  const getSubtypesForType = (accountingType: string) => {
    if (!accountingType) return []

    // Map accounting type values to type names for filtering
    const typeMapping: Record<string, string> = {
      expense_pl: "Expense",
      revenue_pl: "Revenue",
      asset_bs: "Asset",
      liability_bs: "Liability",
    }

    const typeName = typeMapping[accountingType]
    return accountingSubtypes.filter((st: any) => st.accounting_types?.name === typeName)
  }

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateRunningBalance = () => {
    let balance = 0
    return paginatedTransactions.map((txn: any) => {
      if (txn.type === "revenue" || txn.type === "credit") {
        balance += Number(txn.amount)
      } else {
        balance -= Number(txn.amount)
      }
      return { ...txn, runningBalance: balance }
    })
  }

  const transactionsWithBalance = calculateRunningBalance()

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete ledger of all your money movements</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isCAView ? "default" : "outline"}
              size="sm"
              onClick={() => setIsCAView(!isCAView)}
              className={`rounded-lg font-semibold transition-all ${
                isCAView 
                  ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700" 
                  : "border-2 hover:bg-indigo-50"
              }`}
            >
              {isCAView ? "🧮 CA View Active" : "CA View"}
            </Button>
            <Link href="/transactions/new">
              <Button className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </Link>
          </div>
        </div>

        {/* Date Filter Pills */}
        <Card className="p-4" style={{ borderRadius: "12px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)" }}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["this-week", "this-month", "this-quarter", "this-year", "custom"].map((filter) => (
                <Button
                  key={filter}
                  variant={dateFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDateFilter(filter)
                    setShowCustomDatePicker(filter === "custom")
                  }}
                  className="rounded-full transition-all duration-150"
                >
                  {filter === "this-week" && "This Week"}
                  {filter === "this-month" && "This Month"}
                  {filter === "this-quarter" && "This Quarter"}
                  {filter === "this-year" && "This Year"}
                  {filter === "custom" && (
                    <>
                      <Calendar className="h-3 w-3 mr-1" />
                      Custom
                    </>
                  )}
                </Button>
              ))}
            </div>

            {showCustomDatePicker && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">From:</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">To:</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Search and Filters */}
        <Card className="p-4" style={{ borderRadius: "12px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)" }}>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, category, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-lg"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-11 px-4 rounded-lg border-2"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => handleExport("csv")} className="h-11 px-4 rounded-lg border-2">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {showFilters && (
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">User Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-9 rounded-lg border bg-background px-3 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)" }}>
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-foreground">Date</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-foreground">Description</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-foreground">User Type</th>
                      <th className="text-left px-4 py-4 text-xs font-semibold text-foreground">Category</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-foreground">Amount</th>
                      <th className="text-right px-4 py-4 text-xs font-semibold text-foreground">Running Balance</th>
                      <th className="text-center px-4 py-4 text-xs font-semibold text-foreground">Attachment</th>
                      <th className="text-center px-4 py-4 text-xs font-semibold text-foreground">Status</th>
                      {isCAView && (
                        <>
                          <th className="text-left px-4 py-4 text-xs font-semibold text-foreground bg-indigo-50/70">
                            Accounting Type
                          </th>
                          <th className="text-left px-4 py-4 text-xs font-semibold text-foreground bg-indigo-50/70">
                            Subtype
                          </th>
                        </>
                      )}
                      <th className="text-center px-4 py-4 text-xs font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactionsWithBalance.map((txn, index) => {
                      const normalizedType = normalizeUserType(txn.type)
                      const isExpanded = expandedRow === txn.id

                      return (
                        <React.Fragment key={txn.id}>
                          <tr
                            className="hover:bg-muted/30 transition-colors"
                            style={{
                              animation: `fadeInUp 150ms ease-out ${index * 50}ms both`,
                            }}
                          >
                            <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(txn.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div>
                                <p className="font-medium text-foreground">{txn.title}</p>
                                {txn.notes && <p className="text-xs text-muted-foreground mt-0.5">{txn.notes}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  normalizedType === "revenue"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {normalizedType}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-foreground">{txn.category || "—"}</td>
                            <td
                              className={`px-4 py-4 text-sm font-semibold text-right tabular-nums ${
                                normalizedType === "revenue" ? "text-green-600" : "text-orange-600"
                              }`}
                            >
                              {formatIndianCurrency(txn.amount)}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-right tabular-nums text-blue-600">
                              {formatIndianCurrency(txn.runningBalance)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {txn.bill_proof ? (
                                <Paperclip className="h-4 w-4 text-blue-600 mx-auto cursor-pointer" />
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">{getStatusBadge(txn)}</td>
                            {isCAView && (
                              <>
                                <td className="px-4 py-4 bg-indigo-50/70">
                                  <select
                                    value={txn.accounting_type || ""}
                                    onChange={(e) => handleAccountingTypeChange(txn.id, e.target.value)}
                                    className="w-full h-8 rounded-md border bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="">Select...</option>
                                    <option value="expense_pl">Expense (P&L)</option>
                                    <option value="revenue_pl">Revenue (P&L)</option>
                                    <option value="asset_bs">Asset (Balance Sheet)</option>
                                    <option value="liability_bs">Liability (Balance Sheet)</option>
                                  </select>
                                </td>
                                <td className="px-4 py-4 bg-indigo-50/70">
                                  <select
                                    value={txn.accounting_subtype || ""}
                                    onChange={(e) => handleAccountingSubtypeChange(txn.id, e.target.value)}
                                    disabled={!txn.accounting_type}
                                    className="w-full h-8 rounded-md border bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="">Select...</option>
                                    {getSubtypesForType(txn.accounting_type).map((st: any) => (
                                      <option key={st.id} value={st.id}>
                                        {st.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedRow(isExpanded ? null : txn.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={isCAView ? 10 : 8} className="px-4 py-4 bg-muted/20">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Full Notes</p>
                                    <p className="text-foreground">{txn.notes || "No notes available"}</p>
                                  </div>
                                  {txn.bill_proof && (
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium mb-1">Attachment</p>
                                      <p className="text-blue-600">View attachment</p>
                                    </div>
                                  )}
                                  {isCAView && txn.classification_status === "needs_info" && (
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium mb-1">CA Comment</p>
                                      <p className="text-foreground">
                                        {txn.ca_comment || "Needs additional information"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {isCAView && (
                                  <div className="mt-3 pt-3 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleNeedsInfo(txn.id)}
                                      className="h-8 text-xs"
                                    >
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Flag as Needs Info
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t p-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                    {Math.min(currentPage * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length}{" "}
                    transactions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
