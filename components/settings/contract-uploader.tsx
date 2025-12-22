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
    const [skipAI, setSkipAI] = useState(false)
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

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("skipAI", skipAI.toString())

            const response = await fetch("/api/ai/parse-contract", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to parse contract")

            toast({
                title: skipAI ? "Imported raw text" : "Contract parsed!",
                description: skipAI
                    ? "Your contract text has been imported."
                    : "AI has formatted your document.",
            })

            onContractParsed(data.content)
        } catch (error: any) {
            toast({
                title: "Import failed",
                description: error.message || "Could not parse the document.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
            setIsProcessing(false)
        }
    }

    return (
        <Card className="border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-stone-600" />
                    Upload Contract
                </CardTitle>
                <CardDescription>
                    Import your PDF or Word contract.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                        <input
                            type="checkbox"
                            id="skip-ai"
                            checked={skipAI}
                            onChange={(e) => setSkipAI(e.target.checked)}
                            className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="skip-ai" className="cursor-pointer font-medium text-stone-700">
                            Import raw text only (Skip AI formatting)
                        </label>
                    </div>

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
                                        {isUploading ? "Uploading..." : (skipAI ? "Extracting Text..." : "AI Formatting...")}
                                    </p>
                                    <p className="text-sm text-stone-500 truncate px-4">
                                        {fileName}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    )
}
