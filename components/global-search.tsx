"use client"

import { useState, useEffect } from "react"
import { Search, FileText, Users, Calculator, FileCheck, TrendingUp, DollarSign, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  path: string
  icon: any
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const searchableData: SearchResult[] = [
    // Transactions
    {
      id: "txn1",
      title: "TXN001 - ABC Industries",
      description: "Product Sales ₹58,500",
      category: "Transactions",
      path: "/transactions",
      icon: FileText,
    },
    {
      id: "txn2",
      title: "TXN002 - Property Owner",
      description: "Rent ₹25,000",
      category: "Transactions",
      path: "/transactions",
      icon: FileText,
    },

    // Customers
    {
      id: "cust1",
      title: "ABC Technologies Pvt Ltd",
      description: "GSTIN: 29ABCDE1234F1Z5 • Bangalore",
      category: "Customers",
      path: "/clients",
      icon: Users,
    },
    {
      id: "cust2",
      title: "XYZ Corp India Ltd",
      description: "GSTIN: 27XYZ2AB5678G2H4 • Mumbai",
      category: "Customers",
      path: "/clients",
      icon: Users,
    },

    // Payroll
    {
      id: "pay1",
      title: "Rajesh Kumar",
      description: "Software Engineer • ₹75,000/month",
      category: "Payroll",
      path: "/payroll",
      icon: Calculator,
    },
    {
      id: "pay2",
      title: "Priya Sharma",
      description: "Marketing Manager • ₹65,000/month",
      category: "Payroll",
      path: "/payroll",
      icon: Calculator,
    },

    // Compliance
    {
      id: "comp1",
      title: "GSTR-1 Filing",
      description: "Due: 11th of every month",
      category: "Compliance",
      path: "/compliance",
      icon: FileCheck,
    },
    {
      id: "comp2",
      title: "GSTR-3B Filing",
      description: "Due: 20th of every month",
      category: "Compliance",
      path: "/compliance",
      icon: FileCheck,
    },

    // Finance Review
    {
      id: "fin1",
      title: "Q1 2024 Performance",
      description: "Revenue: ₹14.2L • Profit: 28%",
      category: "Finance Review",
      path: "/finance-review",
      icon: TrendingUp,
    },
    {
      id: "fin2",
      title: "Q2 2024 Performance",
      description: "Revenue: ₹15.8L • Profit: 31%",
      category: "Finance Review",
      path: "/finance-review",
      icon: TrendingUp,
    },

    // Pages
    {
      id: "page1",
      title: "Dashboard",
      description: "Overview of business metrics",
      category: "Navigation",
      path: "/dashboard",
      icon: DollarSign,
    },
    {
      id: "page2",
      title: "All Transactions",
      description: "View all transactions",
      category: "Navigation",
      path: "/transactions",
      icon: FileText,
    },
    {
      id: "page3",
      title: "Customers Management",
      description: "Manage customer relationships",
      category: "Navigation",
      path: "/clients",
      icon: Users,
    },
    {
      id: "page4",
      title: "Payroll Management",
      description: "Employee payroll and attendance",
      category: "Navigation",
      path: "/payroll",
      icon: Calculator,
    },
    {
      id: "page5",
      title: "Compliance Tracker",
      description: "GST & compliance management",
      category: "Navigation",
      path: "/compliance",
      icon: FileCheck,
    },
    {
      id: "page6",
      title: "Finance Review",
      description: "Year-in-review and insights",
      category: "Navigation",
      path: "/finance-review",
      icon: TrendingUp,
    },
  ]

  useEffect(() => {
    if (query.trim() === "") {
      setResults([])
      return
    }

    const filtered = searchableData.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    )

    setResults(filtered)
  }, [query])

  const handleSelect = (path: string) => {
    setOpen(false)
    setQuery("")
    router.push(path)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground mr-2" />
            <Input
              placeholder="Search transactions, customers, employees, filings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <ScrollArea className="max-h-96">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>No results found for "{query}"</p>
              </div>
            )}

            {query && results.length > 0 && (
              <div className="p-2">
                {Object.entries(
                  results.reduce(
                    (acc, result) => {
                      if (!acc[result.category]) acc[result.category] = []
                      acc[result.category].push(result)
                      return acc
                    },
                    {} as Record<string, SearchResult[]>,
                  ),
                ).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
                    {items.map((result) => {
                      const Icon = result.icon
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result.path)}
                          className="w-full flex items-start gap-3 px-2 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">{result.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">{result.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {!query && (
              <div className="p-4 space-y-4">
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Access
                  </div>
                  {searchableData
                    .filter((item) => item.category === "Navigation")
                    .slice(0, 6)
                    .map((result) => {
                      const Icon = result.icon
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result.path)}
                          className="w-full flex items-start gap-3 px-2 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">{result.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{result.description}</div>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
