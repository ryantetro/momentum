"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { marked } from "marked"

// Configure marked for better contract rendering
marked.use({
    gfm: true,
    breaks: true,
})

interface ContractPaperViewProps {
    content: string
    className?: string
}

export function ContractPaperView({ content, className }: ContractPaperViewProps) {
    const html = useMemo(() => {
        try {
            // Strip triple backticks if the AI wrapped the response in a markdown code block
            let cleanContent = content || ""
            if (cleanContent.trim().startsWith("```")) {
                cleanContent = cleanContent.trim().replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "")
            }
            return marked.parse(cleanContent)
        } catch (e) {
            console.error("Error parsing markdown:", e)
            return content || ""
        }
    }, [content])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "w-full max-w-4xl mx-auto bg-white min-h-[800px] flex flex-col",
                className
            )}
        >
            {/* Content Area */}
            <div className="p-8 md:p-12 flex-1">
                <div className={cn(
                    "prose prose-stone max-w-none",
                    "prose-headings:text-stone-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4",
                    "prose-p:text-stone-700 prose-p:leading-relaxed prose-p:mb-4",
                    "prose-strong:text-stone-900 prose-strong:font-bold",
                    "prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4",
                    "prose-li:text-stone-700 prose-li:mb-1",
                    "break-words overflow-wrap-anywhere"
                )}>
                    {content ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: html as string }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-stone-400 italic">
                            <p>Contract preview will appear here...</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
