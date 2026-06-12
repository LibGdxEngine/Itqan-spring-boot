import Image from "next/image"

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 bg-[#f5f4ed]">
      <div className="relative">
        {/* Terracotta pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#c96442]/20 animate-ping" />
        <div className="relative p-4 bg-[#faf9f5] rounded-2xl shadow-whisper animate-pulse">
          <Image
            src="/itqan_logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
        </div>
      </div>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e8e6dc]">
        <span className="block h-full w-1/2 rounded-full bg-[#c96442] animate-pulse" />
      </span>
    </div>
  )
}
