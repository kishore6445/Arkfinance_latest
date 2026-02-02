"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

type Account = {
  id: string
  name: string
  color: string
  text_color: string
  balance: number
}

type BankAccount = {
  id: string
  account_name: string
  bank_name: string
  balance: number
}

type BucketBankMapping = {
  id: string
  account_id: string
  bank_account_id: string
  percentage: number
  allocated_amount: number
  account_name: string
  bank_name: string
  color: string
  text_color: string
}

export function BucketAllocationMapper({ bucketId, bucketName, bucketColor, bucketTextColor }: { bucketId: string; bucketName: string; bucketColor: string; bucketTextColor: string }) {
  const [mappings, setMappings] = useState<BucketBankMapping[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    bank_account_id: "",
    percentage: "",
  })
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [bucketId])

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Fetch bank accounts
    const { data: banks } = await supabase.from("bank_accounts").select("*").eq("user_id", user.id)
    setBankAccounts(banks || [])

    // Fetch mappings for this bucket
    const { data: mappingData } = await supabase
      .from("bucket_bank_mappings")
      .select("*")
      .eq("account_id", bucketId)
      .eq("user_id", user.id)

    setMappings((mappingData || []) as BucketBankMapping[])
  }

  const handleAddMapping = async () => {
    if (!formData.bank_account_id || !formData.percentage) {
      toast({
        title: "Error",
        description: "Please select a bank account and enter percentage",
        variant: "destructive",
      })
      return
    }

    const percentage = parseFloat(formData.percentage)
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: "Error",
        description: "Percentage must be between 1 and 100",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("bucket_bank_mappings").insert([
      {
        user_id: user.id,
        account_id: bucketId,
        bank_account_id: formData.bank_account_id,
        percentage: percentage,
        allocated_amount: 0,
      },
    ])

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Allocation added successfully",
      })
      setFormData({ bank_account_id: "", percentage: "" })
      setIsOpen(false)
      fetchData()
    }
    setIsLoading(false)
  }

  const handleDeleteMapping = async (id: string) => {
    const { error } = await supabase.from("bucket_bank_mappings").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Allocation removed",
      })
      fetchData()
    }
  }

  const totalPercentage = mappings.reduce((sum, m) => sum + m.percentage, 0)

  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate {bucketName} to Bank Accounts</DialogTitle>
          <DialogDescription>Define what percentage of this bucket flows to each bank account</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {mappings.length > 0 && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Allocation Distribution</span>
                  <span className={totalPercentage === 100 ? "text-green-600" : "text-amber-600"}>{totalPercentage}%</span>
                </div>
                <Progress value={totalPercentage} className="h-2" />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{mapping.bank_name}</p>
                      <p className="text-xs text-muted-foreground">{mapping.account_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{mapping.percentage}%</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mappings.length === 0 && (
            <div className="text-center py-8 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No bank accounts allocated yet</p>
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-sm">Add Allocation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankSelect">Bank Account</Label>
                <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.account_name} ({bank.bank_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g., 50"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddMapping} disabled={isLoading} className="w-full">
              {isLoading ? "Adding..." : "Add Allocation"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
