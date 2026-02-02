import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: categories, error } = await supabase
      .from("transaction_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/categories:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { name, type, is_active, sort_order } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const { data: category, error } = await supabase
      .from("transaction_categories")
      .insert([
        {
          name,
          type,
          is_active: is_active ?? true,
          sort_order: sort_order ?? 0,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("[v0] Error in POST /api/categories:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
