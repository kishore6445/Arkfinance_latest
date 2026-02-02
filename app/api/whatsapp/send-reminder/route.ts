import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, phoneNumber, reminderType = "manual" } = body

    if (!invoiceId || !phoneNumber) {
      return NextResponse.json({ error: "Invoice ID and phone number are required" }, { status: 400 })
    }

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if invoice is already paid
    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    // Check if reminder was sent recently (within last 24 hours)
    const { data: recentReminders } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("invoice_id", invoiceId)
      .eq("message_type", "reminder")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (recentReminders && recentReminders.length > 0) {
      return NextResponse.json({ error: "A reminder was already sent within the last 24 hours" }, { status: 400 })
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber.replace(/\D/g, "")}`

    // Calculate days overdue
    const dueDate = new Date(invoice.due_date)
    const today = new Date()
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // Prepare reminder message
    const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.vercel.app"}/invoices/${invoice.id}`

    let messageBody = ""
    if (daysOverdue > 0) {
      messageBody = `Hi ${invoice.client_name},

This is a friendly reminder that invoice #${invoice.invoice_number} for ₹${invoice.grand_total.toFixed(2)} is overdue by ${daysOverdue} day(s).

Original Due Date: ${dueDate.toLocaleDateString("en-IN")}

View Invoice: ${invoiceLink}

Please make the payment at your earliest convenience.

Thank you!`
    } else {
      messageBody = `Hi ${invoice.client_name},

Friendly reminder: Invoice #${invoice.invoice_number} for ₹${invoice.grand_total.toFixed(2)} is due on ${dueDate.toLocaleDateString("en-IN")}.

View Invoice: ${invoiceLink}

Thank you for your prompt payment!`
    }

    // Send via Twilio if configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

    let messageStatus = "pending"
    let twilioMessageSid = null
    let errorMessage = null

    if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
      try {
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: "Basic " + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64"),
            },
            body: new URLSearchParams({
              From: twilioWhatsAppNumber,
              To: `whatsapp:${formattedPhone}`,
              Body: messageBody,
            }),
          },
        )

        const twilioData = await twilioResponse.json()

        if (twilioResponse.ok) {
          messageStatus = "sent"
          twilioMessageSid = twilioData.sid
        } else {
          messageStatus = "failed"
          errorMessage = twilioData.message || "Failed to send WhatsApp reminder"
        }
      } catch (twilioError: any) {
        messageStatus = "failed"
        errorMessage = twilioError.message || "Twilio API error"
      }
    } else {
      console.log("[v0] Twilio not configured. Reminder logged but not sent:", messageBody)
      messageStatus = "pending"
      errorMessage = "Twilio credentials not configured"
    }

    // Log reminder in database
    const { data: whatsappMessage, error: messageError } = await supabase
      .from("whatsapp_messages")
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        recipient_number: formattedPhone,
        message_type: "reminder",
        message_status: messageStatus,
        twilio_message_sid: twilioMessageSid,
        message_body: messageBody,
        sent_at: messageStatus === "sent" ? new Date().toISOString() : null,
        error_message: errorMessage,
      })
      .select()
      .single()

    if (messageError) {
      console.error("[v0] Error logging WhatsApp reminder:", messageError)
      return NextResponse.json({ error: "Failed to log reminder" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message:
        messageStatus === "sent"
          ? "Reminder sent via WhatsApp successfully"
          : "Reminder logged (Twilio not configured)",
      whatsappMessage,
      messageStatus,
    })
  } catch (error: any) {
    console.error("[v0] Error sending reminder via WhatsApp:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
