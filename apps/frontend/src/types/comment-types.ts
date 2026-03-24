export const COMMENT_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
  "pink",
] as const

export type CommentColor = (typeof COMMENT_COLORS)[number]

export const COMMENT_COLOR_CLASSES: Record<
  CommentColor,
  { bg: string; ring: string; text: string }
> = {
  red: { bg: "bg-red-500", ring: "ring-red-500", text: "text-red-400" },
  orange: {
    bg: "bg-orange-500",
    ring: "ring-orange-500",
    text: "text-orange-400",
  },
  yellow: {
    bg: "bg-yellow-400",
    ring: "ring-yellow-400",
    text: "text-yellow-300",
  },
  green: { bg: "bg-green-500", ring: "ring-green-500", text: "text-green-400" },
  blue: { bg: "bg-blue-500", ring: "ring-blue-500", text: "text-blue-400" },
  violet: {
    bg: "bg-violet-500",
    ring: "ring-violet-500",
    text: "text-violet-400",
  },
  pink: { bg: "bg-pink-500", ring: "ring-pink-500", text: "text-pink-400" },
}

// Local type until OpenAPI is regenerated after migration
export interface Comment {
  id: string
  rollId: string
  rollType: "skill" | "bonus"
  content: string
  color: CommentColor
  createdAt: number
  updatedAt: number
}
