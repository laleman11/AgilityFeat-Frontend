import type {
  UnderwritingDecision,
  UnderwritingHistory,
  UnderwritingRequest,
  UnderwritingResponse,
} from '../types/underwriting'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await extractErrorMessage(response)
    throw new Error(message)
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data === 'string') return data
    if (data && typeof data.message === 'string') return data.message
    if (data && typeof data.error === 'string') return data.error
  } catch (error) {
    // ignore JSON parsing errors and fall through to default message
  }

  return `Request failed with status ${response.status}`
}

function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function coerceOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function coerceInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function normalizeDecision(value: unknown): UnderwritingDecision {
  const decision = normalizeString(value).toLowerCase()

  switch (decision) {
    case 'approve':
      return 'Approve'
    case 'decline':
      return 'Decline'
    case 'refer':
      return 'Refer'
    default:
      return 'Refer'
  }
}

function normalizeReasons(value: unknown): string[] | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => normalizeString(item))
      .filter((item) => item.length > 0)
    return cleaned.length > 0 ? cleaned : null
  }

  const single = normalizeString(value)
  return single.length > 0 ? [single] : null
}

interface RawUnderwritingRequest {
  UserID?: unknown
  user_id?: unknown
  userId?: unknown
  MonthlyIncome?: unknown
  monthly_income?: unknown
  MonthlyDebts?: unknown
  monthly_debts?: unknown
  LoanAmount?: unknown
  loan_amount?: unknown
  PropertyValue?: unknown
  property_value?: unknown
  CreditScore?: unknown
  credit_score?: unknown
  OccupancyType?: unknown
  occupancy_type?: unknown
}

interface RawUnderwritingResponse {
  Decision?: unknown
  decision?: unknown
  DTI?: unknown
  dti?: unknown
  LTV?: unknown
  ltv?: unknown
  Reasons?: unknown
  reasons?: unknown
  EvaluatedAt?: unknown
  evaluated_at?: unknown
  CreatedAt?: unknown
  created_at?: unknown
}

interface RawHistoryContainer {
  UserID?: unknown
  Request?: RawUnderwritingRequest
  Response?: RawUnderwritingResponse
  CreatedAt?: unknown
  EvaluatedAt?: unknown
  UpdatedAt?: unknown
  [key: string]: unknown
}

function normalizeRequestLike(
  raw: RawUnderwritingRequest | undefined,
  fallback?: UnderwritingRequest,
  overrides?: { userId?: unknown },
): UnderwritingRequest | null {
  const baseline = fallback ? { ...fallback } : undefined
  const source = raw ?? {}

  const resolvedUserId = normalizeString(
    overrides?.userId ?? source.UserID ?? source.user_id ?? source.userId ?? baseline?.user_id ?? '',
  )

  if (!resolvedUserId) {
    return baseline ?? null
  }

  const monthlyIncome = coerceNumber(source.MonthlyIncome ?? source.monthly_income, baseline?.monthly_income ?? 0)
  const monthlyDebts = coerceNumber(source.MonthlyDebts ?? source.monthly_debts, baseline?.monthly_debts ?? 0)
  const loanAmount = coerceNumber(source.LoanAmount ?? source.loan_amount, baseline?.loan_amount ?? 0)
  const propertyValue = coerceNumber(source.PropertyValue ?? source.property_value, baseline?.property_value ?? 0)
  const creditScore = coerceInteger(source.CreditScore ?? source.credit_score, baseline?.credit_score ?? 0)
  const occupancy = normalizeString(
    source.OccupancyType ?? source.occupancy_type ?? baseline?.occupancy_type ?? '',
  )

  return {
    user_id: resolvedUserId,
    monthly_income: monthlyIncome,
    monthly_debts: monthlyDebts,
    loan_amount: loanAmount,
    property_value: propertyValue,
    credit_score: creditScore,
    occupancy_type: occupancy,
  }
}

function extractDateCandidate(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

function normalizeUnderwritingRecord(
  raw: unknown,
  fallbackRequest?: UnderwritingRequest,
): UnderwritingResponse | null {
  if (!raw || typeof raw !== 'object') {
    return fallbackRequest
      ? { ...fallbackRequest, decision: 'Refer' }
      : null
  }

  const container = raw as RawHistoryContainer
  const responseSource = (container.Response as RawUnderwritingResponse | undefined) ?? (raw as RawUnderwritingResponse)
  const requestSource = (container.Request as RawUnderwritingRequest | undefined) ?? (raw as RawUnderwritingRequest)

  const request = normalizeRequestLike(requestSource, fallbackRequest, { userId: container.UserID })
  if (!request) {
    return null
  }

  const decision = normalizeDecision(responseSource?.Decision ?? responseSource?.decision ?? container.Response?.Decision)
  const dti = coerceOptionalNumber(responseSource?.DTI ?? responseSource?.dti)
  const ltv = coerceOptionalNumber(responseSource?.LTV ?? responseSource?.ltv)
  const reasons = normalizeReasons(responseSource?.Reasons ?? responseSource?.reasons)
  const evaluatedAt = extractDateCandidate(
    responseSource?.EvaluatedAt,
    responseSource?.evaluated_at,
    container.EvaluatedAt,
    container.CreatedAt,
    responseSource?.CreatedAt,
    responseSource?.created_at,
  )

  return {
    ...request,
    decision,
    dti,
    ltv,
    evaluated_at: evaluatedAt,
    reasons,
  }
}

function normalizeHistoryPayload(payload: unknown): UnderwritingHistory {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeUnderwritingRecord(item))
      .filter((item): item is UnderwritingResponse => Boolean(item))
  }

  if (payload && typeof payload === 'object') {
    const bucket = payload as Record<string, unknown>

    if (Array.isArray(bucket.evaluations)) {
      return bucket.evaluations
        .map((item) => normalizeUnderwritingRecord(item))
        .filter((item): item is UnderwritingResponse => Boolean(item))
    }

    if (Array.isArray(bucket.items)) {
      return bucket.items
        .map((item) => normalizeUnderwritingRecord(item))
        .filter((item): item is UnderwritingResponse => Boolean(item))
    }

    const single = normalizeUnderwritingRecord(payload)
    return single ? [single] : []
  }

  return []
}

export async function submitUnderwriting(request: UnderwritingRequest): Promise<UnderwritingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/underwriting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const payload = await handleResponse<unknown>(response)
  const normalized = normalizeUnderwritingRecord(payload, request)
  if (normalized) {
    return normalized
  }

  return { ...request, decision: 'Refer' }
}

type HistoryPayload = unknown

export async function fetchHistory(userId: string): Promise<UnderwritingHistory> {
  const response = await fetch(`${API_BASE_URL}/api/v1/underwriting/history/${encodeURIComponent(userId)}`)
  const payload = await handleResponse<HistoryPayload>(response)
  return normalizeHistoryPayload(payload)
}

export async function pingApi(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ping`)
    if (!response.ok) return false
    const data = await response.json()
    if (typeof data === 'object' && data !== null && 'status' in data) return true
    return true
  } catch (error) {
    return false
  }
}
