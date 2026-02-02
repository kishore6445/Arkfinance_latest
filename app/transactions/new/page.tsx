"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Camera, Calendar, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const typeExplanations = {
  revenue: "Money coming into your business from sales and services.",
  expense: "Regular business costs like rent, salaries, and operations.",
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [type, setType] = useState<"revenue" | "expense">("revenue")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [loading, setLoading] = useState(false)
  const [allocationPreview, setAllocationPreview] = useState<
    Array<{ account_name: string; percentage: number; amount: number }>
  >([])
  const [willAutoAllocate, setWillAutoAllocate] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string>("")
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const { toast } = useToast()

  const availableCategories = categories.filter((cat) => cat.type === type)

  useEffect(() => {
    setCategoryId("")
  }, [type])

  useEffect(() => {
    async function fetchCategories() {
      try {
        debugger;
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          const categoriesArray = data.categories || []
          setCategories(categoriesArray)
          console.log("[v0] Fetched categories:", categoriesArray.length)
        }
      } catch (error) {
        console.error("[v0] Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchAllocationPreview() {
      if (type === "revenue" && amount && Number.parseFloat(amount) > 0 && !categoryId) {
        try {
          const response = await fetch("/api/allocation-settings")
          if (response.ok) {
            const data = await response.json()
            if (data.settings && data.settings.length > 0) {
              const preview = data.settings.map((setting: any) => ({
                account_name: setting.accounts.name,
                percentage: setting.percentage,
                amount: (Number.parseFloat(amount) * setting.percentage) / 100,
              }))
              setAllocationPreview(preview)
              setWillAutoAllocate(true)
            } else {
              setAllocationPreview([])
              setWillAutoAllocate(false)
            }
          }
        } catch (error) {
          console.error("[v0] Error fetching allocation preview:", error)
        }
      } else {
        setAllocationPreview([])
        setWillAutoAllocate(false)
      }
    }

    fetchAllocationPreview()
  }, [amount, type, categoryId])

  const isFormValid = description.trim() && amount && Number.parseFloat(amount) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let receiptUrl = ""

      // Upload receipt if present
      if (receiptFile) {
        setUploadingReceipt(true)
        const formData = new FormData()
        formData.append("file", receiptFile)

        try {
          const uploadResponse = await fetch("/api/upload-receipt", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload receipt")
          }

          const uploadedData = await uploadResponse.json()
          receiptUrl = uploadedData.url
          console.log("[v0] Receipt uploaded:", receiptUrl)
        } catch (uploadError) {
          console.error("[v0] Receipt upload error:", uploadError)
          toast({
            title: "Warning",
            description: "Receipt upload failed but transaction will be saved",
          })
        } finally {
          setUploadingReceipt(false)
        }
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: `${categories.find((c) => c.id === categoryId)?.name || type} - ${description}`,
          amount: Number.parseFloat(amount),
          date,
          notes,
          category_id: categoryId,
          bill_proof: receiptUrl || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save transaction")
      }

      const result = await response.json()
      console.log("[v0] Transaction saved:", result.id)

      if (result.will_auto_allocate && result.allocations) {
        toast({
          title: "Transaction recorded & allocated",
          description: `₹${Number.parseInt(amount).toLocaleString("en-IN")} ${type} recorded and queued for automatic allocation.`,
        })
      } else {
        toast({
          title: result.classification_status === "classified" ? "Transaction auto-classified" : "Transaction recorded",
          description:
            result.classification_status === "classified"
              ? `₹${Number.parseInt(amount).toLocaleString("en-IN")} ${type} auto-assigned to account.`
              : `₹${Number.parseInt(amount).toLocaleString("en-IN")} ${type} recorded. CA will classify.`,
        })
      }

      setDescription("")
      setAmount("")
      setCategoryId("")
      setNotes("")

      router.push("/transactions")
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadBill = () => {
    const fileInput = document.getElementById("bill-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG, WebP) or PDF",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setReceiptFile(file)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview("")
    }

    toast({
      title: "Receipt uploaded",
      description: `${file.name} has been attached to this transaction`,
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-xl" style={{ borderRadius: "16px" }}>
          <CardContent className="pt-6">
            <div className="space-y-2 mb-6">
              <Label className="text-base font-semibold">Transaction Type</Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-3xl">
                <button
                  type="button"
                  onClick={() => setType("revenue")}
                  className={
                    type === "revenue"
                      ? "py-3 rounded-2xl font-semibold text-sm transition-all duration-200 bg-[#2E7D32] text-white shadow-md"
                      : "py-3 rounded-2xl font-semibold text-sm transition-all duration-200 text-muted-foreground hover:text-foreground"
                  }
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={
                    type === "expense"
                      ? "py-3 rounded-2xl font-semibold text-sm transition-all duration-200 bg-[#F57C00] text-white shadow-md"
                      : "py-3 rounded-2xl font-semibold text-sm transition-all duration-200 text-muted-foreground hover:text-foreground"
                  }
                >
                  Expense
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 px-1 leading-relaxed">{typeExplanations[type]}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-semibold">
                  Category
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-12 rounded-2xl border-2">
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No categories available
                      </SelectItem>
                    ) : (
                      availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder={
                    type === "expense" ? "e.g., Office rent – December" : "e.g., Client payment – ABC Pvt Ltd"
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12 rounded-2xl border-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-semibold">
                  Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12 h-16 text-3xl font-bold rounded-3xl border-2 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {willAutoAllocate && allocationPreview.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    <div className="font-semibold mb-2">This revenue will be automatically allocated:</div>
                    <div className="space-y-1">
                      {allocationPreview.map((alloc, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span>{alloc.account_name}</span>
                          <span className="font-medium">
                            {alloc.percentage}% → ₹{alloc.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold">
                  Date
                </Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 rounded-2xl border-2 pl-12"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24 rounded-2xl border-2 resize-none"
                />
              </div>

              {receiptFile && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Camera className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">{receiptFile.name}</p>
                        <p className="text-xs text-blue-700">
                          {(receiptFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null)
                        setReceiptPreview("")
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  {receiptPreview && (
                    <img src={receiptPreview || "/placeholder.svg"} alt="Receipt preview" className="w-full max-h-48 object-contain rounded-lg" />
                  )}
                </div>
              )}

              <input
                id="bill-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleReceiptFileChange}
                className="hidden"
              />

              <Button
                type="button"
                onClick={handleUploadBill}
                variant="outline"
                className="w-full h-12 rounded-2xl border-2 border-dashed bg-transparent"
              >
                <Camera className="mr-2 h-5 w-5" />
                {receiptFile ? "Change Receipt" : "Upload Receipt_test"}
              </Button>

              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-14 rounded-full text-lg font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : `Record ${type === "revenue" ? "Revenue" : "Expense"}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  )
}
