"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, AlertCircle } from "lucide-react"

interface BucketMapping {
  bucketId: string
  bucketName: string
  percentage: number
}

interface BankBucketMappingProps {
  bankAccountId: string
  bankAccountName: string
  availableBuckets: Array<{ id: string; name: string }>
  currentMappings: BucketMapping[]
  onSave: (mappings: BucketMapping[]) => void
}

export function BankBucketMapping({
  bankAccountId,
  bankAccountName,
  availableBuckets,
  currentMappings,
  onSave,
}: BankBucketMappingProps) {
  const [mappings, setMappings] = useState<BucketMapping[]>(currentMappings)
  const [selectedBucket, setSelectedBucket] = useState("")
  const [selectedPercentage, setSelectedPercentage] = useState("0")

  const totalPercentage = mappings.reduce((sum, m) => sum + m.percentage, 0)
  const isValid = totalPercentage <= 100

  const addMapping = () => {
    if (!selectedBucket || totalPercentage + Number(selectedPercentage) > 100) return

    const bucket = availableBuckets.find((b) => b.id === selectedBucket)
    if (!bucket) return

    const newMapping: BucketMapping = {
      bucketId: selectedBucket,
      bucketName: bucket.name,
      percentage: Number(selectedPercentage),
    }

    setMappings([...mappings, newMapping])
    setSelectedBucket("")
    setSelectedPercentage("0")
  }

  const removeMapping = (bucketId: string) => {
    setMappings(mappings.filter((m) => m.bucketId !== bucketId))
  }

  const updatePercentage = (bucketId: string, newPercentage: number) => {
    const otherTotal = mappings.filter((m) => m.bucketId !== bucketId).reduce((sum, m) => sum + m.percentage, 0)
    if (otherTotal + newPercentage <= 100) {
      setMappings(mappings.map((m) => (m.bucketId === bucketId ? { ...m, percentage: newPercentage } : m)))
    }
  }

  const handleSave = () => {
    if (isValid) {
      onSave(mappings)
    }
  }

  const availableForAllocation = 100 - totalPercentage
  const usedBucketIds = mappings.map((m) => m.bucketId)
  const unusedBuckets = availableBuckets.filter((b) => !usedBucketIds.includes(b.id))

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Configure Money Bucket Allocation</CardTitle>
        <CardDescription>Define which money buckets are stored in {bankAccountName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Mappings */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Current Allocations</Label>
            <Badge variant={isValid ? "default" : "destructive"}>
              {totalPercentage}% allocated
            </Badge>
          </div>

          {mappings.length === 0 ? (
            <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
              No money buckets allocated yet
            </div>
          ) : (
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div key={mapping.bucketId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{mapping.bucketName}</p>
                    <p className="text-xs text-muted-foreground">ID: {mapping.bucketId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={availableForAllocation + mapping.percentage}
                      value={mapping.percentage}
                      onChange={(e) => updatePercentage(mapping.bucketId, Number(e.target.value))}
                      className="w-20 text-center"
                    />
                    <span className="text-sm font-medium">%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMapping(mapping.bucketId)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Mapping */}
        <div className="border-t pt-4 space-y-3">
          <Label className="text-base font-semibold">Add Money Bucket</Label>
          
          {unusedBuckets.length === 0 ? (
            <div className="p-3 bg-muted rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              All money buckets are already allocated
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bucket-select" className="text-sm">
                    Select Money Bucket
                  </Label>
                  <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                    <SelectTrigger id="bucket-select">
                      <SelectValue placeholder="Choose bucket..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unusedBuckets.map((bucket) => (
                        <SelectItem key={bucket.id} value={bucket.id}>
                          {bucket.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="percentage-input" className="text-sm">
                    Percentage ({availableForAllocation}% available)
                  </Label>
                  <Input
                    id="percentage-input"
                    type="number"
                    min="1"
                    max={availableForAllocation}
                    value={selectedPercentage}
                    onChange={(e) => setSelectedPercentage(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button
                onClick={addMapping}
                disabled={!selectedBucket || Number(selectedPercentage) === 0 || totalPercentage >= 100}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Allocation
              </Button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t pt-4 flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid} className="flex-1">
            Save Allocations
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
