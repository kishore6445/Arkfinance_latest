"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface InitialAmountModalProps {
  open: boolean
  onComplete: () => void
}

export function InitialAmountModal({ open, onComplete }: InitialAmountModalProps) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No user found")

      // Store initial amount in user_settings table
      const { error } = await supabase.from("user_settings").insert({
        user_id: user.id,
        initial_amount: Number.parseFloat(amount),
      })

      if (error) throw error

      const { error: accountError } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: "Revenue Account",
        slug: "revenue-account",
        balance: Number.parseFloat(amount),
        percentage: 0,
        icon: "Wallet",
        color: "bg-green-500",
        text_color: "text-green-600 dark:text-green-400",
        guidance: "Your main revenue account containing initial amount and all income",
      })

      if (accountError) throw accountError

      onComplete()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save initial amount",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Warrior Finance!</DialogTitle>
          <DialogDescription>
            Let's start by entering your initial business amount to track your finances.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initial-amount">Initial Amount (₹)</Label>
            <Input
              id="initial-amount"
              type="number"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Continue to Dashboard"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
