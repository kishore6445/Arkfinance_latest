"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Upload,
  Trash2,
  Edit,
  Eye,
  FileText,
  MessageCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  location: string
  gstin: string
  addedDate: string
  whatsapp_number?: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    gstin: "",
    whatsapp_number: "",
  })
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    console.log("[v0] Fetching customers from database")
    setIsLoading(true)
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching customers:", error)
      alert("Failed to load customers")
    } else {
      console.log("[v0] Fetched customers:", data)
      const formattedCustomers = data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        location: customer.location || "",
        gstin: customer.gstin || "",
        whatsapp_number: customer.whatsapp_number || "",
        addedDate: new Date(customer.created_at).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }),
      }))
      setCustomers(formattedCustomers)
    }
    setIsLoading(false)
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      alert("Please fill in all required fields")
      return
    }

    console.log("[v0] Adding customer to database:", newCustomer)
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          location: newCustomer.location,
          gstin: newCustomer.gstin,
          whatsapp_number: newCustomer.whatsapp_number,
          status: "active",
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error adding customer:", error)
      alert("Failed to add customer")
      return
    }

    console.log("[v0] Customer added successfully:", data)
    setIsAddCustomerOpen(false)
    setNewCustomer({ name: "", email: "", phone: "", location: "", gstin: "", whatsapp_number: "" })
    fetchCustomers()
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsEditCustomerOpen(true)
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer?.name || !editingCustomer?.email || !editingCustomer?.phone) {
      alert("Please fill in all required fields")
      return
    }

    console.log("[v0] Updating customer in database:", editingCustomer)
    const supabase = createBrowserClient()

    const { error } = await supabase
      .from("customers")
      .update({
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        location: editingCustomer.location,
        gstin: editingCustomer.gstin,
        whatsapp_number: editingCustomer.whatsapp_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingCustomer.id)

    if (error) {
      console.error("[v0] Error updating customer:", error)
      alert("Failed to update customer")
      return
    }

    console.log("[v0] Customer updated successfully")
    setIsEditCustomerOpen(false)
    setEditingCustomer(null)
    fetchCustomers()
  }

  const handleDeleteClick = (customerId: string) => {
    setCustomerToDelete(customerId)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return

    console.log("[v0] Deleting customer from database:", customerToDelete)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("customers").update({ status: "deleted" }).eq("id", customerToDelete)

    if (error) {
      console.error("[v0] Error deleting customer:", error)
      alert("Failed to delete customer")
      return
    }

    console.log("[v0] Customer deleted successfully")
    setCustomerToDelete(null)
    setIsDeleteDialogOpen(false)
    fetchCustomers()
  }

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "WhatsApp", "Location", "GSTIN", "Added Date"]
    const csvData = [
      headers.join(","),
      ...customers.map((c) =>
        [c.name, c.email, c.phone, c.whatsapp_number || "", c.location, c.gstin, c.addedDate].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      const newCustomers: any[] = []

      for (let i = 1; i < lines.length; i++) {
        const [name, email, phone, whatsapp, location, gstin] = lines[i].split(",")
        if (name && email && phone) {
          newCustomers.push({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            whatsapp_number: whatsapp?.trim() || "",
            location: location?.trim() || "",
            gstin: gstin?.trim() || "",
            status: "active",
          })
        }
      }

      if (newCustomers.length > 0) {
        console.log("[v0] Importing customers to database:", newCustomers)
        const supabase = createBrowserClient()

        const { error } = await supabase.from("customers").insert(newCustomers)

        if (error) {
          console.error("[v0] Error importing customers:", error)
          alert("Failed to import customers")
          return
        }

        console.log("[v0] Customers imported successfully")
        alert(`Successfully imported ${newCustomers.length} customers`)
        fetchCustomers()
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleViewDetails = (customerId: string) => {
    router.push(`/clients/${customerId}`)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Customers</h2>
            <p className="text-muted-foreground">Manage your customer relationships</p>
          </div>
          <Button className="rounded-full shadow-lg" onClick={() => setIsAddCustomerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <Card className="shadow-md" style={{ borderRadius: "16px" }}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
              <Button variant="outline" className="rounded-full bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent" asChild>
                <label htmlFor="import-csv" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <input id="import-csv" type="file" accept=".csv" className="hidden" onChange={handleImport} />
                </label>
              </Button>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Contact</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Location</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">GSTIN</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                          Loading customers...
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">Added {customer.addedDate}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{customer.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{customer.phone}</span>
                              </div>
                              {customer.whatsapp_number && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{customer.whatsapp_number}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{customer.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{customer.gstin}</code>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="rounded-full">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(customer.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(customer.id)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Transactions
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(customer.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading && filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer details to add them to your database</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={newCustomer.whatsapp_number}
                  onChange={(e) => setNewCustomer({ ...newCustomer, whatsapp_number: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newCustomer.location}
                  onChange={(e) => setNewCustomer({ ...newCustomer, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={newCustomer.gstin}
                  onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                  placeholder="29ABCDE1234F1Z5"
                  maxLength={15}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">15-digit GST Identification Number (optional)</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>

          {editingCustomer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp">WhatsApp Number</Label>
                  <Input
                    id="edit-whatsapp"
                    type="tel"
                    value={editingCustomer.whatsapp_number || ""}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, whatsapp_number: e.target.value || undefined })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editingCustomer.location}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gstin">GSTIN</Label>
                  <Input
                    id="edit-gstin"
                    value={editingCustomer.gstin}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, gstin: e.target.value })}
                    placeholder="29ABCDE1234F1Z5"
                    maxLength={15}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">15-digit GST Identification Number (optional)</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer}>Update Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer and all associated data from your
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
