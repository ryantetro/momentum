export interface Photographer {
  id: string
  user_id: string
  business_name: string | null
  email: string
  contract_template: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  photographer_id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface PaymentMilestone {
  id: string
  name: string
  amount: number
  percentage: number | null
  due_date: string | null
  status: "pending" | "paid" | "overdue"
  paid_at: string | null
  stripe_payment_intent_id: string | null
}

export interface Booking {
  id: string
  photographer_id: string
  client_id: string
  service_type: "wedding" | "portrait"
  event_date: string
  total_price: number
  contract_template_id: string | null
  contract_text: string | null
  contract_signed: boolean
  contract_signed_at: string | null
  contract_signed_by: string | null
  client_signature_name: string | null
  payment_milestones: PaymentMilestone[]
  payment_status: "pending" | "partial" | "paid" | "overdue" | "PENDING_DEPOSIT" | "DEPOSIT_PAID"
  deposit_amount: number | null
  payment_due_date: string | null
  client_email: string | null
  last_reminder_sent: string | null
  portal_token: string
  status: "draft" | "contract_sent" | "contract_signed" | "payment_pending" | "completed" | "PROPOSAL_SENT"
  stripe_payment_intent_id: string | null
  created_at: string
  updated_at: string
  client?: Client
}

export interface ContractTemplate {
  id: string
  photographer_id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

