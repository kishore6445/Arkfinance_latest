import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("category_id")

    if (!categoryId) {
      return NextResponse.json({ error: "category_id is required" }, { status: 400 })
    }

    const { data: mappings, error } = await supabase
      .from("category_account_mappings")
      .select(
        `
        *,
        account:accounts(id, name, slug)
      `,
      )
      .eq("category_id", categoryId)
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Error fetching category mappings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ mappings })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/category-mappings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { category_id, account_id, split_percentage } = body

    if (!category_id || !account_id || !split_percentage) {
      return NextResponse.json({ error: "category_id, account_id, and split_percentage are required" }, { status: 400 })
    }

    // Check total allocation doesn't exceed 100%
    const { data: existingMappings } = await supabase
      .from("category_account_mappings")
      .select("split_percentage")
      .eq("category_id", category_id)
      .eq("is_active", true)

    const currentTotal = existingMappings?.reduce((sum, m) => sum + Number(m.split_percentage), 0) || 0

    if (currentTotal + Number(split_percentage) > 100) {
      return NextResponse.json(
        { error: `Total allocation cannot exceed 100%. Current: ${currentTotal}%` },
        { status: 400 },
      )
    }

    const { data: mapping, error } = await supabase
      .from("category_account_mappings")
      .insert([
        {
          category_id,
          account_id,
          split_percentage: Number(split_percentage),
          is_active: true,
        },
      ])
      .select(
        `
        *,
        account:accounts(id, name, slug)
      `,
      )
      .single()

    if (error) {
      console.error("[v0] Error creating category mapping:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ mapping })
  } catch (error: any) {
    console.error("[v0] Error in POST /api/category-mappings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
