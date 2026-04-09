import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { MessageSquareText, Sparkles, UtensilsCrossed } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import CardListSkeleton from '@/components/shared/CardListSkeleton'
import { queryClient } from '@/lib/queryClient'
import type {
  CreateMessFeedbackInput,
  MessFeedbackType,
  MessOrderType,
} from '@/types'
import {
  createMessOrder,
  getMessSummary,
  listMyMessFeedback,
  submitMessFeedback,
  verifyMessOrder,
} from '@/services/mess'

declare global {
  interface Window {
    Razorpay?: any
  }
}

function formatINRFromPaise(paise: number) {
  const inr = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr)
}

async function loadRazorpayScript() {
  if (window.Razorpay) return true
  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function prettyFeedbackLabel(type: MessFeedbackType) {
  if (type === 'COMPLAINT') return 'Complaint'
  if (type === 'APPRECIATION') return 'Appreciation'
  return 'Suggestion'
}

export default function MessPage() {
  const [feedbackType, setFeedbackType] = useState<MessFeedbackType>('SUGGESTION')
  const [rating, setRating] = useState<number | ''>('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const summaryQuery = useQuery({
    queryKey: ['mess-summary'],
    queryFn: getMessSummary,
  })

  const feedbackQuery = useQuery({
    queryKey: ['mess-feedback-mine'],
    queryFn: listMyMessFeedback,
  })

  const createOrderMutation = useMutation({
    mutationFn: (type: MessOrderType) => createMessOrder(type),
  })

  const verifyMutation = useMutation({
    mutationFn: verifyMessOrder,
  })

  const submitFeedbackMutation = useMutation({
    mutationFn: (input: CreateMessFeedbackInput) => submitMessFeedback(input),
    onSuccess: async () => {
      toast.success('Thanks. Your feedback has been submitted.')
      setTitle('')
      setMessage('')
      setRating('')
      setFeedbackType('SUGGESTION')
      await feedbackQuery.refetch()
    },
  })

  const summary = summaryQuery.data

  const monthLabel = useMemo(() => {
    if (!summary?.period?.monthStart) return format(new Date(), 'MMMM yyyy')
    return format(new Date(summary.period.monthStart), 'MMMM yyyy')
  }, [summary?.period?.monthStart])

  async function startPayment(type: MessOrderType) {
    if (createOrderMutation.isPending || verifyMutation.isPending) return
    const scriptOk = await loadRazorpayScript()
    if (!scriptOk) {
      toast.error('Unable to load Razorpay. Please check your internet and try again.')
      return
    }

    const loadingToast = toast.loading('Creating payment…')
    try {
      const res = await createOrderMutation.mutateAsync(type)
      toast.dismiss(loadingToast)

      const { keyId, order } = res
      const description =
        type === 'MONTHLY'
          ? `Monthly mess pass for ${monthLabel}`
          : `Daily meal pass for ${format(new Date(order.periodStart), 'dd MMM yyyy')}`

      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'Hostel Mess',
        description,
        order_id: order.razorpayOrderId,
        theme: { color: '#6C63FF' },
        handler: async (response: any) => {
          const verifyingToast = toast.loading('Verifying payment…')
          try {
            await verifyMutation.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            toast.dismiss(verifyingToast)
            toast.success('Payment successful. Mess access updated.')
            await queryClient.invalidateQueries({ queryKey: ['mess-summary'] })
          } catch (e: any) {
            toast.dismiss(verifyingToast)
            const msg =
              e?.response?.data?.message ||
              e?.message ||
              'Payment verification failed. If money was deducted, contact support.'
            toast.error(String(msg))
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.')
          },
        },
        prefill: {},
      })

      rzp.open()
    } catch (e: any) {
      toast.dismiss(loadingToast)
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Unable to create order. Please try again.'
      toast.error(String(msg))
    }
  }

  async function onSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Please add a title and message.')
      return
    }

    const next: CreateMessFeedbackInput = {
      type: feedbackType,
      title: title.trim(),
      message: message.trim(),
    }
    if (rating !== '') next.rating = rating
    await submitFeedbackMutation.mutateAsync(next)
  }

  useEffect(() => {
    // Small warm-up: if Razorpay is cached by the browser, payment feels instant.
    loadRazorpayScript().catch(() => {})
  }, [])

  if (summaryQuery.isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <LoadingSpinner />
        <CardListSkeleton rows={2} height={160} />
      </div>
    )
  }

  if (summaryQuery.isError) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Mess module unavailable"
        description="The server could not load mess subscription details. Please try again later."
      />
    )
  }

  const monthlyFee = summary?.fees?.monthlyFeePaise ?? 0
  const dailyFee = summary?.fees?.dailyFeePaise ?? 0
  const monthlyActive = Boolean(summary?.access?.monthlyActive)
  const dailyActiveToday = Boolean(summary?.access?.dailyActiveToday)

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="card-gradient" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(900px 240px at 20% 0%, rgba(108,99,255,0.18), transparent 70%), radial-gradient(700px 240px at 80% 20%, rgba(34,211,238,0.12), transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(108,99,255,0.16)',
                border: '1px solid rgba(108,99,255,0.35)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, margin: 0 }}>Mess Subscription</h1>
              <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
                Pay monthly fees or activate a daily meal pass. Instant access after payment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(108,99,255,0.12)',
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700 }}>Monthly Pass</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{monthLabel}</div>
              </div>
              <div style={{ fontFamily: 'Sora', fontSize: 18 }}>{formatINRFromPaise(monthlyFee)}</div>
            </div>

            <div style={{ display: 'grid', gap: 6, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sparkles size={14} color="var(--accent-secondary)" />
                Unlimited daily meals for this month
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sparkles size={14} color="var(--accent-secondary)" />
                Quick renewal, payment history saved
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border-default)',
                  color: monthlyActive ? 'var(--accent-success)' : 'var(--text-tertiary)',
                  background: monthlyActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {monthlyActive ? 'Active' : 'Not active'}
              </div>
              <button
                className="btn-primary"
                onClick={() => startPayment('MONTHLY')}
                disabled={createOrderMutation.isPending || verifyMutation.isPending || monthlyActive}
                style={{ opacity: monthlyActive ? 0.55 : 1 }}
              >
                {monthlyActive ? 'Paid' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(34,211,238,0.12)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700 }}>Daily Meal Pass</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{format(new Date(), 'dd MMM yyyy')}</div>
              </div>
              <div style={{ fontFamily: 'Sora', fontSize: 18 }}>{formatINRFromPaise(dailyFee)}</div>
            </div>

            <div style={{ display: 'grid', gap: 6, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sparkles size={14} color="var(--accent-secondary)" />
                Ideal for guests or flexible days
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sparkles size={14} color="var(--accent-secondary)" />
                Activates only for today
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border-default)',
                  color: dailyActiveToday ? 'var(--accent-success)' : 'var(--text-tertiary)',
                  background: dailyActiveToday ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {dailyActiveToday ? 'Active today' : 'Not active'}
              </div>
              <button
                className="btn-primary"
                onClick={() => startPayment('DAILY')}
                disabled={createOrderMutation.isPending || verifyMutation.isPending || dailyActiveToday}
                style={{ opacity: dailyActiveToday ? 0.55 : 1 }}
              >
                {dailyActiveToday ? 'Paid' : 'Pay Today'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card-gradient" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'rgba(34,211,238,0.12)',
                border: '1px solid rgba(34,211,238,0.25)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <MessageSquareText size={16} />
            </div>
            <div>
              <div style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700 }}>Mess Feedback</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Help improve food quality and service.</div>
            </div>
          </div>

          <form onSubmit={onSubmitFeedback} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Type</span>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as MessFeedbackType)}
                  className="card"
                  style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(17,24,39,0.55)' }}
                >
                  <option value="SUGGESTION">Suggestion</option>
                  <option value="COMPLAINT">Complaint</option>
                  <option value="APPRECIATION">Appreciation</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Rating (optional)</span>
                <select
                  value={rating === '' ? '' : String(rating)}
                  onChange={(e) => setRating(e.target.value ? Number(e.target.value) : '')}
                  className="card"
                  style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(17,24,39,0.55)' }}
                >
                  <option value="">No rating</option>
                  <option value="5">5 Excellent</option>
                  <option value="4">4 Good</option>
                  <option value="3">3 Okay</option>
                  <option value="2">2 Poor</option>
                  <option value="1">1 Bad</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="card"
                placeholder="Eg. Breakfast quality improvement"
                style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(17,24,39,0.55)' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="card"
                placeholder="Share specific details so the mess team can act quickly…"
                rows={4}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(17,24,39,0.55)',
                  resize: 'vertical',
                }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-primary" disabled={submitFeedbackMutation.isPending}>
                {submitFeedbackMutation.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700 }}>My Recent Feedback</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Your last 50 submissions.</div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => feedbackQuery.refetch()}
              style={{ padding: '0.5rem 0.9rem' }}
            >
              Refresh
            </button>
          </div>

          {feedbackQuery.isLoading ? (
            <CardListSkeleton rows={3} height={92} />
          ) : (feedbackQuery.data?.length || 0) === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No feedback yet"
              description="Your submitted feedback will appear here."
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {(feedbackQuery.data || []).slice(0, 8).map((f) => (
                <div
                  key={f.id}
                  className="card-glass"
                  style={{ padding: 12, display: 'grid', gap: 6 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                    <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {format(new Date(f.createdAt), 'dd MMM')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.03)' }}>
                    {prettyFeedbackLabel(f.type)}
                    </span>
                    {typeof f.rating === 'number' ? (
                      <span style={{ color: 'var(--accent-secondary)' }}>Rating: {Math.max(1, Math.min(5, f.rating))}/5</span>
                    ) : null}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                    {f.message}
                  </div>
                </div>
              ))}
              {(feedbackQuery.data || []).length > 8 ? (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                  Showing latest 8. (More available via API.)
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
