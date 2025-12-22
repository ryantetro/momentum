/**
 * Helper functions for detecting and messaging Stripe account requirements
 */

export interface StripeRequirements {
  past_due: string[]
  currently_due: string[]
  eventually_due: string[]
  current_deadline: number | null
  errors: any[]
}

/**
 * Check if account needs identity verification (SSN/ID)
 */
export function needsIdentity(requirements: StripeRequirements | null): boolean {
  if (!requirements) return false
  
  const allRequirements = [
    ...requirements.past_due,
    ...requirements.currently_due,
    ...requirements.eventually_due,
  ]
  
  return allRequirements.some(
    (req) =>
      req.includes('individual.id_number') ||
      req.includes('individual.ssn_last_4') ||
      req.includes('individual.verification.document')
  )
}

/**
 * Check if account needs bank account information
 */
export function needsBankAccount(requirements: StripeRequirements | null): boolean {
  if (!requirements) return false
  
  const allRequirements = [
    ...requirements.past_due,
    ...requirements.currently_due,
    ...requirements.eventually_due,
  ]
  
  return allRequirements.some((req) => req.includes('external_account'))
}

/**
 * Check if account is restricted (has past_due items)
 */
export function isRestricted(requirements: StripeRequirements | null): boolean {
  if (!requirements) return false
  return requirements.past_due.length > 0
}

/**
 * Check if account has requirements that are currently due
 */
export function hasCurrentlyDue(requirements: StripeRequirements | null): boolean {
  if (!requirements) return false
  return requirements.currently_due.length > 0
}

/**
 * Get user-friendly message for requirements
 */
export function getRequirementMessage(requirements: StripeRequirements | null): string {
  if (!requirements) return ""
  
  if (requirements.past_due.length > 0) {
    if (needsIdentity(requirements)) {
      return "Action Required: Payouts are currently paused. Please provide your Social Security Number (SSN) to resume payments."
    }
    return "Action Required: Payouts are currently paused. Please complete verification to resume payments."
  }
  
  if (requirements.currently_due.length > 0) {
    if (needsIdentity(requirements)) {
      return "Complete verification to avoid payment delays. Your Social Security Number (SSN) is required."
    }
    return "Complete verification to avoid payment delays."
  }
  
  return ""
}

/**
 * Get requirement state: 'complete' | 'warning' | 'error'
 */
export function getRequirementState(
  stripeConnected: boolean,
  requirements: StripeRequirements | null
): 'complete' | 'warning' | 'error' {
  if (!stripeConnected) return 'complete'
  if (!requirements) return 'complete'
  
  if (isRestricted(requirements)) return 'error'
  if (hasCurrentlyDue(requirements)) return 'warning'
  return 'complete'
}



