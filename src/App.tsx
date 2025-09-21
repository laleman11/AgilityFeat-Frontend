import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchHistory, pingApi, submitUnderwriting } from './api/underwriting'
import HistoryTable from './components/HistoryTable'
import UnderwritingForm from './components/UnderwritingForm'
import UnderwritingResult from './components/UnderwritingResult'
import type {
  UnderwritingFormValues,
  UnderwritingHistory,
  UnderwritingRequest,
  UnderwritingResponse,
} from './types/underwriting'

const DEFAULT_FORM: UnderwritingFormValues = {
  user_id: '',
  monthly_income: '',
  monthly_debts: '',
  loan_amount: '',
  property_value: '',
  credit_score: '',
  occupancy_type: '',
}

function toUnderwritingRequest(values: UnderwritingFormValues): UnderwritingRequest | null {
  const asNumber = (value: string) => Number.parseFloat(value)

  const monthlyIncome = asNumber(values.monthly_income)
  const monthlyDebts = asNumber(values.monthly_debts)
  const loanAmount = asNumber(values.loan_amount)
  const propertyValue = asNumber(values.property_value)
  const creditScore = Number.parseInt(values.credit_score, 10)

  if (
    Number.isNaN(monthlyIncome) ||
    Number.isNaN(monthlyDebts) ||
    Number.isNaN(loanAmount) ||
    Number.isNaN(propertyValue) ||
    Number.isNaN(creditScore)
  ) {
    return null
  }

  return {
    user_id: values.user_id.trim(),
    monthly_income: monthlyIncome,
    monthly_debts: monthlyDebts,
    loan_amount: loanAmount,
    property_value: propertyValue,
    credit_score: creditScore,
    occupancy_type: values.occupancy_type,
  }
}

function App() {
  const [formValues, setFormValues] = useState<UnderwritingFormValues>(DEFAULT_FORM)
  const [latestResult, setLatestResult] = useState<UnderwritingResponse | null>(null)
  const [history, setHistory] = useState<UnderwritingHistory>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)

  const hasUserId = useMemo(() => formValues.user_id.trim().length > 0, [formValues.user_id])

  const handleFieldChange = useCallback(
    <K extends keyof UnderwritingFormValues>(field: K, value: UnderwritingFormValues[K]) => {
      setFormValues((previous) => ({ ...previous, [field]: value }))
    },
    [],
  )

  const refreshHistory = useCallback(
    async (userId?: string) => {
      const targetUserId = (userId ?? formValues.user_id).trim()
      if (!targetUserId) {
        setHistory([])
        setHistoryError(null)
        setHistoryLoading(false)
        return
      }

      setHistoryLoading(true)
      setHistoryError(null)

      try {
        const evaluations = await fetchHistory(targetUserId)
        setHistory(evaluations)
      } catch (error) {
        setHistory([])
        setHistoryError(error instanceof Error ? error.message : 'Unable to load history')
      } finally {
        setHistoryLoading(false)
      }
    },
    [formValues.user_id],
  )

  const handleSubmit = useCallback(async () => {
    const request = toUnderwritingRequest(formValues)

    if (!request) {
      setFormError('Please fill in all numeric fields with valid values.')
      return
    }

    if (!request.user_id) {
      setFormError('User ID is required.')
      return
    }

    if (!request.occupancy_type) {
      setFormError('Please select an occupancy type.')
      return
    }

    setFormError(null)
    setSubmitting(true)

    try {
      const response = await submitUnderwriting(request)
      setLatestResult(response)
      await refreshHistory(request.user_id)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [formValues, refreshHistory])

  useEffect(() => {
    const controller = new AbortController()

    pingApi()
      .then((healthy) => {
        if (!controller.signal.aborted) {
          setApiHealthy(healthy)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setApiHealthy(false)
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (hasUserId) {
      refreshHistory()
    } else {
      setHistory([])
      setHistoryError(null)
      setHistoryLoading(false)
    }
  }, [hasUserId, refreshHistory])

  return (
    <div className="layout">
      <header className="page-header">
        <div>
          <h1>AgilityFeat Underwriting</h1>
          <p>Submit borrower details to get an underwriting decision and review the borrower history.</p>
        </div>
        {apiHealthy === false ? <span className="badge danger">API offline</span> : null}
        {apiHealthy === true ? <span className="badge success">API online</span> : null}
      </header>

      <main className="content">
        <UnderwritingForm
          values={formValues}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          disabled={!apiHealthy && apiHealthy !== null}
        />

        {formError ? <p className="error" role="alert">{formError}</p> : null}

        <UnderwritingResult result={latestResult} />

        <HistoryTable
          history={history}
          loading={historyLoading}
          error={historyError}
          onRefresh={() => refreshHistory()}
          disabled={!hasUserId || (!apiHealthy && apiHealthy !== null)}
        />
      </main>
    </div>
  )
}

export default App
