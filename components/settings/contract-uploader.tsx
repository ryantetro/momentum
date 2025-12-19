"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ContractUploaderProps {
    onContractParsed: (content: string) => void
}

export function ContractUploader({ onContractParsed }: ContractUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if (!validTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Please upload a PDF or DOCX file.",
                variant: "destructive",
            })
            return
        }

        setFileName(file.name)
        setIsUploading(true)

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsUploading(false)
        setIsProcessing(true)

        try {
            // In a real app, we would upload the file to storage and then call the AI
            // For this demo, we'll simulate the AI parsing the document
            const response = await fetch("/api/ai/parse-contract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: file.name, fileType: file.type }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to parse contract")

            toast({
                title: "Contract parsed!",
                description: "AI has identified dynamic fields and converted your document.",
            })

            onContractParsed(data.content)
        } catch (error: any) {
            toast({
                title: "Parsing failed",
                description: error.message || "Could not parse the document.",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Card className="border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-stone-600" />
                    Upload Existing Contract
                </CardTitle>
                <CardDescription>
                    Upload your PDF or Word contract and our AI will convert it into a dynamic Momentum template.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <AnimatePresence mode="wait">
                        {!isUploading && !isProcessing ? (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="space-y-4"
                            >
                                <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-stone-400" />
                                </div>
                                <div>
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        className="bg-white"
                                    >
                                        Select Document
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx"
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-stone-500">Supports PDF and DOCX up to 10MB</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="active"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 w-full max-w-xs"
                            >
                                <div className="relative mx-auto w-20 h-20">
                                    <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                                    <motion.div
                                        className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isUploading ? <Upload className="h-8 w-8 text-blue-600" /> : <Sparkles className="h-8 w-8 text-blue-600" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-semibold text-stone-800">
                                        {isUploading ? "Uploading..." : "AI is Analyzing..."}
                                    </p>
                                    <p className="text-sm text-stone-500 truncate px-4">
                                        {fileName}
                                    </p>
                                </div>

                                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-600"
                                        initial={{ width: "0%" }}
                                        animate={{ width: isUploading ? "50%" : "100%" }}
                                        transition={{ duration: 2 }}
                                    />
                                </div>

                                <p className="text-xs text-stone-400 italic">
                                    {isProcessing ? "Identifying names, dates, and legal clauses..." : "Preparing secure upload..."}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    )
}
