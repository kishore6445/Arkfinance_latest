"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Eye,
  Calendar,
  Mail,
  FileText,
  X,
  Download,
  Send,
  Shield,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  client_address: string
  invoice_date: string
  due_date: string
  subtotal: number
  total_gst: number
  grand_total: number
  status: "draft" | "sent" | "paid"
  created_at: string
}

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  gst: number
}

interface WhatsAppMessage {
  id: string
  message_type: string
  message_status: string
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  created_at: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([])
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setInvoices(data)
    }
    setLoading(false)
  }

  const fetchLineItems = async (invoiceId: string) => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setLineItems(data)
    }
  }

  const fetchWhatsAppMessages = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/messages/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setWhatsappMessages(data.messages || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching WhatsApp messages:", error)
    }
  }

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    await fetchLineItems(invoice.id)
    await fetchWhatsAppMessages(invoice.id)
    setShowPreview(true)
  }

  const handleSendWhatsApp = async () => {
    if (!selectedInvoice || !whatsappNumber) {
      toast({
        title: "Error",
        description: "Please enter a WhatsApp number",
        type: "error",
      })
      return
    }

    setSendingWhatsApp(true)
    try {
      const response = await fetch("/api/whatsapp/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          phoneNumber: whatsappNumber,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
          type: "success",
        })
        setShowWhatsAppDialog(false)
        setWhatsappNumber("")
        await fetchWhatsAppMessages(selectedInvoice.id)
        await fetchInvoices()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send invoice",
          type: "error",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice via WhatsApp",
        type: "error",
      })
    } finally {
      setSendingWhatsApp(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentDate || !paymentAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        type: "error",
      })
      return
    }

    setRecordingPayment(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_date: paymentDate,
          paid_amount: Number(paymentAmount),
        })
        .eq("id", selectedInvoice.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Payment recorded successfully",
        type: "success",
      })

      setShowPaymentDialog(false)
      setPaymentDate("")
      setPaymentAmount("")
      setPaymentNotes("")
      await fetchInvoices()
    } catch (error) {
      console.error("[v0] Error recording payment:", error)
      toast({
        title: "Error",
        description: "Failed to record payment",
        type: "error",
      })
    } finally {
      setRecordingPayment(false)
    }
  }

  const handleSendReminder = async () => {
    if (!selectedInvoice || !whatsappNumber) {
      toast({
        title: "Error",
        description: "Please enter a WhatsApp number",
        type: "error",
      })
      return
    }

    setSendingReminder(true)
    try {
      const response = await fetch("/api/whatsapp/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          phoneNumber: whatsappNumber,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
          type: "success",
        })
        await fetchWhatsAppMessages(selectedInvoice.id)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send reminder",
          type: "error",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        type: "error",
      })
    } finally {
      setSendingReminder(false)
    }
  }

  const getWhatsAppStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "read":
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatIndianCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
  }

  const calculateItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.rate
    const gstAmount = (subtotal * item.gst) / 100
    return subtotal + gstAmount
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Invoices</h2>
            <p className="text-muted-foreground">View and manage all your invoices in one place.</p>
          </div>
          <Link href="/invoices/new">
            <Button className="h-11 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <Card className="shadow-lg" style={{ borderRadius: "16px" }}>
            <CardContent className="py-12 text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No invoices yet</h3>
                <p className="text-muted-foreground">Create your first invoice to get started.</p>
              </div>
              <Link href="/invoices/new">
                <Button className="h-11 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {invoices.map((invoice, index) => (
              <Card
                key={invoice.id}
                className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer animate-fade-in-up"
                style={{ borderRadius: "16px", animationDelay: `${index * 50}ms` }}
                onClick={() => handleViewInvoice(invoice)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground">#{invoice.invoice_number}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(invoice.status)}`}
                        >
                          {invoice.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="font-semibold text-foreground">{invoice.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{invoice.client_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Invoice Date:{" "}
                            {new Date(invoice.invoice_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Due Date:{" "}
                            {new Date(invoice.due_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-primary flex items-baseline gap-1 justify-end">
                        <span className="text-sm">₹</span>
                        <span className="font-mono tabular-nums">{formatIndianCurrency(invoice.grand_total)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewInvoice(invoice)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
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

      {/* Preview Modal */}
      {selectedInvoice && (
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

            {/* Invoice Preview */}
            <div className="bg-white text-black p-8 rounded-xl border-2 space-y-8">
              {/* Header */}
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
                  <p className="text-sm text-gray-600 mt-1">#{selectedInvoice.invoice_number}</p>
                </div>
              </div>

              {/* Company & Client Details */}
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
                    <p className="font-semibold text-gray-900">{selectedInvoice.client_name}</p>
                    <p className="text-gray-600">{selectedInvoice.client_email}</p>
                    <p className="text-gray-600">{selectedInvoice.client_address}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="text-gray-500">Invoice Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedInvoice.invoice_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedInvoice.due_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
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
                        <td className="p-3 text-sm text-gray-900">{item.description}</td>
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

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      ₹{formatIndianCurrency(selectedInvoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      ₹{formatIndianCurrency(selectedInvoice.total_gst)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-900 font-mono">
                      ₹{formatIndianCurrency(selectedInvoice.grand_total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
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

              {/* Footer */}
              <div className="text-center pt-6 border-t-2">
                <p className="text-sm text-gray-600">
                  Thank you for your business! For any queries, contact us at support@sharmaent.com
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1 h-11 rounded-full font-semibold bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {selectedInvoice.status !== "paid" && (
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  className="flex-1 h-11 rounded-full font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
              <Button
                onClick={() => setShowWhatsAppDialog(true)}
                className="flex-1 h-11 rounded-full font-semibold bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send via WhatsApp
              </Button>
              <Button className="flex-1 h-11 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </div>

            {/* WhatsApp Message History */}
            {whatsappMessages.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">WhatsApp History</h3>
                <div className="space-y-2">
                  {whatsappMessages.map((msg) => (
                    <div key={msg.id} className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getWhatsAppStatusIcon(msg.message_status)}
                        <span className="capitalize">{msg.message_type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="capitalize">{msg.message_status}</span>
                        <span>
                          {msg.sent_at
                            ? new Date(msg.sent_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : new Date(msg.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* WhatsApp Send Dialog */}
      {selectedInvoice && (
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Invoice via WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g., +91 for India)</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-xl space-y-2 text-sm">
                <p className="font-semibold">Invoice Details:</p>
                <p>Invoice #{selectedInvoice.invoice_number}</p>
                <p>Amount: ₹{formatIndianCurrency(selectedInvoice.grand_total)}</p>
                <p>Client: {selectedInvoice.client_name}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWhatsAppDialog(false)}
                  className="flex-1 h-11 rounded-full"
                  disabled={sendingWhatsApp || sendingReminder}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendReminder}
                  className="flex-1 h-11 rounded-full bg-transparent"
                  disabled={sendingWhatsApp || sendingReminder || selectedInvoice.status === "paid"}
                >
                  {sendingReminder ? "Sending..." : "Send Reminder"}
                </Button>
                <Button
                  onClick={handleSendWhatsApp}
                  className="flex-1 h-11 rounded-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={sendingWhatsApp || sendingReminder}
                >
                  {sendingWhatsApp ? "Sending..." : "Send Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Recording Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-date" className="text-sm font-medium">
                Payment Date
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="payment-amount" className="text-sm font-medium">
                Amount Paid
              </Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Invoice Total: ₹{selectedInvoice?.grand_total.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <Label htmlFor="payment-notes" className="text-sm font-medium">
                Notes (Optional)
              </Label>
              <Input
                id="payment-notes"
                type="text"
                placeholder="e.g., UPI Transfer, Check #123"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={recordingPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {recordingPayment ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
