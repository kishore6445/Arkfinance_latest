"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Plus, AlertCircle } from "lucide-react"
import Link from "next/link"

interface BankAllocation {
  bankId: string
  bankName: string
  accountName: string
  percentage: number
  amount: number
}

interface MoneyBucketBankAllocationProps {
  bucketName: string
  bucketBalance: number
  allocations: BankAllocation[]
  onConfigureClick: () => void
}

export function MoneyBucketBankAllocation({
  bucketName,
  bucketBalance,
  allocations,
  onConfigureClick,
}: MoneyBucketBankAllocationProps) {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.percentage, 0)

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{bucketName} - Bank Allocation</CardTitle>
            <CardDescription>See which bank accounts hold this money bucket</CardDescription>
          </div>
          <Button onClick={onConfigureClick} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Configure
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {allocations.length === 0 ? (
          <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Not allocated to any bank account yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Configure" to assign this money bucket to bank accounts.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {allocations.map((allocation) => (
              <Link key={allocation.bankId} href={`/accounts/banks/${allocation.bankId}`}>
                <div className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{allocation.accountName}</span>
                      <span className="text-xs text-muted-foreground">{allocation.bankName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {allocation.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${allocation.percentage}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ₹{allocation.amount.toLocaleString("en-IN")} allocated
                  </p>
                </div>
              </Link>
            ))}

            {totalAllocated < 100 && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-900 dark:text-yellow-100">
                  Only {totalAllocated}% of this bucket is currently allocated to bank accounts ({100 - totalAllocated}% unallocated)
                </p>
              </div>
            )}

            {totalAllocated === 100 && (
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-900 dark:text-green-100">✓ All funds allocated to bank accounts</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
