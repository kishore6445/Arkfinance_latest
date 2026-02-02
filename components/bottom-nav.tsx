"use client"

import { Settings as LucideSettings } from "lucide-react" // Import Settings icon

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, Receipt, BarChart3, Wallet, Users, Repeat, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DollarSign, PlusCircle, Settings as SettingsIcon } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/transactions", label: "Transactions", icon: BarChart3 },
    { href: "/accounts", label: "Money Buckets", icon: Wallet },
    { href: "/invoices", label: "Invoices", icon: Receipt },
    { href: "/clients", label: "Clients", icon: Users },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                pathname.startsWith("/transactions/new") ||
                  pathname.startsWith("/allocate") ||
                  pathname.startsWith("/payroll") ||
                  pathname.startsWith("/guidelines") ||
                  pathname.startsWith("/admin")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-56 mb-2">
            <DropdownMenuItem asChild>
              <Link href="/transactions/new" className="flex items-center gap-3 cursor-pointer">
                <PlusCircle className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold">Add Transaction</p>
                  <p className="text-xs text-muted-foreground">Record revenue or expense</p>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/invoices/new" className="flex items-center gap-3 cursor-pointer">
                <Receipt className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold">Create Invoice</p>
                  <p className="text-xs text-muted-foreground">Generate client invoice</p>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/reports" className="flex items-center gap-3 cursor-pointer">
                <BarChart3 className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold">Reports</p>
                  <p className="text-xs text-muted-foreground">View analytics & insights</p>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/allocate" className="flex items-center gap-3 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold">Allocate Funds</p>
                  <p className="text-xs text-muted-foreground">Distribute across buckets</p>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/admin/sweep" className="flex items-center gap-3 cursor-pointer">
                <Repeat className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold">Execute Sweep</p>
                  <p className="text-xs text-muted-foreground">Distribute pending allocations</p>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-3 cursor-pointer">
                <LucideSettings className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold">Admin Settings</p>
                  <p className="text-xs text-muted-foreground">Configure system</p>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
