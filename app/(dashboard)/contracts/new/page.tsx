import { TemplateForm } from "@/components/contracts/template-form"

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Contract Template</h1>
        <p className="text-muted-foreground">
          Create a new contract template
        </p>
      </div>
      <TemplateForm />
    </div>
  )
}

