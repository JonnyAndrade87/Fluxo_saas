import { Skeleton } from "@/components/ui/skeleton"

export default function CobrancasLoading() {
  return (
    <div className="space-y-8 pb-10">
      {/* Skeleton Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-md bg-indigo-50/50" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      {/* Skeleton Table Card */}
      <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-48 mb-6" />
        
        {/* Synthetic List */}
        <div className="space-y-4">
           {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-border/40">
                 <div className="flex gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                 </div>
                 <Skeleton className="h-5 w-24" />
                 <Skeleton className="h-5 w-16" />
              </div>
           ))}
        </div>
      </div>
    </div>
  )
}
