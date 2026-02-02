"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Building2, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"
import { BankBucketMapping } from "@/components/bank-bucket-mapping"

// Mock money buckets
const mockBuckets = [
  { id: "1", name: "Operating" },
  { id: "2", name: "Profit" },
  { id: "3", name: "Tax" },
  { id: "4", name: "Salary" },
  { id: "5", name: "Emergency" },
  { id: "6", name: "Growth" },
]

export default function BankAccountDetailPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [accountData, setAccountData] = useState({
    accountName: "Main Business Account",
    bankName: "HDFC Bank",
    accountNumber: "1234567890",
    accountType: "Current",
    currentBalance: "500000",
    lastUpdated: "2025-01-19",
  })

  const [mappings, setMappings] = useState([
    { bucketId: "1", bucketName: "Operating", percentage: 40 },
    { bucketId: "2", bucketName: "Profit", percentage: 30 },
    { bucketId: "5", bucketName: "Emergency", percentage: 30 },
  ])

  const handleSaveMappings = (newMappings: any[]) => {
    setMappings(newMappings)
  }

  const handleUpdateBalance = () => {
    setAccountData({ ...accountData, lastUpdated: new Date().toISOString().split("T")[0] })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <Link href="/accounts/banks">
          <Button variant="ghost" className="gap-2 -ml-2 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Bank Accounts
          </Button>
        </Link>

        {/* Account Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{accountData.accountName}</h1>
                <p className="text-muted-foreground">{accountData.bankName}</p>
              </div>
            </div>
            <Badge variant="outline">{accountData.accountType}</Badge>
          </div>

          {/* Account Details Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Account Number</Label>
                  <p className="text-lg font-semibold">****{accountData.accountNumber.slice(-4)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Account Type</Label>
                  <p className="text-lg font-semibold">{accountData.accountType}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Balance</Label>
                    <p className="text-2xl font-bold">₹{Number(accountData.currentBalance).toLocaleString("en-IN")}</p>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Update Balance
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={accountData.currentBalance}
                        onChange={(e) => setAccountData({ ...accountData, currentBalance: e.target.value })}
                        className="w-40"
                      />
                      <Button onClick={handleUpdateBalance} size="sm">
                        Save
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last updated: {accountData.lastUpdated}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bucket Mapping Section */}
        <BankBucketMapping
          bankAccountId="1"
          bankAccountName={accountData.accountName}
          availableBuckets={mockBuckets}
          currentMappings={mappings}
          onSave={handleSaveMappings}
        />

        {/* Breakdown Summary */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Money Bucket Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mappings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No money buckets allocated yet</p>
            ) : (
              <div className="space-y-3">
                {mappings.map((mapping) => {
                  const amount = (Number(accountData.currentBalance) * mapping.percentage) / 100
                  return (
                    <div key={mapping.bucketId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{mapping.bucketName}</p>
                        <p className="text-xs text-muted-foreground">{mapping.percentage}% of account</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">{mapping.percentage}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  )
}
