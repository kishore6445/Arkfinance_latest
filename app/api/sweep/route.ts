import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch pending allocations grouped by account
    const { data: pendingAllocations, error: allocationsError } = await supabase
      .from("allocations")
      .select(
        `
        *,
        to_account:to_account_id(id, name, slug, color, text_color, icon),
        from_account:from_account_id(id, name, balance),
        transaction:transaction_id(id, description, amount, created_at)
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    if (allocationsError) {
      console.error("[v0] Error fetching pending allocations:", allocationsError)
      return NextResponse.json({ error: allocationsError.message }, { status: 500 })
    }

    // Group by target account
    const groupedAllocations = (pendingAllocations || []).reduce(
      (acc, allocation) => {
        const accountId = allocation.to_account_id
        if (!acc[accountId]) {
          acc[accountId] = {
            account: allocation.to_account,
            total: 0,
            allocations: [],
          }
        }
        acc[accountId].total += Number(allocation.amount)
        acc[accountId].allocations.push(allocation)
        return acc
      },
      {} as Record<
        string,
        {
          account: any
          total: number
          allocations: any[]
        }
      >,
    )

    return NextResponse.json({
      pendingAllocations: pendingAllocations || [],
      groupedAllocations,
      totalPending: (pendingAllocations || []).reduce((sum, a) => sum + Number(a.amount), 0),
    })
  } catch (error: any) {
    console.error("[v0] Error in sweep GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all pending allocations
    const { data: pendingAllocations, error: allocationsError } = await supabase
      .from("allocations")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")

    if (allocationsError) {
      console.error("[v0] Error fetching allocations:", allocationsError)
      return NextResponse.json({ error: allocationsError.message }, { status: 500 })
    }

    if (!pendingAllocations || pendingAllocations.length === 0) {
      return NextResponse.json({ message: "No pending allocations to process" }, { status: 200 })
    }

    const completedAllocations = []
    const errors = []

    // Process each allocation
    for (const allocation of pendingAllocations) {
      try {
        const fromAccountId = allocation.from_account_id
        const toAccountId = allocation.to_account_id
        const amount = Number(allocation.amount)

        // Deduct from source account (default revenue account)
        const { data: fromAccount, error: fromError } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", fromAccountId)
          .single()

        if (fromError) throw fromError

        const newFromBalance = Number(fromAccount.balance) - amount

        const { error: updateFromError } = await supabase
          .from("accounts")
          .update({ balance: newFromBalance })
          .eq("id", fromAccountId)

        if (updateFromError) throw updateFromError

        // Add to target account
        const { data: toAccount, error: toError } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", toAccountId)
          .single()

        if (toError) throw toError

        const newToBalance = Number(toAccount.balance) + amount

        const { error: updateToError } = await supabase
          .from("accounts")
          .update({ balance: newToBalance })
          .eq("id", toAccountId)

        if (updateToError) throw updateToError

        // Update allocation status to completed
        const { error: statusError } = await supabase
          .from("allocations")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", allocation.id)

        if (statusError) throw statusError

        completedAllocations.push(allocation.id)
      } catch (error: any) {
        console.error(`[v0] Error processing allocation ${allocation.id}:`, error)
        errors.push({ allocationId: allocation.id, error: error.message })

        // Mark as failed
        await supabase
          .from("allocations")
          .update({
            status: "failed",
          })
          .eq("id", allocation.id)
      }
    }

    return NextResponse.json({
      success: true,
      completed: completedAllocations.length,
      failed: errors.length,
      errors,
    })
  } catch (error: any) {
    console.error("[v0] Error in sweep POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
