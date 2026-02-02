import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
        {/* Logo & Illustration */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <Shield className="h-24 w-24 text-primary relative" />
          </div>

          <img
            src="/indian-business-owner-reviewing-tablet-with-calm-p.jpg"
            alt="Business owner reviewing finances"
            className="w-full max-w-sm rounded-2xl shadow-2xl"
          />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-primary tracking-tight">Warrior Finance</h1>
          <p className="text-2xl font-semibold text-secondary">Clarity. Calm. Control.</p>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Built for Indian entrepreneurs who seek peace in numbers.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link href="/login">
            <Button
              size="lg"
              className="w-full rounded-full px-8 py-6 text-lg font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full px-8 py-6 text-lg font-semibold bg-transparent"
            >
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
