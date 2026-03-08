import Image from "next/image"

export const Logo = () => {
  return (
    <div className="shrink-0 size-16">
      <Image src="/canvas/logo.svg" alt="Canvas Logo" width={64} height={64} className="size-full object-contain" />
    </div>
  )
}
