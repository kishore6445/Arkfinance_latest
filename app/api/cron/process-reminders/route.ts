import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// This route should be called by a cron job (Vercel Cron or external service)
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log("[v0] Processing invoice reminders for date:", today.toISOString())

    // Find all unpaid invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, grand_total, due_date, client_phone, user_id")
      .neq("status", "paid")

    if (invoicesError) {
      console.error("[v0] Error fetching invoices:", invoicesError)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    if (!invoices || invoices.length === 0) {
      console.log("[v0] No unpaid invoices found")
      return NextResponse.json({ success: true, message: "No unpaid invoices to process", reminders: 0 })
    }

    console.log("[v0] Found", invoices.length, "unpaid invoices")

    const remindersToCreate = []
    const remindersToSend = []

    for (const invoice of invoices) {
      if (!invoice.client_phone) {
        console.log("[v0] Skipping invoice", invoice.invoice_number, "- no phone number")
        continue
      }

      const dueDate = new Date(invoice.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let reminderType: string | null = null

      if (daysDiff === 3) {
        reminderType = "before_due"
      } else if (daysDiff === 0) {
        reminderType = "on_due"
      } else if (daysDiff === -3) {
        reminderType = "overdue_3"
      } else if (daysDiff === -7) {
        reminderType = "overdue_7"
      } else if (daysDiff === -15) {
        reminderType = "overdue_15"
      }

      if (reminderType) {
        // Check if reminder already exists for this invoice and type
        const { data: existingReminder } = await supabase
          .from("invoice_reminders")
          .select("*")
          .eq("invoice_id", invoice.id)
          .eq("reminder_type", reminderType)
          .single()

        if (!existingReminder) {
          console.log(
            "[v0] Creating reminder for invoice",
            invoice.invoice_number,
            "type:",
            reminderType,
            "days diff:",
            daysDiff,
          )
          remindersToCreate.push({
            invoice_id: invoice.id,
            user_id: invoice.user_id,
            reminder_type: reminderType,
            scheduled_date: today.toISOString().split("T")[0],
            status: "pending",
          })

          remindersToSend.push({
            invoiceId: invoice.id,
            phoneNumber: invoice.client_phone,
            reminderType,
          })
        } else {
          console.log("[v0] Reminder already exists for invoice", invoice.invoice_number, "type:", reminderType)
        }
      }
    }

    // Create reminder records
    if (remindersToCreate.length > 0) {
      const { error: createError } = await supabase.from("invoice_reminders").insert(remindersToCreate)

      if (createError) {
        console.error("[v0] Error creating reminders:", createError)
        return NextResponse.json({ error: "Failed to create reminders" }, { status: 500 })
      }

      console.log("[v0] Created", remindersToCreate.length, "reminder records")
    }

    // Send reminders via WhatsApp
    let sentCount = 0
    for (const reminder of remindersToSend) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whatsapp/send-reminder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reminder),
          },
        )

        if (response.ok) {
          sentCount++
          console.log("[v0] Sent reminder for invoice:", reminder.invoiceId)
        } else {
          console.error("[v0] Failed to send reminder for invoice:", reminder.invoiceId)
        }
      } catch (error) {
        console.error("[v0] Error sending reminder:", error)
      }
    }

    console.log("[v0] Processed reminders - Created:", remindersToCreate.length, "Sent:", sentCount)

    return NextResponse.json({
      success: true,
      created: remindersToCreate.length,
      sent: sentCount,
      message: `Processed ${remindersToCreate.length} reminders, sent ${sentCount} messages`,
    })
  } catch (error: any) {
    console.error("[v0] Error processing reminders:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
