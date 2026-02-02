"use client"

import { useState } from "react"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "@/components/global-search"
import { Breadcrumbs } from "@/components/breadcrumbs"

export function Header() {
  const [viewAs, setViewAs] = useState<"owner" | "accountant">("owner")

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border backdrop-blur supports-[backdrop-filter]:bg-card/60"
      style={{
        background: "linear-gradient(90deg, #0D47A1 0%, #0D47A1 92%, rgba(249, 168, 37, 0.2) 100%)",
      }}
    >
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Warrior Finance</h1>
            <p className="text-xs text-blue-100">Clarity. Calm. Control.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-100 hidden sm:inline">View as:</span>
            <Button
              variant={viewAs === "owner" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewAs("owner")}
              className="rounded-full transition-all duration-200"
            >
              Owner
            </Button>
            <Button
              variant={viewAs === "accountant" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewAs("accountant")}
              className="rounded-full transition-all duration-200"
            >
              Accountant
            </Button>
          </div>
        </div>
      </div>
      <Breadcrumbs />
    </header>
  )
}
