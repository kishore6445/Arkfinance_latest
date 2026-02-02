"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { Bell, Calendar, CheckCircle2, Clock, AlertCircle, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InvoiceReminder {
  id: string
  invoice_id: string
  reminder_type: string
  scheduled_date: string
  status: string
  sent_at: string | null
  created_at: string
  invoice: {
    invoice_number: string
    client_name: string
    grand_total: number
    due_date: string
  }
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<InvoiceReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("invoice_reminders")
      .select(
        `
        *,
        invoice:invoices(invoice_number, client_name, grand_total, due_date)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      setReminders(data as any)
    }
    setLoading(false)
  }

  const handleProcessReminders = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/cron/process-reminders")
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Reminders processed successfully",
        })
        await fetchReminders()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process reminders",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process reminders",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case "before_due":
        return "3 Days Before Due"
      case "on_due":
        return "Due Today"
      case "overdue_3":
        return "3 Days Overdue"
      case "overdue_7":
        return "7 Days Overdue"
      case "overdue_15":
        return "15 Days Overdue"
      default:
        return type
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
  }

  const pendingCount = reminders.filter((r) => r.status === "pending").length
  const sentCount = reminders.filter((r) => r.status === "sent").length

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Payment Reminders</h2>
            <p className="text-muted-foreground">Automated invoice payment reminders via WhatsApp</p>
          </div>
          <Button
            onClick={handleProcessReminders}
            disabled={processing}
            className="h-11 rounded-full font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${processing ? "animate-spin" : ""}`} />
            {processing ? "Processing..." : "Process Now"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{ borderRadius: "16px" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reminders.length}</div>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: "16px" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: "16px" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{sentCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle>Reminder History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading reminders...</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No reminders yet</h3>
                  <p className="text-muted-foreground">Reminders will be created automatically for unpaid invoices</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">{getStatusIcon(reminder.status)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">
                            {reminder.invoice?.invoice_number || `Invoice ${reminder.invoice_id.slice(0, 8)}`}
                          </h3>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            {getReminderTypeLabel(reminder.reminder_type)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reminder.invoice?.client_name} • ₹{formatCurrency(reminder.invoice?.grand_total || 0)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(reminder.invoice?.due_date).toLocaleDateString("en-IN")}
                          </span>
                          {reminder.sent_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Sent: {new Date(reminder.sent_at).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`capitalize text-sm font-medium ${
                          reminder.status === "sent"
                            ? "text-green-600"
                            : reminder.status === "pending"
                              ? "text-yellow-600"
                              : "text-gray-600"
                        }`}
                      >
                        {reminder.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle>Reminder Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="font-medium">3 Days Before Due Date</span>
                <span className="text-muted-foreground ml-auto">Upcoming payment reminder</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="font-medium">On Due Date</span>
                <span className="text-muted-foreground ml-auto">Payment due today</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <span className="font-medium">3 Days Overdue</span>
                <span className="text-muted-foreground ml-auto">First overdue reminder</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span className="font-medium">7 Days Overdue</span>
                <span className="text-muted-foreground ml-auto">Second overdue reminder</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="font-medium">15 Days Overdue</span>
                <span className="text-muted-foreground ml-auto">Final reminder</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
