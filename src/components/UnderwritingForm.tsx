import type { ChangeEvent } from 'react'
import type { UnderwritingFormValues } from '../types/underwriting'

const OCCUPANCY_OPTIONS = [
  { value: 'primary_residence', label: 'Primary Residence' },
  { value: 'second_home', label: 'Second Home' },
  { value: 'investment_property', label: 'Investment Property' },
]

interface UnderwritingFormProps {
  values: UnderwritingFormValues
  onFieldChange: <K extends keyof UnderwritingFormValues>(field: K, value: UnderwritingFormValues[K]) => void
  onSubmit: () => void
  submitting: boolean
  disabled?: boolean
}

export function UnderwritingForm({ values, onFieldChange, onSubmit, submitting, disabled }: UnderwritingFormProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target

    onFieldChange(name as keyof UnderwritingFormValues, value)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled) return
    onSubmit()
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>Underwriting Evaluation</h2>
      <p className="card-description">Fill the borrower and loan information to request a decision.</p>

      <div className="grid">
        <label className="field">
          <span>User ID</span>
          <input
            name="user_id"
            value={values.user_id}
            onChange={handleChange}
            placeholder="e.g. user-123"
            required
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Credit Score (FICO)</span>
          <input
            name="credit_score"
            type="number"
            min="300"
            max="850"
            inputMode="numeric"
            value={values.credit_score}
            onChange={handleChange}
            required
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Monthly Income</span>
          <input
            name="monthly_income"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.monthly_income}
            onChange={handleChange}
            required
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Monthly Debts</span>
          <input
            name="monthly_debts"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.monthly_debts}
            onChange={handleChange}
            required
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Loan Amount</span>
          <input
            name="loan_amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.loan_amount}
            onChange={handleChange}
            required
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Property Value</span>
          <input
            name="property_value"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.property_value}
            onChange={handleChange}
            required
            disabled={disabled}
          />
        </label>

        <label className="field" data-full-width>
          <span>Occupancy Type</span>
          <select
            name="occupancy_type"
            value={values.occupancy_type}
            onChange={handleChange}
            required
            disabled={disabled}
          >
            <option value="" disabled>
              Select occupancy type
            </option>
            {OCCUPANCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="actions">
        <button type="submit" disabled={submitting || disabled}>
          {submitting ? 'Submitting…' : 'Submit Evaluation'}
        </button>
      </div>
    </form>
  )
}

export default UnderwritingForm
