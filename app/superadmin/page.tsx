"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Settings, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type Organization = {
  id: string
  name: string
  adminEmail: string
  userCount: number
  createdOn: string
}

export default function SuperAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: "1",
      name: "Sharma Enterprises",
      adminEmail: "rajesh@sharmaent.com",
      userCount: 5,
      createdOn: "2024-01-15",
    },
    {
      id: "2",
      name: "Kumar Trading Co.",
      adminEmail: "amit@kumartrading.com",
      userCount: 3,
      createdOn: "2024-02-20",
    },
    {
      id: "3",
      name: "Gupta Textiles",
      adminEmail: "priya@guptatextiles.com",
      userCount: 8,
      createdOn: "2024-03-10",
    },
  ])

  const [open, setOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [newAdminName, setNewAdminName] = useState("")
  const [newOrgEmail, setNewOrgEmail] = useState("")
  const [newIndustry, setNewIndustry] = useState("")
  const [newSize, setNewSize] = useState("small")
  const { toast } = useToast()

  const handleCreate = () => {
    toast({
      title: "Organization created (sample)",
      description: `${newOrgName} has been added to the system.`,
    })
    setOpen(false)
    setNewOrgName("")
    setNewAdminName("")
    setNewOrgEmail("")
    setNewIndustry("")
    setNewSize("small")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Platform Organizations</h2>
            <p className="text-muted-foreground">Manage organizations and system settings</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Plus className="mr-2 h-5 w-5" />
                Create New Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>Add a new organization to the platform.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="Enter organization name"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Admin Name</Label>
                  <Input
                    id="admin-name"
                    placeholder="Enter admin name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Manufacturing, Retail"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Organization Size</Label>
                  <Select value={newSize} onValueChange={setNewSize}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">Micro (1-10 employees)</SelectItem>
                      <SelectItem value="small">Small (11-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-250 employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-full">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex-1 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Table */}
        <Card className="shadow-lg" style={{ borderRadius: "16px" }}>
          <CardContent className="pt-6">
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Organization Name</TableHead>
                    <TableHead className="font-semibold">Admin Name</TableHead>
                    <TableHead className="font-semibold">Admin Email</TableHead>
                    <TableHead className="font-semibold text-center">Users Count</TableHead>
                    <TableHead className="font-semibold">Created On</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {org.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{org.adminEmail.split("@")[0]}</TableCell>
                      <TableCell className="text-muted-foreground">{org.adminEmail}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {org.userCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(org.createdOn).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
