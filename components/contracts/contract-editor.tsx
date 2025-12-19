"use client"

import { useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { VariablesSidebar } from "./variables-sidebar"
import { EditorAIAssistant } from "./editor-ai-assistant"
import { AIMagicToolbar } from "./ai-magic-toolbar"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { Loader2, Save, Bold, Italic, List, Heading1, Eye, EyeOff } from "lucide-react"
import type { ContractTemplate } from "@/types"
import { markdownToHtml, isMarkdown, ensureHtml } from "@/lib/markdown"

interface ContractEditorProps {
  templateId?: string
  initialData?: ContractTemplate
  initialContent?: string
  onSave?: () => void
}

export function ContractEditor({
  templateId,
  initialData,
  initialContent,
  onSave,
}: ContractEditorProps) {
  const [templateName, setTemplateName] = useState(initialData?.name || "")
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [originalContent, setOriginalContent] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState<string>("")
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)
  const [hasStreamed, setHasStreamed] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const sampleData: Record<string, string> = {
    "{{client_name}}": "John Doe",
    "{{event_date}}": "June 12, 2026",
    "{{total_price}}": "$5,000",
    "{{service_type}}": "Wedding",
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your contract... Use variables from the left sidebar.",
      }),
    ],
    content: initialContent || initialData?.content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[600px] text-foreground",
      },
    },
  })

  useEffect(() => {
    if (editor) {
      if (initialContent) {
        // Ensure content is HTML (converts Markdown if needed)
        let processedContent = ensureHtml(initialContent)
        
        // Check if this is a new AI-generated contract (streaming effect)
        const isNewGeneration = !templateId && initialContent.length > 100 && !hasStreamed
        
        if (isNewGeneration) {
          setHasStreamed(true)
          // Stream the content in sections with progressive reveal
          editor.commands.setContent("")
          
          // Parse HTML and split into sections
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = processedContent
          const elements = Array.from(tempDiv.children)
          
          // If no structured elements, split by paragraphs
          if (elements.length === 0) {
            const paragraphs = processedContent.split(/<\/p>|<\/h[1-6]>|<\/div>/).filter(p => p.trim().length > 0)
            let accumulatedContent = ""
            
            paragraphs.forEach((para, index) => {
              setTimeout(() => {
                if (editor) {
                  // Clean up the paragraph HTML
                  let cleanPara = para.replace(/<[^>]*>/g, "").trim()
                  if (cleanPara) {
                    accumulatedContent += (accumulatedContent ? "\n\n" : "") + `<p>${cleanPara}</p>`
                    editor.commands.setContent(accumulatedContent)
                  }
                  
                  if (index === paragraphs.length - 1) {
                    setTimeout(() => {
                      editor.commands.setContent(processedContent)
                      setOriginalContent(processedContent)
                    }, 300)
                  }
                }
              }, index * 200)
            })
          } else {
            // Stream structured elements
            let accumulatedContent = ""
            elements.forEach((element, index) => {
              setTimeout(() => {
                if (editor) {
                  accumulatedContent += element.outerHTML
                  editor.commands.setContent(accumulatedContent)
                  
                  if (index === elements.length - 1) {
                    setTimeout(() => {
                      editor.commands.setContent(processedContent)
                      setOriginalContent(processedContent)
                    }, 300)
                  }
                }
              }, index * 200)
            })
          }
        } else {
          editor.commands.setContent(processedContent)
          setOriginalContent(processedContent)
        }
      } else if (initialData?.content) {
        // Ensure content is HTML (converts Markdown if needed)
        let processedContent = ensureHtml(initialData.content)
        editor.commands.setContent(processedContent)
        setOriginalContent(processedContent)
      }

      // Handle text selection for AI toolbar
      const handleSelectionUpdate = () => {
        const { from, to } = editor.state.selection
        if (from !== to) {
          const selectedText = editor.state.doc.textBetween(from, to)
          if (selectedText.trim().length > 0) {
            setSelectedText(selectedText)
            // Get selection position
            const { view } = editor
            const coords = view.coordsAtPos(from)
            setToolbarPosition({ x: coords.left, y: coords.top })
          } else {
            setSelectedText("")
            setToolbarPosition(null)
          }
        } else {
          setSelectedText("")
          setToolbarPosition(null)
        }
      }

      editor.on("selectionUpdate", handleSelectionUpdate)
      editor.on("update", handleSelectionUpdate)

      return () => {
        editor.off("selectionUpdate", handleSelectionUpdate)
        editor.off("update", handleSelectionUpdate)
      }
    }
  }, [editor, initialContent, initialData])

  const handleReplaceText = (newText: string) => {
    if (editor) {
      const { from, to } = editor.state.selection
      editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run()
    }
  }

  const handlePreviewToggle = () => {
    if (!editor) return

    if (!previewMode) {
      // Entering preview mode - save original and replace variables
      const currentContent = editor.getHTML()
      setOriginalContent(currentContent)
      
      // Replace all variables with sample data
      let previewContent = currentContent
      Object.entries(sampleData).forEach(([variable, sample]) => {
        // Match variables in HTML (could be in text nodes or attributes)
        const regex = new RegExp(variable.replace(/[{}]/g, "\\$&"), "g")
        previewContent = previewContent.replace(regex, sample)
      })
      
      editor.commands.setContent(previewContent)
      setPreviewMode(true)
      
      toast({
        title: "Preview Mode",
        description: "Variables replaced with sample data. Click Preview again to edit.",
      })
    } else {
      // Exiting preview mode - restore original
      if (originalContent) {
        editor.commands.setContent(originalContent)
        setPreviewMode(false)
        
        toast({
          title: "Edit Mode",
          description: "Back to editing. Variables are now visible.",
        })
      }
    }
  }

  const handleInsertVariable = (variable: string) => {
    if (editor) {
      const { from } = editor.state.selection
      // Insert variable as plain text (TipTap will handle styling via CSS)
      editor.chain().focus().insertContent(variable).run()
      
      // Flash highlight the inserted variable by selecting it
      setTimeout(() => {
        const variableLength = variable.length
        const { to } = editor.state.selection
        editor.chain().setTextSelection({ from: from, to: from + variableLength }).run()
        
        // Add visual flash effect
        setTimeout(() => {
          editor.chain().setTextSelection({ from: to, to }).run()
        }, 400)
      }, 50)
    }
  }

  const handleSave = async () => {
    if (!editor || !templateName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/sign-in")
        return
      }

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) {
        throw new Error("Photographer not found")
      }

      const content = editor.getHTML()

      // If setting as default, unset other defaults
      if (isDefault) {
        await supabase
          .from("contract_templates")
          .update({ is_default: false })
          .eq("photographer_id", photographer.id)
      }

      if (templateId) {
        // Update
        const { error } = await supabase
          .from("contract_templates")
          .update({
            name: templateName,
            content: content,
            is_default: isDefault,
          })
          .eq("id", templateId)
          .eq("photographer_id", photographer.id)

        if (error) throw error

        toast({
          title: "Template Saved!",
          description: "This agreement is now ready to protect your next booking.",
        })
      } else {
        // Create
        const { error } = await supabase.from("contract_templates").insert({
          photographer_id: photographer.id,
          name: templateName,
          content: content,
          is_default: isDefault,
          usage_count: 0,
        })

        if (error) throw error

        toast({
          title: "Template Saved!",
          description: "This agreement is now ready to protect your next booking.",
        })
      }

      if (onSave) {
        onSave()
      } else {
        router.push("/contracts")
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const contractText = editor?.getText() || ""

  const handleContractUpdated = (newContract: string) => {
    if (!editor) return
    
    // Always ensure content is HTML (converts Markdown if needed)
    // AI-generated content is always Markdown, so this will convert it
    const content = ensureHtml(newContract)
    
    // Replace editor content with the updated contract
    editor.commands.setContent(content)
    
    // Show visual feedback - scroll to top and flash
    window.scrollTo({ top: 0, behavior: "smooth" })
    
    // Add a brief highlight effect by temporarily adding a class
    const editorElement = editor.view.dom
    editorElement.classList.add("contract-updated")
    setTimeout(() => {
      editorElement.classList.remove("contract-updated")
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header with template name and save */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Standard Wedding Contract"
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewToggle}
            className="flex items-center gap-2"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Preview with Sample Data
              </>
            )}
          </Button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Set as default</span>
          </label>
          <Button onClick={handleSave} disabled={saving || previewMode}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Variables */}
        <div className="lg:col-span-2">
          <VariablesSidebar onInsertVariable={handleInsertVariable} />
        </div>

        {/* Center - Editor */}
        <div className="lg:col-span-7">
          {/* Page View Wrapper - US Letter (8.5" x 11") */}
          <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg flex items-start justify-center min-h-[calc(100vh-200px)]">
            <div className="page-view-container">
              <div className={`page-view bg-white shadow-2xl ${previewMode ? "preview-mode" : ""}`}>
                {/* Simple Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b bg-gray-50 sticky top-0 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "bg-accent" : ""}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "bg-accent" : ""}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
                    title="Section Header"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "bg-accent" : ""}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviewToggle}
                    className={previewMode ? "bg-accent" : ""}
                  >
                    {previewMode ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </>
                    )}
                  </Button>
                </div>
                <div className="page-content relative">
                <style jsx global>{`
                  /* Page View Container - US Letter (8.5" x 11") */
                  .page-view-container {
                    width: 100%;
                    max-width: 8.5in;
                    margin: 0 auto;
                  }
                  
                  .page-view {
                    width: 8.5in;
                    min-height: 11in;
                    aspect-ratio: 8.5 / 11;
                    max-width: 100%;
                    display: flex;
                    flex-direction: column;
                  }
                  
                  .page-content {
                    flex: 1;
                    padding: 1in;
                    overflow-y: auto;
                  }
                  
                  /* Responsive scaling for smaller screens */
                  @media (max-width: 1024px) {
                    .page-view {
                      width: 100%;
                      aspect-ratio: 8.5 / 11;
                      min-height: auto;
                    }
                    
                    .page-content {
                      padding: 0.75in;
                    }
                  }
                  
                  @media (max-width: 768px) {
                    .page-content {
                      padding: 0.5in;
                    }
                  }
                  
                  /* TipTap Editor Styles */
                  .ProseMirror {
                    min-height: calc(11in - 2in);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #1a1a1a;
                  }
                  
                  /* Markdown Headers - Enhanced Visual Hierarchy */
                  .ProseMirror h1 {
                    font-size: 20pt;
                    font-weight: 700;
                    margin-top: 1.5em;
                    margin-bottom: 0.75em;
                    color: #1a1a1a;
                    line-height: 1.2;
                    page-break-after: avoid;
                  }
                  
                  .ProseMirror h2 {
                    font-size: 16pt;
                    font-weight: 600;
                    margin-top: 1.5em;
                    margin-bottom: 0.75em;
                    color: #1a1a1a;
                    line-height: 1.3;
                    page-break-after: avoid;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 0.25em;
                  }
                  
                  .ProseMirror h3 {
                    font-size: 14pt;
                    font-weight: 600;
                    margin-top: 1.25em;
                    margin-bottom: 0.5em;
                    color: #1a1a1a;
                    line-height: 1.4;
                    page-break-after: avoid;
                  }
                  
                  .ProseMirror h4 {
                    font-size: 12pt;
                    font-weight: 600;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                    color: #1a1a1a;
                  }
                  
                  /* Paragraphs - Professional Spacing */
                  .ProseMirror p {
                    margin-bottom: 0.875em;
                    line-height: 1.7;
                    text-align: justify;
                  }
                  
                  /* Lists - Better Spacing */
                  .ProseMirror ul,
                  .ProseMirror ol {
                    margin-left: 1.75em;
                    margin-bottom: 1em;
                    margin-top: 0.5em;
                    line-height: 1.6;
                  }
                  
                  .ProseMirror li {
                    margin-bottom: 0.375em;
                    line-height: 1.6;
                  }
                  
                  .ProseMirror li p {
                    margin-bottom: 0.25em;
                  }
                  
                  /* Bold text */
                  .ProseMirror strong {
                    font-weight: 600;
                    color: #1a1a1a;
                  }
                  
                  /* Signature Section - Side-by-side Layout */
                  .ProseMirror .signature-section {
                    display: flex;
                    gap: 3rem;
                    margin-top: 2.5em;
                    margin-bottom: 1em;
                    padding-top: 1.5em;
                    border-top: 2px solid #e5e7eb;
                  }
                  
                  .ProseMirror .signature-block {
                    flex: 1;
                    min-width: 0;
                  }
                  
                  .ProseMirror .signature-line {
                    border-bottom: 1px solid #1a1a1a;
                    margin-top: 3em;
                    margin-bottom: 0.5em;
                    min-height: 2em;
                  }
                  
                  .ProseMirror .signature-label {
                    font-size: 11pt;
                    color: #6b7280;
                    margin-top: 0.25em;
                  }
                  
                  /* Section Spacing */
                  .ProseMirror > * + * {
                    margin-top: 0.5em;
                  }
                  
                  /* Better spacing after headers */
                  .ProseMirror h1 + p,
                  .ProseMirror h2 + p,
                  .ProseMirror h3 + p {
                    margin-top: 0.75em;
                  }
                  
                  /* Variables styling */
                  .ProseMirror p:has-text("{{") {
                    color: inherit;
                  }
                  
                  /* Selection */
                  .ProseMirror ::selection {
                    background-color: #93c5fd;
                  }
                  
                  /* Visual feedback when contract is updated */
                  .contract-updated {
                    animation: contractFlash 1s ease-in-out;
                  }
                  
                  @keyframes contractFlash {
                    0% { background-color: transparent; }
                    50% { background-color: rgba(59, 130, 246, 0.1); }
                    100% { background-color: transparent; }
                  }
                  
                  /* Preview Mode Styling */
                  .page-view.preview-mode {
                    border: 2px solid #3b82f6;
                  }
                  
                  .page-view.preview-mode .page-content {
                    background: #fafafa;
                  }
                  
                  /* Print Styles */
                  @media print {
                    .page-view {
                      box-shadow: none;
                      width: 8.5in;
                      height: 11in;
                      page-break-after: always;
                    }
                    
                    .page-content {
                      padding: 1in;
                    }
                    
                    .ProseMirror {
                      font-family: "Times New Roman", Times, serif;
                      font-size: 12pt;
                      line-height: 1.5;
                    }
                    
                    .ProseMirror h1,
                    .ProseMirror h2,
                    .ProseMirror h3 {
                      page-break-after: avoid;
                    }
                    
                    .ProseMirror p,
                    .ProseMirror li {
                      orphans: 3;
                      widows: 3;
                    }
                    
                    /* Hide UI elements in print */
                    .page-view > div:first-child {
                      display: none;
                    }
                  }
                `}</style>
                <EditorContent editor={editor} />
                {toolbarPosition && selectedText && (
                  <AIMagicToolbar
                    selectedText={selectedText}
                    position={toolbarPosition}
                    onReplace={handleReplaceText}
                    onClose={() => {
                      setToolbarPosition(null)
                      setSelectedText("")
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="lg:col-span-3">
          <EditorAIAssistant 
            contractText={contractText} 
            onContractUpdated={handleContractUpdated}
          />
        </div>
      </div>
    </div>
  )
}

