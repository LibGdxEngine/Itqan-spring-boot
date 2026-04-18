import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="relative p-4 bg-[#faf9f5] rounded-full shadow-xl">
          <Loader2 className="w-8 h-8 text-[#c96442] animate-spin" />
        </div>
      </div>
      <p className="text-sm text-[#87867f] animate-pulse">
        Loading...
      </p>
    </div>
  )
}
