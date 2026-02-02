"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Settings, ChevronRight } from "lucide-react"

export default function AdminPage() {
  const adminSections = [
    {
      title: "Category Master",
      description: "Manage business transaction categories (Revenue & Expense)",
      icon: BookOpen,
      href: "/admin/categories",
      color: "bg-blue-500",
    },
    {
      title: "Accounting Master",
      description: "Define accounting structure for Balance Sheet & P&L classification",
      icon: Settings,
      href: "/admin/accounting",
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage masters and system configuration</p>
        </div>

        <div className="grid gap-4">
          {adminSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card
                  className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  style={{ borderRadius: "16px" }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${section.color} flex items-center justify-center`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
