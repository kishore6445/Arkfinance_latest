"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Mail, User, Moon, Sun, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { toast } = useToast()

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")

    toast({
      title: `${newTheme === "dark" ? "Warrior Dark" : "Light"} mode activated`,
      description: `Switched to ${newTheme} theme successfully.`,
    })
  }

  const toggleLanguage = () => {
    const newLang = language === "en" ? "hi" : "en"
    setLanguage(newLang)

    toast({
      title: "Language preference updated",
      description: `Switched to ${newLang === "hi" ? "Hindi" : "English"}.`,
    })
  }

  const handleEditProfile = () => {
    setShowEditModal(true)
  }

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  const handleSignOut = () => {
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    })
  }

  const handleSaveProfile = () => {
    setShowEditModal(false)
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    })
  }

  const handleSavePassword = () => {
    setShowPasswordModal(false)
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header Card */}
        <Card className="shadow-lg" style={{ borderRadius: "16px" }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">RS</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">Rajesh Sharma</h2>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    rajesh@sharmaent.com
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Sharma Enterprises
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Business Owner
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="shadow-lg" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle className="text-xl">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <Label htmlFor="theme-toggle" className="text-base font-semibold cursor-pointer">
                    Theme
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === "light" ? "Light Mode" : "Warrior Dark Mode"}
                  </p>
                </div>
              </div>
              <Switch id="theme-toggle" checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            {/* Language Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="language-toggle" className="text-base font-semibold cursor-pointer">
                    Language
                  </Label>
                  <p className="text-sm text-muted-foreground">{language === "en" ? "English" : "Hindi (हिंदी)"}</p>
                </div>
              </div>
              <Switch id="language-toggle" checked={language === "hi"} onCheckedChange={toggleLanguage} />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="shadow-lg" style={{ borderRadius: "16px" }}>
          <CardHeader>
            <CardTitle className="text-xl">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleEditProfile}
              variant="outline"
              className="w-full h-12 rounded-full justify-start text-left font-semibold bg-transparent"
            >
              Edit Profile
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="outline"
              className="w-full h-12 rounded-full justify-start text-left font-semibold bg-transparent"
            >
              Change Password
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full h-12 rounded-full justify-start text-left font-semibold text-destructive hover:text-destructive bg-transparent"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav />

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" defaultValue="Rajesh Sharma" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" defaultValue="rajesh@sharmaent.com" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company Name</Label>
              <Input id="edit-company" defaultValue="Sharma Enterprises" className="rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="flex-1 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" className="rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1 rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSavePassword}
              className="flex-1 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
