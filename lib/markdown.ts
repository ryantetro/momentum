import { marked } from "marked"

/**
 * Converts Markdown text to HTML for TipTap editor
 * Handles Markdown headers (##), bold (**text**), lists (-), and preserves variables
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== "string") {
    return ""
  }

  try {
    // Configure marked options (v17+ API)
    const html = marked(markdown.trim(), {
      gfm: true,
      breaks: false,
      headerIds: false,
      mangle: false,
    })
    
    // marked v17+ returns a string directly
    if (typeof html === "string") {
      return html
    }
    
    // Fallback if it's not a string
    return markdown
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error)
    // Fallback: return markdown as plain text wrapped in paragraphs
    return `<p>${markdown.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
  }
}

/**
 * Safely converts content to HTML, handling both Markdown and HTML input
 * If content is already HTML, returns it as-is. If it's Markdown, converts it.
 */
export function ensureHtml(content: string): string {
  if (!content || typeof content !== "string") {
    return ""
  }

  // If it's already HTML (has HTML tags), return as-is
  if (/<[a-z][\s\S]*>/i.test(content) && !isMarkdown(content)) {
    return content
  }

  // If it looks like Markdown, convert it
  if (isMarkdown(content)) {
    return markdownToHtml(content)
  }

  // If it's plain text, wrap in paragraphs
  return `<p>${content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
}

/**
 * Checks if a string appears to be Markdown (contains Markdown syntax)
 * More aggressive detection to catch Markdown even if mixed with HTML
 */
export function isMarkdown(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false
  }

  // If it already contains HTML tags (like <p>, <h1>, etc.), it's likely already HTML
  // But we still check for Markdown patterns in case it's mixed
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text)
  
  // Check for common Markdown patterns
  const markdownPatterns = [
    /^##\s+/m,           // Headers (##)
    /\*\*[^*]+\*\*/,     // Bold (**text**)
    /^-\s+/m,            // Bullet lists (-)
    /^\d+\.\s+/m,        // Numbered lists (1.)
    /^#{1,6}\s+/m,       // ATX headers (#)
    /\*\*[^*]+?\*\*/,    // Bold with non-greedy match
    /__[^_]+?__/,        // Bold with underscores
    /\*[^*]+?\*/,        // Italic with asterisks
    /_[^_]+?_/,          // Italic with underscores
  ]

  const hasMarkdown = markdownPatterns.some(pattern => pattern.test(text))
  
  // If it has Markdown patterns but no HTML tags, it's definitely Markdown
  if (hasMarkdown && !hasHtmlTags) {
    return true
  }
  
  // If it has Markdown patterns and HTML tags, check if Markdown appears more frequently
  // This handles mixed content
  if (hasMarkdown && hasHtmlTags) {
    const markdownCount = (text.match(/\*\*|##|^-\s+|^#{1,6}\s+/gm) || []).length
    const htmlTagCount = (text.match(/<[a-z][\s\S]*?>/gi) || []).length
    // If Markdown patterns are more common, treat as Markdown
    return markdownCount > htmlTagCount / 2
  }
  
  return false
}

