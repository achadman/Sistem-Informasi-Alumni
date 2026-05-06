import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString, options = {}) {
  if (!dateString) return "-";
  
  // Internal format helper to keep code clean
  const format = (date, opts) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...opts
    }).format(date);
  };

  // Handle if it's already a Date object
  if (dateString instanceof Date) {
    if (isNaN(dateString.getTime())) return "-";
    return format(dateString, options);
  }

  try {
    // Robust normalized date parsing for PocketBase (YYYY-MM-DD HH:MM:SS.mmmZ)
    let normalized = String(dateString);
    if (normalized.includes(' ')) {
      normalized = normalized.replace(' ', 'T');
    }
    
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "-";
    
    return format(date, options);
  } catch (e) {
    return "-";
  }
}
