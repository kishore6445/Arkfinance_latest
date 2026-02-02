"use client"

import { CardDescription } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Briefcase,
  TrendingUp,
  FileText,
  Users,
  Shield,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
  Building2,
  Plus,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankAccountManager } from "@/components/bank-account-manager"
import { useToast } from "@/hooks/use-toast"

const iconOptions = [
  { name: "Briefcase", icon: Briefcase },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "FileText", icon: FileText },
  { name: "Users", icon: Users },
  { name: "Shield", icon: Shield },
  { name: "Rocket", icon: Rocket },
]

const colorOptions = [
  { name: "Blue", color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400" },
  { name: "Green", color: "bg-green-500", textColor: "text-green-600 dark:text-green-400" },
  { name: "Orange", color: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400" },
  { name: "Purple", color: "bg-purple-500", textColor: "text-purple-600 dark:text-purple-400" },
  { name: "Red", color: "bg-[#E57373]", textColor: "text-[#E57373] dark:text-[#E57373]" },
  { name: "Indigo", color: "bg-indigo-500", textColor: "text-indigo-600 dark:text-indigo-400" },
]

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
  allocated_percentage?: number
  initial_amount?: number
  allocations: any[]
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [animatedBalances, setAnimatedBalances] = useState<Record<number, number>>({})
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("buckets")

  const [formData, setFormData] = useState({
    name: "",
    guidance: "",
    icon: "Briefcase",
    color: "bg-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
  })

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Fetch accounts without embedding allocations
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching accounts:", error)
      return
    }

    // Fetch allocations separately for each account
    const accountsWithAllocations = await Promise.all(
      (data || []).map(async (account: any) => {
        const { data: allocations } = await supabase
          .from("allocations")
          .select("percentage, allocated_amount")
          .eq("account_id", account.id)
          .eq("user_id", user.id)
          .single()

        return {
          ...account,
          allocations: allocations ? [allocations] : [],
        }
      }),
    )

    // Calculate balance for each account from transactions
    const accountsWithBalances = await Promise.all(
      (accountsWithAllocations || []).map(async (account: any) => {
        const isRevenueAccount = account.name === "Revenue Account"

        let calculatedBalance = account.balance || (isRevenueAccount ? account.initial_amount || 0 : 0)

        if (isRevenueAccount) {
          const { data: allTransactions } = await supabase
            .from("transactions")
            .select("amount, type")
            .eq("user_id", user.id)

          if (allTransactions) {
            allTransactions.forEach((txn: any) => {
              if (txn.type === "revenue") {
                calculatedBalance += txn.amount
              }
            })
          }

          const { data: allAllocations } = await supabase
            .from("allocations")
            .select("allocated_amount")
            .eq("user_id", user.id)

          if (allAllocations) {
            const totalAllocated = allAllocations.reduce((sum: number, allocation: any) => {
              return sum + (allocation.allocated_amount || 0)
            }, 0)
            calculatedBalance -= totalAllocated
          }
        } else {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount, type")
            .eq("account_id", account.id)

          if (transactions) {
            transactions.forEach((txn: any) => {
              if (txn.type === "revenue") {
                calculatedBalance += txn.amount
              } else {
                calculatedBalance -= txn.amount
              }
            })
          }
        }

        return {
          ...account,
          balance: calculatedBalance,
          allocated_percentage: account.allocations?.[0]?.percentage || 0,
          allocations: account.allocations || [],
        }
      }),
    )

    setAccounts(accountsWithBalances)
  }

  const handleCreateAccount = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const slug = formData.name.toLowerCase().replace(/\s+/g, "-")

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: formData.name,
      slug,
      icon: formData.icon,
      color: formData.color,
      text_color: formData.textColor,
      guidance: formData.guidance || null,
      balance: 0,
      percentage: 0,
    })

    setIsLoading(false)

    if (error) {
      console.error("Error creating account:", error)
      alert("Failed to create account. Please try again.")
      return
    }

    setFormData({
      name: "",
      guidance: "",
      icon: "Briefcase",
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    })
    setIsOpen(false)
    fetchAccounts()
  }

  useEffect(() => {
    accounts.forEach((account, index) => {
      let start = 0
      const end = account.balance
      const duration = 900
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setAnimatedBalances((prev) => ({ ...prev, [index]: end }))
          clearInterval(timer)
        } else {
          setAnimatedBalances((prev) => ({ ...prev, [index]: Math.floor(start) }))
        }
      }, 16)

      return () => clearInterval(timer)
    })
  }, [accounts])

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.name === iconName)
    return iconOption ? iconOption.icon : Briefcase
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Money Management</h2>
            <p className="text-muted-foreground leading-relaxed">
              {activeTab === "buckets"
                ? "See how income spreads across key accounts. These buckets help separate profit, tax, and salary so money is always clear."
                : "Manage your bank and cash accounts with allocation tracking."}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="buckets">Money Buckets</TabsTrigger>
              <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "buckets" && (
          <div className="flex justify-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Money Bucket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Money Bucket</DialogTitle>
                  <DialogDescription>Add a new money bucket to organize your finances.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Money Bucket Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Operating, Profit, Emergency"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guidance">Guidance (Optional)</Label>
                    <Textarea
                      id="guidance"
                      placeholder="Helpful tip or description for this account"
                      value={formData.guidance}
                      onChange={(e) => setFormData({ ...formData, guidance: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.name} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => {
                        const selected = colorOptions.find((c) => c.color === value)
                        if (selected) {
                          setFormData({ ...formData, color: value, textColor: selected.textColor })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.color} value={option.color}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${option.color}`} />
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAccount} disabled={isLoading || !formData.name.trim()}>
                    {isLoading ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "buckets" && (
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account, index) => {
                const Icon = getIconComponent(account.icon)
                const allocatedPercentage = account.allocated_percentage || 0
                const isLow = allocatedPercentage < 40
                const isRevenueAccount = account.name === "Revenue Account"

                return (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card
                      className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                      style={{
                        borderRadius: "16px",
                        animationDelay: `${index * 100}ms`,
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
                      }}
                    >
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${account.color} bg-opacity-10`}>
                              <Icon className={`h-6 w-6 ${account.text_color}`} />
                            </div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{account.name}</h3>
                              {account.guidance && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">{account.guidance}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          {!isRevenueAccount && (
                            <Badge variant={isLow ? "destructive" : "default"} className="rounded-full">
                              {isLow ? (
                                <AlertCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              {isLow ? "Low" : "On Track"}
                            </Badge>
                          )}
                        </div>

                        <div className={`text-3xl font-bold ${account.text_color} flex items-baseline gap-1`}>
                          <span>₹</span>
                          <span className="font-mono tabular-nums">
                            {(animatedBalances[index] || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {!isRevenueAccount && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Allocated</span>
                              <span className="font-semibold">{allocatedPercentage}%</span>
                            </div>
                            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`absolute top-0 left-0 h-full ${account.color} rounded-full transition-all duration-500`}
                                style={{ width: `${allocatedPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
                          <span>View details</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </TooltipProvider>
        )}

        {activeTab === "buckets" && (
          <Card
            className="shadow-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
            style={{ borderRadius: "16px" }}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                <strong>Note:</strong> These buckets help separate profit, tax, and salary so money is always clear.
                Review and adjust allocations monthly to maintain healthy cash flow.
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === "banks" && (
          <BankAccountManager />
        )}
      </main>

      <BottomNav />
    </div>
  )
}
