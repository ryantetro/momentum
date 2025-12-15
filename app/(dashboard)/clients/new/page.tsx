import { ClientForm } from "@/components/clients/client-form"

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
        <p className="text-muted-foreground">
          Create a new client in your database
        </p>
      </div>
      <ClientForm />
    </div>
  )
}

