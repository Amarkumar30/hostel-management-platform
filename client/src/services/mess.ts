import api from '@/services/api'
import type {
  CreateMessFeedbackInput,
  MessFeedback,
  MessOrderCreateResponse,
  MessOrderType,
  MessSummary,
  VerifyMessOrderInput,
} from '@/types'

export async function getMessSummary() {
  const res = await api.get('/mess/summary')
  return res.data as MessSummary
}

export async function createMessOrder(type: MessOrderType) {
  const res = await api.post('/mess/orders', { type })
  return res.data as MessOrderCreateResponse
}

export async function verifyMessOrder(input: VerifyMessOrderInput) {
  const res = await api.post('/mess/orders/verify', input)
  return res.data as { order: unknown }
}

export async function submitMessFeedback(input: CreateMessFeedbackInput) {
  const res = await api.post('/mess/feedback', input)
  return res.data as MessFeedback
}

export async function listMyMessFeedback() {
  const res = await api.get('/mess/feedback/mine')
  return res.data as MessFeedback[]
}

