import type { UnderwritingHistory } from '../types/underwriting'

interface HistoryTableProps {
  history: UnderwritingHistory
  loading: boolean
  error: string | null
  onRefresh: () => void
  disabled: boolean
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatPercentage(value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(2)}%`
}

function computeRatio(numerator: number, denominator: number): number | null {
  if (!denominator) return null
  return numerator / denominator
}

export function HistoryTable({ history, loading, error, onRefresh, disabled }: HistoryTableProps) {
  return (
    <section className="card">
      <header className="history-header">
        <div>
          <h2>Evaluation History</h2>
          <p className="card-description">Most recent underwriting decisions for this borrower.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading || disabled}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {!error && history.length === 0 ? <p className="empty">No evaluations found yet.</p> : null}

      {!error && history.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Decision</th>
                <th>DTI</th>
                <th>LTV</th>
                <th>FICO</th>
                <th>Loan</th>
                <th>Property</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => {
                const dti = typeof record.dti === 'number' ? record.dti : computeRatio(record.monthly_debts, record.monthly_income)
                const ltv = typeof record.ltv === 'number' ? record.ltv : computeRatio(record.loan_amount, record.property_value)
                const evaluatedAt = record.evaluated_at ? new Date(record.evaluated_at).toLocaleString() : '—'

                return (
                  <tr key={record.evaluated_at ?? `${record.user_id}-${index}`}>
                    <td>{evaluatedAt}</td>
                    <td>{record.decision}</td>
                    <td>{formatPercentage(dti)}</td>
                    <td>{formatPercentage(ltv)}</td>
                    <td>{record.credit_score}</td>
                    <td>{formatCurrency(record.loan_amount)}</td>
                    <td>{formatCurrency(record.property_value)}</td>
                    <td>{record.occupancy_type}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default HistoryTable
