import type { UnderwritingResponse } from '../types/underwriting'

interface UnderwritingResultProps {
  result: UnderwritingResponse | null
}

const decisionColors: Record<string, string> = {
  Approve: 'success',
  Refer: 'warning',
  Decline: 'danger',
}

const DECISION_DESCRIPTORS: Record<string, string> = {
  Approve: 'Eligible for approval based on the provided data.',
  Refer: 'Requires manual review before approval.',
  Decline: 'Does not meet the underwriting criteria.',
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatPercentage(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(2)}%`
}

function computeRatio(numerator?: number, denominator?: number) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator === 0) {
    return undefined
  }
  return numerator / denominator
}

export function UnderwritingResult({ result }: UnderwritingResultProps) {
  if (!result) {
    return null
  }

  const dti = typeof result.dti === 'number' ? result.dti : computeRatio(result.monthly_debts, result.monthly_income)
  const ltv = typeof result.ltv === 'number' ? result.ltv : computeRatio(result.loan_amount, result.property_value)
  const decisionTone = decisionColors[result.decision] ?? 'info'
  const descriptor = DECISION_DESCRIPTORS[result.decision] ?? 'Review the evaluation details below.'

  return (
    <section className={`card result ${decisionTone}`}>
      <header>
        <span className="label">Decision</span>
        <h2>{result.decision}</h2>
        <p>{descriptor}</p>
      </header>

      <dl className="result-grid">
        <div>
          <dt>Debt-to-Income</dt>
          <dd>{formatPercentage(dti)}</dd>
        </div>
        <div>
          <dt>Loan-to-Value</dt>
          <dd>{formatPercentage(ltv)}</dd>
        </div>
        <div>
          <dt>Credit Score</dt>
          <dd>{result.credit_score}</dd>
        </div>
        <div>
          <dt>Occupancy</dt>
          <dd>{result.occupancy_type}</dd>
        </div>
        <div>
          <dt>Loan Amount</dt>
          <dd>{formatCurrency(result.loan_amount)}</dd>
        </div>
        <div>
          <dt>Property Value</dt>
          <dd>{formatCurrency(result.property_value)}</dd>
        </div>
        {result.evaluated_at ? (
          <div>
            <dt>Evaluated At</dt>
            <dd>{new Date(result.evaluated_at).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>

      {Array.isArray(result.reasons) && result.reasons.length > 0 ? (
        <div className="reasons">
          <span className="label">Reasons</span>
          <ul>
            {result.reasons.map((reason, index) => (
              <li key={`${reason}-${index}`}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

export default UnderwritingResult
