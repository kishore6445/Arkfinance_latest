import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, phoneNumber } = body

    if (!invoiceId || !phoneNumber) {
      return NextResponse.json({ error: "Invoice ID and phone number are required" }, { status: 400 })
    }

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_line_items(*)")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Format phone number for WhatsApp (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber.replace(/\D/g, "")}`

    // Prepare message
    const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.vercel.app"}/invoices/${invoice.id}`

    const messageBody = `Hi ${invoice.client_name},

Your invoice #${invoice.invoice_number} for ₹${invoice.grand_total.toFixed(2)} is ready.

Due Date: ${new Date(invoice.due_date).toLocaleDateString("en-IN")}

View & Download: ${invoiceLink}

Thank you for your business!`

    // Check if Twilio credentials are configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

    let messageStatus = "pending"
    let twilioMessageSid = null
    let errorMessage = null

    if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
      // Send via Twilio WhatsApp API
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
          errorMessage = twilioData.message || "Failed to send WhatsApp message"
        }
      } catch (twilioError: any) {
        messageStatus = "failed"
        errorMessage = twilioError.message || "Twilio API error"
      }
    } else {
      // Twilio not configured - log message but mark as pending
      console.log("[v0] Twilio not configured. Message logged but not sent:", messageBody)
      messageStatus = "pending"
      errorMessage = "Twilio credentials not configured"
    }

    // Log message in database
    const { data: whatsappMessage, error: messageError } = await supabase
      .from("whatsapp_messages")
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        recipient_number: formattedPhone,
        message_type: "invoice",
        message_status: messageStatus,
        twilio_message_sid: twilioMessageSid,
        message_body: messageBody,
        sent_at: messageStatus === "sent" ? new Date().toISOString() : null,
        error_message: errorMessage,
      })
      .select()
      .single()

    if (messageError) {
      console.error("[v0] Error logging WhatsApp message:", messageError)
      return NextResponse.json({ error: "Failed to log message" }, { status: 500 })
    }

    // Update invoice status to sent
    if (messageStatus === "sent") {
      await supabase
        .from("invoices")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", invoiceId)
    }

    return NextResponse.json({
      success: true,
      message:
        messageStatus === "sent"
          ? "Invoice sent via WhatsApp successfully"
          : "Invoice message logged (Twilio not configured)",
      whatsappMessage,
      messageStatus,
    })
  } catch (error: any) {
    console.error("[v0] Error sending invoice via WhatsApp:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
