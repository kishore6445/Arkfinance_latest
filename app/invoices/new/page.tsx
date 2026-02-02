"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Eye, Save, Send, X, Building2, FileText, Download, Shield } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  gst: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  gstin: string
  address: string
}

export default function CreateInvoicePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")

  const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: "1", description: "", quantity: 1, rate: 0, gst: 18 }])

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()

    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching customers:", error)
      return
    }

    if (data) {
      setCustomers(data)
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setClientName(customer.name)
      setClientEmail(customer.email || "")
      setClientAddress(customer.address || "")
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now().toString(), description: "", quantity: 1, rate: 0, gst: 18 }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const calculateItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.rate
    const gstAmount = (subtotal * item.gst) / 100
    return subtotal + gstAmount
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const totalGst = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate * item.gst) / 100, 0)
  const grandTotal = subtotal + totalGst

  const formatIndianCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
  }

  const saveInvoice = async (status: "draft" | "sent") => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCustomerId || !clientName || !clientEmail) {
      toast({
        title: "Missing information",
        description: "Please select a customer.",
        variant: "destructive",
      })
      return
    }

    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.rate <= 0)) {
      toast({
        title: "Invalid line items",
        description: "Please ensure all line items have valid description, quantity, and rate.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    const supabase = createBrowserClient()

    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: userId,
          customer_id: selectedCustomerId,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail,
          client_address: clientAddress,
          invoice_date: invoiceDate,
          due_date: dueDate,
          subtotal,
          total_gst: totalGst,
          grand_total: grandTotal,
          status,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const lineItemsData = lineItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        gst: item.gst,
      }))

      const { error: lineItemsError } = await supabase.from("invoice_line_items").insert(lineItemsData)

      if (lineItemsError) throw lineItemsError

      toast({
        title: status === "draft" ? "Draft saved successfully" : "Invoice sent successfully",
        description:
          status === "draft"
            ? "Your invoice has been saved as a draft."
            : `Invoice #${invoiceNumber} has been sent to ${clientEmail}.`,
      })

      if (status === "sent") {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast({
        title: "Error",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = () => {
    saveInvoice("draft")
  }

  const handleSendToClient = () => {
    saveInvoice("sent")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Create Invoice</h2>
              <p className="text-muted-foreground">Build a professional invoice for your client in minutes.</p>
            </div>
            <Link href="/invoices">
              <Button variant="outline" className="rounded-full bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                View All Invoices
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg animate-fade-in-up" style={{ borderRadius: "16px", animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-semibold">
                    Select Customer
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="h-11 rounded-xl border-2">
                      <SelectValue placeholder="Choose a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {customers.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No customers found.{" "}
                          <Link href="/clients" className="text-primary hover:underline">
                            Add a customer
                          </Link>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomerId && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Client Name</Label>
                      <Input value={clientName} disabled className="h-11 rounded-xl border-2 bg-muted/50" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Email Address</Label>
                      <Input value={clientEmail} disabled className="h-11 rounded-xl border-2 bg-muted/50" />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="clientAddress" className="text-sm font-semibold">
                    Address
                  </Label>
                  <Textarea
                    id="clientAddress"
                    placeholder="Complete address with city, state, PIN"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="min-h-20 rounded-xl border-2 resize-none"
                    disabled={!selectedCustomerId}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg animate-fade-in-up" style={{ borderRadius: "16px", animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-semibold text-muted-foreground pb-2 border-b">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Rate (₹)</div>
                  <div className="col-span-2">GST %</div>
                  <div className="col-span-1"></div>
                </div>

                {lineItems.map((item, index) => (
                  <div key={item.id} className="space-y-3 md:space-y-0">
                    <div className="md:hidden space-y-3 p-4 rounded-xl bg-muted/30 relative">
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="absolute top-2 right-2 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        className="h-10 rounded-lg border-2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                          className="h-10 rounded-lg border-2"
                        />
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                          className="h-10 rounded-lg border-2"
                        />
                        <Input
                          type="number"
                          placeholder="GST %"
                          value={item.gst}
                          onChange={(e) => updateLineItem(item.id, "gst", Number.parseFloat(e.target.value) || 0)}
                          className="h-10 rounded-lg border-2"
                        />
                      </div>
                      <div className="text-right text-sm font-semibold text-primary">
                        Total: ₹{formatIndianCurrency(calculateItemTotal(item))}
                      </div>
                    </div>

                    <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        className="col-span-5 h-10 rounded-lg border-2"
                      />
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                        className="col-span-2 h-10 rounded-lg border-2"
                      />
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                        className="col-span-2 h-10 rounded-lg border-2"
                      />
                      <Input
                        type="number"
                        placeholder="18"
                        value={item.gst}
                        onChange={(e) => updateLineItem(item.id, "gst", Number.parseFloat(e.target.value) || 0)}
                        className="col-span-2 h-10 rounded-lg border-2"
                      />
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="col-span-1 h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addLineItem}
                  className="w-full h-11 rounded-xl border-2 border-dashed bg-transparent hover:bg-muted"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card
              className="shadow-xl sticky top-20 animate-fade-in-up"
              style={{ borderRadius: "16px", animationDelay: "400ms" }}
            >
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold flex items-baseline gap-1">
                      <span className="text-xs">₹</span>
                      <span className="font-mono tabular-nums">{formatIndianCurrency(subtotal)}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-semibold flex items-baseline gap-1">
                      <span className="text-xs">₹</span>
                      <span className="font-mono tabular-nums">{formatIndianCurrency(totalGst)}</span>
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold">Total</span>
                      <span className="text-2xl font-bold text-primary flex items-baseline gap-1">
                        <span className="text-sm">₹</span>
                        <span className="font-mono tabular-nums">{formatIndianCurrency(grandTotal)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    className="w-full h-11 rounded-full font-semibold bg-transparent"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Invoice
                  </Button>

                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    variant="outline"
                    className="w-full h-11 rounded-full font-semibold bg-transparent"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Draft"}
                  </Button>

                  <Button
                    onClick={handleSendToClient}
                    disabled={isSaving}
                    className="w-full h-11 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSaving ? "Sending..." : "Send to Client"}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Review carefully before sending. Your client will receive a beautifully formatted invoice.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Invoice Preview</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="bg-white text-black p-8 rounded-xl border-2 space-y-8">
            <div className="flex items-start justify-between pb-6 border-b-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600">
                  <Shield className="h-10 w-10 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">Warrior Finance</h1>
                  <p className="text-sm text-blue-700">Sharma Enterprises</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-blue-900">INVOICE</h2>
                <p className="text-sm text-gray-600 mt-1">#{invoiceNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">From</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">Sharma Enterprises</p>
                  <p className="text-gray-600">123, MG Road, Bangalore</p>
                  <p className="text-gray-600">Karnataka - 560001</p>
                  <p className="text-gray-600 mt-2">
                    <strong>GSTIN:</strong> 29ABCDE1234F1Z5
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bill To</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">{clientName || "Client Name"}</p>
                  <p className="text-gray-600">{clientEmail || "client@example.com"}</p>
                  <p className="text-gray-600">{clientAddress || "Client Address"}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-gray-500">Invoice Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(invoiceDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="border-2 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Qty</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Rate</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">GST %</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-3 text-sm text-gray-900">{item.description || "—"}</td>
                      <td className="p-3 text-sm text-center text-gray-900">{item.quantity}</td>
                      <td className="p-3 text-sm text-right text-gray-900 font-mono">
                        ₹{formatIndianCurrency(item.rate)}
                      </td>
                      <td className="p-3 text-sm text-right text-gray-900">{item.gst}%</td>
                      <td className="p-3 text-sm text-right font-semibold text-gray-900 font-mono">
                        ₹{formatIndianCurrency(calculateItemTotal(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900 font-mono">₹{formatIndianCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST</span>
                  <span className="font-semibold text-gray-900 font-mono">₹{formatIndianCurrency(totalGst)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-900 font-mono">
                    ₹{formatIndianCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Payment Details</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-gray-600 mb-2">Bank Transfer</p>
                  <p className="text-gray-900">
                    <strong>Account:</strong> 1234567890
                  </p>
                  <p className="text-gray-900">
                    <strong>IFSC:</strong> HDFC0001234
                  </p>
                  <p className="text-gray-900">
                    <strong>Bank:</strong> HDFC Bank
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-2">UPI Payment</p>
                  <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 text-center">
                    <p className="text-xs text-gray-500 mb-2">Scan QR Code</p>
                    <div className="w-24 h-24 mx-auto bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">QR Code</span>
                    </div>
                    <p className="text-xs text-gray-900 mt-2 font-mono">sharma@upi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-6 border-t-2">
              <p className="text-sm text-gray-600">
                Thank you for your business! For any queries, contact us at support@sharmaent.com
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1 h-11 rounded-full font-semibold bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={() => {
                handleSendToClient()
                setShowPreview(false)
              }}
              disabled={isSaving}
              className="flex-1 h-11 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSaving ? "Sending..." : "Send Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
