export type UnderwritingDecision = 'Approve' | 'Refer' | 'Decline'

export interface UnderwritingRequest {
  user_id: string
  monthly_income: number
  monthly_debts: number
  loan_amount: number
  property_value: number
  credit_score: number
  occupancy_type: string
}

export interface UnderwritingFormValues {
  user_id: string
  monthly_income: string
  monthly_debts: string
  loan_amount: string
  property_value: string
  credit_score: string
  occupancy_type: string
}

export interface UnderwritingResponse extends UnderwritingRequest {
  decision: UnderwritingDecision
  dti?: number
  ltv?: number
  evaluated_at?: string
  reasons?: string[] | null
  [key: string]: unknown
}

export type UnderwritingHistory = UnderwritingResponse[]
