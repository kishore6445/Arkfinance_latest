"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ShoppingBag, IndianRupee, Building2, CreditCard, User, FileText, Tag, TrendingUp } from "lucide-react"

const colors = [
  { name: "Blue", value: "#1565C0" },
  { name: "Green", value: "#2E7D32" },
  { name: "Orange", value: "#F57C00" },
  { name: "Purple", value: "#7B1FA2" },
  { name: "Red", value: "#D32F2F" },
  { name: "Grey", value: "#616161" },
]

const icons = [
  { name: "Shopping", Icon: ShoppingBag },
  { name: "Rupee", Icon: IndianRupee },
  { name: "Building", Icon: Building2 },
  { name: "Card", Icon: CreditCard },
  { name: "Person", Icon: User },
  { name: "Document", Icon: FileText },
  { name: "Tag", Icon: Tag },
  { name: "Trending", Icon: TrendingUp },
]

interface AddCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryAdded?: (category: { name: string; type: string; color: string; icon: string }) => void
}

export function AddCategoryModal({ open, onOpenChange, onCategoryAdded }: AddCategoryModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [selectedColor, setSelectedColor] = useState(colors[0].value)
  const [selectedIcon, setSelectedIcon] = useState(icons[0].name)
  const { toast } = useToast()

  const handleSave = () => {
    if (!name.trim() || !type) {
      toast({
        title: "Missing information",
        description: "Please fill in category name and type.",
        variant: "destructive",
      })
      return
    }

    const newCategory = {
      name: name.trim(),
      type,
      color: selectedColor,
      icon: selectedIcon,
    }

    onCategoryAdded?.(newCategory)

    toast({
      title: "Category added",
      description: `"${name}" has been added to your categories. (Mock only)`,
    })

    // Reset form
    setName("")
    setType("")
    setSelectedColor(colors[0].value)
    setSelectedIcon(icons[0].name)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setName("")
    setType("")
    setSelectedColor(colors[0].value)
    setSelectedIcon(icons[0].name)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Category</DialogTitle>
          <DialogDescription className="text-base">
            Create a new category to group similar transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-base font-semibold">
              Category Name
            </Label>
            <Input
              id="category-name"
              placeholder="e.g., Raw Material, Office Rent, Online Sales"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-2xl border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-type" className="text-base font-semibold">
              Type
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="category-type" className="h-12 rounded-2xl border-2">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Color</Label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-full transition-all duration-200 ${
                    selectedColor === color.value ? "ring-4 ring-primary ring-offset-2" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Icon (Optional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {icons.map(({ name, Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIcon(name)}
                  className={`h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    selectedIcon === name
                      ? "bg-secondary text-secondary-foreground ring-2 ring-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  title={name}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-12 rounded-full px-6 border-2 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-12 rounded-full px-6 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            Save Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
