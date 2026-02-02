"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  type: string
  color: string
  icon: string
  count: number
}

const initialCategories: Category[] = [
  { id: "1", name: "Sales", type: "revenue", color: "#2E7D32", icon: "Trending", count: 45 },
  { id: "2", name: "Services", type: "revenue", color: "#1565C0", icon: "Person", count: 32 },
  { id: "3", name: "Investment", type: "revenue", color: "#7B1FA2", icon: "Rupee", count: 8 },
  { id: "4", name: "Operations", type: "expense", color: "#F57C00", icon: "Building", count: 67 },
  { id: "5", name: "Salary", type: "expense", color: "#2E7D32", icon: "Person", count: 12 },
  { id: "6", name: "Rent", type: "expense", color: "#616161", icon: "Building", count: 12 },
  { id: "7", name: "Marketing", type: "expense", color: "#D32F2F", icon: "Tag", count: 28 },
  { id: "8", name: "Owner Withdrawal", type: "debit", color: "#D32F2F", icon: "Person", count: 15 },
  { id: "9", name: "Loan Received", type: "loan", color: "#1565C0", icon: "Card", count: 3 },
  { id: "10", name: "Loan Repaid", type: "loan", color: "#7B1FA2", icon: "Card", count: 6 },
]

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<"revenue" | "others">("revenue")
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showAddModal, setShowAddModal] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/categories")
  }, [router])

  const handleCategoryAdded = (newCategory: { name: string; type: string; color: string; icon: string }) => {
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      type: newCategory.type,
      color: newCategory.color,
      icon: newCategory.icon,
      count: 0,
    }
    setCategories((prev) => [...prev, category])

    // Switch to appropriate tab
    if (newCategory.type === "revenue") {
      setActiveTab("revenue")
    } else {
      setActiveTab("others")
    }
  }

  const handleDelete = (id: string, name: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
    toast({
      title: "Category deleted",
      description: `"${name}" has been removed. (Mock only)`,
    })
  }

  const revenueCategories = categories.filter((cat) => cat.type === "revenue")
  const otherCategories = categories.filter((cat) => cat.type !== "revenue")

  return null
}
