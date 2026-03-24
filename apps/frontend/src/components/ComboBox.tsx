import { useEffect, useRef, useState } from "react"

interface ComboBoxProps {
  value: string
  onChange?: (value: string) => void
  onCommit?: (value: string) => void
  onNextFocus?: () => void
  options: readonly string[]
  placeholder?: string
  inputBg?: string
}

export function ComboBox({
  value,
  onChange,
  onCommit,
  onNextFocus,
  options,
  placeholder,
  inputBg = "bg-gray-800",
}: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(inputValue.toLowerCase()),
  )

  function select(opt: string) {
    setInputValue(opt)
    setOpen(false)
    setHighlighted(-1)
    if (onCommit) {
      onCommit(opt)
    } else {
      onChange?.(opt)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputValue(v)
    setHighlighted(-1)
    setOpen(true)
    onChange?.(v)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlighted >= 0 && highlighted < filtered.length) {
        select(filtered[highlighted])
      } else {
        setOpen(false)
        if (onCommit) {
          onCommit(inputValue)
        } else {
          onNextFocus?.()
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setHighlighted(-1)
    } else if (e.key === "Tab") {
      setOpen(false)
    }
  }

  function handleBlur(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlighted])

  return (
    <div
      ref={containerRef}
      className="relative"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      tabIndex={-1}
      onBlur={handleBlur}
    >
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full ${inputBg} text-gray-200 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-red-500/60 placeholder-gray-600`}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-0.5 max-h-48 overflow-auto bg-gray-900 border border-gray-700 rounded shadow-lg text-xs text-gray-200"
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                select(opt)
              }}
              className={`px-2 py-1 cursor-pointer ${
                i === highlighted
                  ? "bg-red-500/30 text-red-200"
                  : "hover:bg-gray-700"
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
