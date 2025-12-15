import { ContractTemplateEditor } from "@/components/settings/contract-template-editor"

export default function ContractSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contract Settings</h1>
        <p className="text-muted-foreground">
          Manage your contract template that will be used for all proposals
        </p>
      </div>
      <ContractTemplateEditor />
    </div>
  )
}

