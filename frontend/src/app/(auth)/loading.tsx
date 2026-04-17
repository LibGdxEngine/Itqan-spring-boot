import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
        <div className="relative p-4 bg-white rounded-full shadow-xl">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      </div>
      <p className="text-sm text-slate-500 animate-pulse">
        Loading...
      </p>
    </div>
  )
}
