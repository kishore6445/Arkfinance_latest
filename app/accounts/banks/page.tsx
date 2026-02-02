"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Plus, Trash2, Edit2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { BankAllocationCard } from "@/components/bank-allocation-card"

interface BankAccount {
  id: string
  accountName: string
  bankName: string
  accountNumber: string
  accountType: "Current" | "Savings" | "Business"
  currentBalance: number
  allocations: Array<{
    bucketName: string
    percentage: number
    amount: number
    color: string
  }>
}

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      accountName: "Main Business",
      bankName: "HDFC Bank",
      accountNumber: "****3456",
      accountType: "Current",
      currentBalance: 500000,
      allocations: [
        { bucketName: "Operating", percentage: 40, amount: 200000, color: "bg-blue-500" },
        { bucketName: "Profit", percentage: 30, amount: 150000, color: "bg-green-500" },
        { bucketName: "Emergency", percentage: 30, amount: 150000, color: "bg-red-500" },
      ],
    },
  ])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    accountType: "Savings" as "Current" | "Savings" | "Business",
    currentBalance: "",
  })

  const handleAddAccount = () => {
    if (!formData.accountName || !formData.bankName) return

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...formData,
      currentBalance: Number(formData.currentBalance) || 0,
      allocations: [],
    }

    setBankAccounts([...bankAccounts, newAccount])
    setFormData({
      accountName: "",
      bankName: "",
      accountNumber: "",
      accountType: "Savings",
      currentBalance: "",
    })
    setIsAddOpen(false)
  }

  const deleteAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter((acc) => acc.id !== id))
  }

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Bank & Cash Accounts</h1>
          <p className="text-muted-foreground">
            Manage your physical bank accounts and see how they align with your money buckets
          </p>
        </div>

        {/* Total Balance Summary */}
        <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total in All Accounts</p>
                <p className="text-3xl font-bold">₹{totalBalance.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Accounts</p>
                <p className="text-3xl font-bold">{bankAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Account Dialog */}
        <div className="flex justify-end">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Bank Account</DialogTitle>
                <DialogDescription>Connect a physical bank account to track money buckets</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    placeholder="e.g., Main Business Account"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    placeholder="e.g., HDFC Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Account Type</Label>
                    <Select value={formData.accountType} onValueChange={(value: any) => setFormData({ ...formData, accountType: value })}>
                      <SelectTrigger id="account-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current">Current</SelectItem>
                        <SelectItem value="Savings">Savings</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number (Last 4)</Label>
                    <Input
                      id="account-number"
                      placeholder="3456"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Current Balance (₹)</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="0"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccount}>Add Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bank Accounts List */}
        <div className="space-y-4">
          {bankAccounts.length === 0 ? (
            <Card>
              <CardContent className="pt-12 text-center space-y-4">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold">No Bank Accounts Added</h3>
                  <p className="text-sm text-muted-foreground">Add your bank accounts to start organizing money buckets</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{account.accountName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {account.accountType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{account.bankName} • ****{account.accountNumber}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm text-muted-foreground mb-1">Balance</p>
                      <p className="text-xl font-bold">₹{account.currentBalance.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/accounts/banks/${account.id}`}>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAccount(account.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <BankAllocationCard
                    bankName={account.bankName}
                    accountName={account.accountName}
                    balance={account.currentBalance}
                    allocation={account.allocations}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Tip:</span> Once you add bank accounts, go to each Money Bucket to define
              which accounts hold those funds. This helps you understand your financial structure at a glance.
            </p>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  )
}
