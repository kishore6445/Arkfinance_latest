"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, Calculator } from "lucide-react"

interface DashboardViewToggleProps {
  currentView: "owner" | "accountant"
  onViewChange: (view: "owner" | "accountant") => void
}

export function DashboardViewToggle({ currentView, onViewChange }: DashboardViewToggleProps) {
  return (
    <div className="flex gap-2 bg-muted p-1 rounded-lg">
      <Button
        variant={currentView === "owner" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("owner")}
        className="gap-2 rounded-md"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Owner View</span>
        <span className="sm:hidden">Owner</span>
      </Button>
      <Button
        variant={currentView === "accountant" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("accountant")}
        className="gap-2 rounded-md"
      >
        <Calculator className="h-4 w-4" />
        <span className="hidden sm:inline">Accountant View</span>
        <span className="sm:hidden">Accountant</span>
      </Button>
    </div>
  )
}
