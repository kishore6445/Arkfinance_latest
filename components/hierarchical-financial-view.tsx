"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Wallet } from "lucide-react"
import Link from "next/link"

interface BucketAllocation {
  bucketName: string
  percentage: number
  amount: number
}

interface BankAccountHierarchy {
  bankId: string
  bankName: string
  accountName: string
  balance: number
  buckets: BucketAllocation[]
}

interface HierarchicalFinancialViewProps {
  totalBalance: number
  bankAccounts: BankAccountHierarchy[]
}

export function HierarchicalFinancialView({ totalBalance, bankAccounts }: HierarchicalFinancialViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Level Summary */}
      <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Balance Across All Accounts</p>
            <p className="text-4xl font-bold">₹{totalBalance.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Distributed across {bankAccounts.length} bank account{bankAccounts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts Hierarchy */}
      <div className="space-y-4">
        {bankAccounts.map((account) => (
          <Link key={account.bankId} href={`/accounts/banks/${account.bankId}`}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="pt-6 space-y-4">
                {/* Bank Account Header */}
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground">{account.bankName}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">₹{account.balance.toLocaleString("en-IN")}</p>
                </div>

                {/* Money Buckets in this Account */}
                {account.buckets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No money buckets allocated</p>
                ) : (
                  <div className="space-y-3">
                    {account.buckets.map((bucket, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{bucket.bucketName}</span>
                          </div>
                          <span className="text-sm font-semibold">{bucket.percentage}%</span>
                        </div>
                        <div className="ml-6 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${bucket.percentage}%` }} />
                          </div>
                          <span className="text-xs font-medium">₹{bucket.amount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Legend */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-semibold mb-2">Understanding the Hierarchy:</p>
            <ul className="space-y-1 ml-4">
              <li>• <span className="font-medium">Total Balance:</span> Sum of all bank account balances</li>
              <li>• <span className="font-medium">Bank Accounts:</span> Your physical bank accounts</li>
              <li>• <span className="font-medium">Money Buckets:</span> Logical divisions within each account</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
