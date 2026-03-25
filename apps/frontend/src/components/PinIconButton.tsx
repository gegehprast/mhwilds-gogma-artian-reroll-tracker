import type { ReactNode } from "react"

interface PinIconButtonProps {
  label: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  variant?: "default" | "danger"
  fullHeight?: boolean
  children: ReactNode
}

export function PinIconButton({
  label,
  onClick,
  disabled,
  variant = "default",
  fullHeight = false,
  children,
}: PinIconButtonProps) {
  const hoverColor =
    variant === "danger"
      ? "hover:text-red-400 transition-colors"
      : "hover:text-gray-300 transition-opacity"

  const heightClass = fullHeight ? "h-full" : "shrink-0"

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`w-3 ${heightClass} text-gray-400 ${hoverColor} bg-transparent border-0 p-0 flex items-center justify-center gap-y-0.5 cursor-pointer select-none group disabled:opacity-40`}
    >
      {children}
    </button>
  )
}
