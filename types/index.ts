export interface Photographer {
  id: string
  user_id: string
  business_name: string | null
  email: string
  contract_template: string | null
  stripe_account_id: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  // Business Profile fields
  studio_name: string | null
  phone: string | null
  logo_url: string | null
  website: string | null
  social_links: Record<string, string> | null
  // Payment settings
  default_currency: string | null
  pass_fees_to_client: boolean | null
  // Contract settings
  require_signature_audit: boolean | null
  // Notification preferences
  email_payment_reminders: boolean | null
  email_contract_signed: boolean | null
  email_payout_notifications: boolean | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  photographer_id: string
  name: string
  email: string
  phone: string | null
  notes: string | null
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
  service_type: string
  event_date: string
  total_price: number
  contract_template_id: string | null
  contract_text: string | null
  contract_signed: boolean
  contract_signed_at: string | null
  contract_signed_by: string | null
  client_signature_name: string | null
  signature_ip_address: string | null
  signature_user_agent: string | null
  payment_milestones: PaymentMilestone[]
  payment_status: "pending" | "partial" | "paid" | "overdue" | "PENDING_DEPOSIT" | "DEPOSIT_PAID"
  deposit_amount: number | null
  payment_due_date: string | null
  client_email: string | null
  last_reminder_sent: string | null
  portal_token: string
  inquiry_message: string | null
  status: "draft" | "contract_sent" | "contract_signed" | "payment_pending" | "completed" | "PROPOSAL_SENT" | "Inquiry"
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
  usage_count: number
  created_at: string
  updated_at: string
}

export interface ServicePackage {
  id: string
  photographer_id: string
  name: string
  service_type: string
  total_price: number
  deposit_percentage: number | null
  deposit_amount: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

