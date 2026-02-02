"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit2, Trash2, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface AccountingType {
  id: string
  name: string
  statement_type: "P&L" | "Balance Sheet"
  is_active: boolean
  sort_order: number
}

interface AccountingSubtype {
  id: string
  name: string
  accounting_type_id: string
  accounting_type_name?: string
  is_active: boolean
  sort_order: number
}

export default function AccountingMasterPage() {
  const supabase = createBrowserClient()
  const [filterType, setFilterType] = useState<string>("all")
  const [accountingTypes, setAccountingTypes] = useState<AccountingType[]>([])
  const [subtypes, setSubtypes] = useState<AccountingSubtype[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSubtype, setEditingSubtype] = useState<AccountingSubtype | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Form state
  const [formName, setFormName] = useState("")
  const [formTypeId, setFormTypeId] = useState("")
  const [formActive, setFormActive] = useState(true)
  const [formSortOrder, setFormSortOrder] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // Fetch accounting types
    const { data: typesData, error: typesError } = await supabase
      .from("accounting_types")
      .select("*")
      .order("sort_order", { ascending: true })

    if (typesError) {
      console.error("Error fetching accounting types:", typesError)
    } else {
      setAccountingTypes(typesData || [])
    }

    // Fetch subtypes
    const { data: subtypesData, error: subtypesError } = await supabase
      .from("accounting_subtypes")
      .select("*, accounting_types(name)")
      .order("sort_order", { ascending: true })

    if (subtypesError) {
      console.error("Error fetching subtypes:", subtypesError)
      toast({
        title: "Error",
        description: "Failed to load accounting subtypes",
        variant: "destructive",
      })
    } else {
      const formattedSubtypes = (subtypesData || []).map((st: any) => ({
        ...st,
        accounting_type_name: st.accounting_types?.name,
      }))
      setSubtypes(formattedSubtypes)
    }

    setLoading(false)
  }

  const openAddModal = () => {
    setEditingSubtype(null)
    setFormName("")
    setFormTypeId(accountingTypes[0]?.id || "")
    setFormActive(true)
    setFormSortOrder(0)
    setShowAddModal(true)
  }

  const openEditModal = (subtype: AccountingSubtype) => {
    setEditingSubtype(subtype)
    setFormName(subtype.name)
    setFormTypeId(subtype.accounting_type_id)
    setFormActive(subtype.is_active)
    setFormSortOrder(subtype.sort_order)
    setShowAddModal(true)
  }

  const handleSaveSubtype = async () => {
    if (!formName.trim()) {
      toast({
        title: "Error",
        description: "Sub-type name is required",
        variant: "destructive",
      })
      return
    }

    if (!formTypeId) {
      toast({
        title: "Error",
        description: "Accounting type is required",
        variant: "destructive",
      })
      return
    }

    if (editingSubtype) {
      const { error } = await supabase
        .from("accounting_subtypes")
        .update({
          name: formName,
          accounting_type_id: formTypeId,
          is_active: formActive,
          sort_order: formSortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSubtype.id)

      if (error) {
        console.error("Error updating subtype:", error)
        toast({
          title: "Error",
          description: "Failed to update sub-type",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sub-type updated",
          description: `"${formName}" has been updated successfully`,
        })
        fetchData()
        setShowAddModal(false)
      }
    } else {
      const { error } = await supabase.from("accounting_subtypes").insert({
        name: formName,
        accounting_type_id: formTypeId,
        is_active: formActive,
        sort_order: formSortOrder,
      })

      if (error) {
        console.error("Error creating subtype:", error)
        toast({
          title: "Error",
          description: "Failed to create sub-type",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sub-type created",
          description: `"${formName}" has been added successfully`,
        })
        fetchData()
        setShowAddModal(false)
      }
    }
  }

  const handleToggleActive = async (subtype: AccountingSubtype) => {
    const { error } = await supabase
      .from("accounting_subtypes")
      .update({
        is_active: !subtype.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subtype.id)

    if (error) {
      console.error("Error toggling subtype:", error)
      toast({
        title: "Error",
        description: "Failed to update sub-type status",
        variant: "destructive",
      })
    } else {
      toast({
        title: subtype.is_active ? "Sub-type disabled" : "Sub-type enabled",
        description: `"${subtype.name}" is now ${!subtype.is_active ? "active" : "inactive"}`,
      })
      fetchData()
    }
  }

  const handleDeleteSubtype = async (subtype: AccountingSubtype) => {
    if (!confirm(`Are you sure you want to delete "${subtype.name}"? This action cannot be undone.`)) {
      return
    }

    const { error } = await supabase.from("accounting_subtypes").delete().eq("id", subtype.id)

    if (error) {
      console.error("Error deleting subtype:", error)
      toast({
        title: "Error",
        description: "Failed to delete sub-type",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sub-type deleted",
        description: `"${subtype.name}" has been removed`,
      })
      fetchData()
    }
  }

  const filteredSubtypes = subtypes
    .filter((st) => {
      if (filterType === "all") return true
      const type = accountingTypes.find((t) => t.id === st.accounting_type_id)
      return type?.name.toLowerCase() === filterType.toLowerCase()
    })
    .filter((st) => st.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Accounting Master</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define Accounting Type and Subtypes used by Accountants for books.
            </p>
          </div>
        </div>

        {/* Accounting Types Section */}
        <Card className="shadow-md mb-6" style={{ borderRadius: "16px" }}>
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4">Accounting Types (System-Defined)</h2>
            <div className="grid grid-cols-2 gap-3">
              {accountingTypes.map((type) => (
                <div key={type.id} className="p-4 bg-muted rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{type.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.statement_type}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              These accounting types are system-defined and cannot be deleted
            </p>
          </CardContent>
        </Card>

        {/* Sub-types Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl">Accounting Sub-Types</h2>
          <Button
            onClick={openAddModal}
            className="h-11 rounded-full px-6 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sub-Type
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sub-types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-2xl"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] h-11 rounded-2xl">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card className="shadow-md" style={{ borderRadius: "16px" }}>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading sub-types...</p>
            </CardContent>
          </Card>
        ) : filteredSubtypes.length === 0 ? (
          <Card className="shadow-md" style={{ borderRadius: "16px" }}>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No sub-types match your search"
                  : "No sub-types found. Add sub-types like 'Fixed Asset' or 'GST Payable' to help classify transactions."}
              </p>
              {!searchQuery && (
                <Button variant="outline" onClick={openAddModal} className="h-11 rounded-full px-6 bg-transparent">
                  Add Your First Sub-Type
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSubtypes.map((subtype) => (
              <Card
                key={subtype.id}
                className="shadow-md hover:shadow-lg transition-shadow"
                style={{ borderRadius: "16px" }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {subtype.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{subtype.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            {subtype.accounting_type_name}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              subtype.is_active
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {subtype.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs text-muted-foreground">Order: {subtype.sort_order}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-muted"
                        onClick={() => handleToggleActive(subtype)}
                      >
                        <Switch checked={subtype.is_active} className="pointer-events-none" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-muted"
                        onClick={() => openEditModal(subtype)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteSubtype(subtype)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubtype ? "Edit Sub-Type" : "Add New Sub-Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sub-Type Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Fixed Asset, GST Payable"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Accounting Type *</Label>
              <Select value={formTypeId} onValueChange={setFormTypeId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {accountingTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.statement_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-order">Sort Order</Label>
              <Input
                id="sort-order"
                type="number"
                placeholder="0"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number.parseInt(e.target.value) || 0)}
                className="h-11 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first in dropdowns</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive sub-types won't appear in transaction dropdowns
                </p>
              </div>
              <Switch id="active" checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-11 rounded-2xl">
              Cancel
            </Button>
            <Button onClick={handleSaveSubtype} className="flex-1 h-11 rounded-2xl">
              {editingSubtype ? "Update" : "Create"} Sub-Type
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
