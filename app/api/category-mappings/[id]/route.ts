import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { error } = await supabase.from("category_account_mappings").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting category mapping:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /api/category-mappings/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
