import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Twilio webhook to receive message status updates
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const messageSid = formData.get("MessageSid") as string
    const messageStatus = formData.get("MessageStatus") as string

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Find message by Twilio SID
    const { data: message, error: findError } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("twilio_message_sid", messageSid)
      .single()

    if (findError || !message) {
      console.log("[v0] Message not found for SID:", messageSid)
      return NextResponse.json({ success: true, message: "Message not found" })
    }

    // Update message status
    const updateData: any = {
      message_status: messageStatus,
      updated_at: new Date().toISOString(),
    }

    if (messageStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString()
    } else if (messageStatus === "read") {
      updateData.read_at = new Date().toISOString()
    } else if (messageStatus === "failed") {
      updateData.error_message = (formData.get("ErrorMessage") as string) || "Message delivery failed"
    }

    const { error: updateError } = await supabase.from("whatsapp_messages").update(updateData).eq("id", message.id)

    if (updateError) {
      console.error("[v0] Error updating message status:", updateError)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    console.log("[v0] Updated message status:", messageSid, messageStatus)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
