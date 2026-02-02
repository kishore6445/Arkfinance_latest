import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching accounts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/accounts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { account_name, bank_name, account_type, account_number, balance } = body

    if (!account_name || !bank_name || !account_number) {
      return NextResponse.json(
        { error: "Missing required fields: account_name, bank_name, account_number" },
        { status: 400 }
      )
    }

    const { data: newAccount, error } = await supabase.from("bank_accounts").insert([
      {
        user_id: user.id,
        account_name,
        bank_name,
        account_type: account_type || "current",
        account_number,
        balance: balance || 0,
      },
    ])

    if (error) {
      console.error("[v0] Error creating account:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ account: newAccount }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error in POST /api/accounts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
