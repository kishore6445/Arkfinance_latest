import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, amount, date, notes, category_id } = body

    console.log("[v0] Creating transaction with category_id:", category_id)

    let accountId = null
    let classificationStatus = "recorded"
    let shouldAutoAllocate = false

    if (category_id) {
      const { data: mappings } = await supabase
        .from("category_account_mappings")
        .select("account_id, split_percentage")
        .eq("category_id", category_id)
        .eq("is_active", true)

      console.log("[v0] Found mappings:", mappings)

      if (mappings && mappings.length > 0) {
        const primaryMapping = mappings.find((m) => m.split_percentage === 100) || mappings[0]
        accountId = primaryMapping.account_id
        classificationStatus = "classified"

        console.log("[v0] Auto-assigning to account:", accountId)

        if (type === "revenue") {
          await supabase.rpc("increment_account_balance", {
            account_uuid: accountId,
            increment_amount: amount,
          })
          console.log("[v0] Incremented account balance by", amount)
        } else if (type === "expense") {
          await supabase.rpc("decrement_account_balance", {
            account_uuid: accountId,
            decrement_amount: amount,
          })
          console.log("[v0] Decremented account balance by", amount)
        }
      }
    }

    if (!accountId && type === "revenue") {
      const { data: revenueAccount } = await supabase
        .from("accounts")
        .select("id, account_type")
        .eq("user_id", user.id)
        .eq("account_type", "revenue")
        .single()

      if (revenueAccount) {
        accountId = revenueAccount.id
        shouldAutoAllocate = true

        await supabase.rpc("increment_account_balance", {
          account_uuid: accountId,
          increment_amount: amount,
        })
        console.log("[v0] Added revenue to default account - will auto-allocate")
      }
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: accountId,
        category_id,
        type,
        title,
        amount,
        notes,
        date,
        classification_status: classificationStatus,
        category: title,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating transaction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const allocations = []
    if (shouldAutoAllocate) {
      const { data: settings } = await supabase
        .from("allocation_settings")
        .select("account_id, percentage, accounts!inner(id, name)")
        .eq("user_id", user.id)
        .eq("is_active", true)

      if (settings && settings.length > 0) {
        console.log("[v0] Auto-allocating revenue based on settings")

        for (const setting of settings) {
          const allocatedAmount = (amount * setting.percentage) / 100

          // Create allocation record
          await supabase.from("allocations").insert({
            user_id: user.id,
            transaction_id: data.id,
            from_account_id: accountId,
            to_account_id: setting.account_id,
            amount: allocatedAmount,
            percentage: setting.percentage,
            status: "pending",
          })

          allocations.push({
            account_name: setting.accounts.name,
            percentage: setting.percentage,
            amount: allocatedAmount,
          })
        }

        console.log("[v0] Created allocation records:", allocations.length)
      }
    }

    console.log("[v0] Transaction created successfully:", data.id)
    return NextResponse.json({
      ...data,
      allocations: allocations.length > 0 ? allocations : undefined,
      will_auto_allocate: shouldAutoAllocate,
    })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
