"use client"

import { useState, useEffect } from "react"

type DashboardView = "owner" | "accountant"

export function useDashboardView() {
  const [view, setView] = useState<DashboardView>("owner")
  const [isLoaded, setIsLoaded] = useState(false)

  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem("dashboardView") as DashboardView | null
    if (savedView && (savedView === "owner" || savedView === "accountant")) {
      setView(savedView)
    }
    setIsLoaded(true)
  }, [])

  // Save view preference to localStorage when it changes
  const updateView = (newView: DashboardView) => {
    setView(newView)
    localStorage.setItem("dashboardView", newView)
  }

  return {
    view,
    updateView,
    isLoaded,
  }
}
