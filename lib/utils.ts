import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string (YYYY-MM-DD or ISO) into a Date object
 * while accounting for timezone shifts that occur with date-only strings.
 */
export function parseDateSafe(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null
  if (dateStr instanceof Date) return dateStr

  // If it's a date-only string (YYYY-MM-DD), parse it as local time
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  // Fallback to parseISO for other ISO strings
  try {
    return parseISO(dateStr)
  } catch (e) {
    return new Date(dateStr)
  }
}

/**
 * Formats a date string or object safely using the parseDateSafe utility
 */
export function formatDateSafe(
  date: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy"
): string {
  const d = parseDateSafe(date)
  if (!d || isNaN(d.getTime())) return "N/A"
  return format(d, formatStr)
}





