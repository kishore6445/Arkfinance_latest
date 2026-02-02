"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, Building, Calendar, FileText, Download, IndianRupee } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  location: string | null
  gstin: string | null
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  grand_total: number
  status: string
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch customer data
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", params.id)
        .single()

      if (customerError) {
        console.error("Error fetching customer:", customerError)
        setLoading(false)
        return
      }

      setCustomer(customerData)

      // Fetch invoices for this customer
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, grand_total, status")
        .eq("client_name", customerData.name)
        .order("invoice_date", { ascending: false })

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError)
      } else {
        setInvoices(invoicesData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [params.id])

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
  const paidAmount = invoices
    .filter((inv) => inv.status?.toLowerCase() === "paid")
    .reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
  const pendingAmount = invoices
    .filter((inv) => inv.status?.toLowerCase() === "pending" || inv.status?.toLowerCase() === "unpaid")
    .reduce((sum, inv) => sum + (inv.grand_total || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading customer details...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-3xl font-bold">Customer Not Found</h2>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">The customer you're looking for doesn't exist.</p>
              <Button onClick={() => router.push("/clients")} className="mt-4">
                Back to Customers
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{customer.name}</h2>
            <p className="text-muted-foreground">Customer since {formatDate(customer.created_at)}</p>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">₹{(totalRevenue / 1000).toFixed(0)}K</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">₹{(paidAmount / 1000).toFixed(0)}K</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">₹{(pendingAmount / 1000).toFixed(0)}K</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{customer.location || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GSTIN</p>
                <p className="font-medium font-mono">{customer.gstin || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer Since</p>
                <p className="font-medium">{formatDate(customer.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="font-medium">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No invoices found for this customer.</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Invoice ID</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Description</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold">Amount</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4">
                            <code className="text-sm font-semibold">{invoice.invoice_number}</code>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatDate(invoice.invoice_date)}
                          </td>
                          <td className="px-4 py-4 text-sm">Invoice</td>
                          <td className="px-4 py-4 text-right font-semibold">
                            ₹{(invoice.grand_total || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge
                              variant={invoice.status?.toLowerCase() === "paid" ? "default" : "secondary"}
                              className={
                                invoice.status?.toLowerCase() === "paid"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                              }
                            >
                              {invoice.status || "Unknown"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
