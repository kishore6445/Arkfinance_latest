"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit2, Trash2, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import Loading from "./loading"

interface Category {
  id: string
  name: string
  type: "revenue" | "expense"
  is_active: boolean
  sort_order: number
}

export default function CategoryMasterPage() {
  const supabase = createBrowserClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [filterType, setFilterType] = useState<"all" | "revenue" | "expense">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<"revenue" | "expense">("revenue")
  const [formActive, setFormActive] = useState(true)
  const [formSortOrder, setFormSortOrder] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("transaction_categories")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setFormName("")
    setFormType("revenue")
    setFormActive(true)
    setFormSortOrder(categories.filter(c => c.type === "revenue").length)
    setShowAddModal(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormType(category.type)
    setFormActive(category.is_active)
    setFormSortOrder(category.sort_order)
    setShowAddModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    if (editingCategory) {
      // Update
      const { error } = await supabase
        .from("transaction_categories")
        .update({
          name: formName,
          type: formType,
          is_active: formActive,
          sort_order: formSortOrder,
        })
        .eq("id", editingCategory.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update category",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Category updated successfully",
        })
        fetchCategories()
      }
    } else {
      // Create
      const { error } = await supabase
        .from("transaction_categories")
        .insert({
          name: formName,
          type: formType,
          is_active: formActive,
          sort_order: formSortOrder,
        })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create category",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Category created successfully",
        })
        fetchCategories()
      }
    }

    setShowAddModal(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    const { error } = await supabase
      .from("transaction_categories")
      .delete()
      .eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      fetchCategories()
    }
  }

  const filteredCategories = categories.filter(cat => {
    const typeMatch = filterType === "all" || cat.type === filterType
    const searchMatch = cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && searchMatch
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Category Master</h1>
          <p className="text-muted-foreground">Manage business transaction categories (Revenue & Expense)</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="revenue">Revenue Only</SelectItem>
                <SelectItem value="expense">Expense Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No categories found</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          category.type === "revenue"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {category.type.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${
                          category.is_active
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(category)}
                    className="gap-1 flex-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <Suspense fallback={<Loading />}>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Services, Rent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch id="active" checked={formActive} onCheckedChange={setFormActive} />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Suspense>

      <BottomNav />
    </div>
  )
}
