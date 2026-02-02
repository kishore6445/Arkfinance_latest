import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params

    // Fetch all WhatsApp messages for this invoice
    const { data: messages, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("invoice_id", invoiceId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("[v0] Error fetching WhatsApp messages:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
