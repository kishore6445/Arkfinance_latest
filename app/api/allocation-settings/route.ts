import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch allocation settings with account details
    const { data, error } = await supabase
      .from("allocation_settings")
      .select("id, account_id, percentage, sweep_frequency, is_active, accounts!inner(id, name, slug, icon, color, text_color)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ settings: data || [] })
  } catch (error: any) {
    console.error("Error fetching allocation settings:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch allocation settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { settings, sweep_frequency } = body

    // Delete existing settings
    await supabase.from("allocation_settings").delete().eq("user_id", user.id)

    // Insert new settings
    const settingsToInsert = settings.map((setting: any) => ({
      user_id: user.id,
      account_id: setting.account_id,
      percentage: setting.percentage,
      sweep_frequency: sweep_frequency || "monthly",
      is_active: true,
    }))

    const { data, error } = await supabase.from("allocation_settings").insert(settingsToInsert).select()

    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (error: any) {
    console.error("Error saving allocation settings:", error)
    return NextResponse.json({ error: error.message || "Failed to save allocation settings" }, { status: 500 })
  }
}
