"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Wallet, TrendingUp } from "lucide-react"

interface BankAllocationCardProps {
  bankName: string
  accountName: string
  balance: number
  allocation: Array<{
    bucketName: string
    percentage: number
    amount: number
    color: string
  }>
}

export function BankAllocationCard({ bankName, accountName, balance, allocation }: BankAllocationCardProps) {
  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{accountName}</CardTitle>
              <p className="text-xs text-muted-foreground">{bankName}</p>
            </div>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-2xl font-bold">₹{balance.toLocaleString("en-IN")}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Allocated Money Buckets</p>
          <div className="space-y-2">
            {allocation.map((bucket, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{bucket.bucketName}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{bucket.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${bucket.color}`} style={{ width: `${bucket.percentage}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">₹{bucket.amount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {allocation.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No money buckets allocated to this account yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
