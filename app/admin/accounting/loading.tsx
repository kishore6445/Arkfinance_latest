export default function LoadingAccountingMaster() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="h-16 bg-card border-b" />
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-2xl w-1/3" />
          <div className="h-4 bg-muted rounded-2xl w-2/3" />
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </main>
    </div>
  )
}
