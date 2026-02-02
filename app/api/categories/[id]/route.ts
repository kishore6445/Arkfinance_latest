import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { id } = params

    const { name, type, is_active, sort_order } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    updateData.updated_at = new Date().toISOString()

    const { data: category, error } = await supabase
      .from("transaction_categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("[v0] Error in PATCH /api/categories/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params

    const { error } = await supabase.from("transaction_categories").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /api/categories/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
