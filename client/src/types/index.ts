export type Role = 'STUDENT' | 'WARDEN' | 'ADMIN' | 'COUNSELLOR' | 'DOCTOR'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
export type ComplaintStatus = 'PENDING' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
export type ComplaintCategory = 'PLUMBING' | 'ELECTRICAL' | 'CLEANING' | 'FURNITURE' | 'SECURITY' | 'FOOD' | 'INTERNET' | 'OTHER'
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  avatarUrl?: string
  enrollmentNo?: string
  course?: string
  coursePreference?: string
  gender?: Gender
  sportsInterests?: string[]
  hobbies?: string[]
  sleepSchedule?: string
  noiseTolerance?: string
  studyHours?: number
  sleepHours?: number
  careerGoal?: string
  address?: string
  parentContactNo?: string
  approvalStatus?: ApprovalStatus
  approvedAt?: string
  approvedBy?: string
}

export interface Room {
  id: string
  number: string
  floor: number
  block: string
  capacity: number
  status: RoomStatus
  amenities: string[]
  occupants?: User[]
}

export interface Complaint {
  id: string
  token: string
  isAnonymous: boolean
  roomNumber?: string | null
  category: ComplaintCategory
  title: string
  description: string
  imageUrl?: string
  status: ComplaintStatus
  adminNote?: string
  createdAt: string
  updatedAt?: string
  resolvedAt?: string
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalStudents: number
  occupiedRooms: number
  availableRooms: number
  openComplaints: number
  pendingMaintenance: number
  occupancyPercent: number
}

export interface AdminDashboardStats extends DashboardStats {
  totalRooms: number
  recentActivity: Array<{
    id: string
    title: string
    category: ComplaintCategory
    status: ComplaintStatus
    createdAt: string
    isAnonymous: boolean
    user: { name: string } | null
  }>
}

export interface MaintenanceTask {
  id: string
  title: string
  description: string
  location: string
  assignedTo?: string
  status: MaintenanceStatus
  scheduledAt: string
  completedAt?: string | null
  createdAt: string
  isPublic?: boolean
  createdByUser?: Pick<User, 'id' | 'name' | 'email'>
}

export interface Announcement {
  id: string
  title: string
  content: string
  isUrgent: boolean
  createdBy: string
  expiresAt?: string | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    id: string
    title: string | null
    type: string | null
    score: number
  }>
}

// Counselling types
export type SessionStatus = 'OPEN' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
export type Mood = 'ANXIOUS' | 'SAD' | 'STRESSED' | 'OKAY' | 'GOOD'
export type MessageType = 'TEXT' | 'RESOURCE' | 'NOTE'
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export type HealthAppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type PrescriptionStatus = 'ISSUED' | 'DISPENSED' | 'CANCELLED'
export type InsuranceClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'
export type MedicalDocumentStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED'

// Mess types
export type MessOrderType = 'MONTHLY' | 'DAILY'
export type MessOrderStatus = 'CREATED' | 'PAID' | 'FAILED'
export type MessFeedbackType = 'COMPLAINT' | 'SUGGESTION' | 'APPRECIATION'

export interface MessOrder {
  id: string
  userId?: string
  type: MessOrderType
  status: MessOrderStatus
  amountPaise: number
  currency: string
  periodStart: string
  periodEnd: string
  razorpayOrderId: string
  razorpayPaymentId?: string | null
  paidAt?: string | null
  createdAt: string
}

export interface MessSummary {
  fees: { monthlyFeePaise: number; dailyFeePaise: number; currency: string }
  access: { monthlyActive: boolean; dailyActiveToday: boolean }
  recentOrders: MessOrder[]
  period: {
    monthStart: string
    monthEnd: string
    todayStart: string
    todayEnd: string
  }
}

export interface MessOrderCreateResponse {
  keyId: string
  order: {
    id: string
    type: MessOrderType
    amountPaise: number
    currency: string
    razorpayOrderId: string
    periodStart: string
    periodEnd: string
  }
}

export interface VerifyMessOrderInput {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface MessFeedback {
  id: string
  userId: string
  type: MessFeedbackType
  rating?: number | null
  title: string
  message: string
  createdAt: string
}

export interface CreateMessFeedbackInput {
  type?: MessFeedbackType
  rating?: number
  title: string
  message: string
}

export interface CounsellorProfile {
  id: string
  userId: string
  bio?: string
  specialties: string[]
  availability?: string
  isOnline: boolean
  createdAt: string
  updatedAt: string
  user: User
}

export interface CounsellingMessage {
  id: string
  sessionId: string
  senderId: string
  sender?: User
  content: string
  type: MessageType
  isRead: boolean
  sentAt: string
}

export interface CounsellingAppointment {
  id: string
  sessionId: string
  scheduledAt: string
  durationMins: number
  status: AppointmentStatus
  note?: string | null
  meetingLink?: string | null
  createdById?: string
  createdBy?: User
  createdAt: string
  updatedAt: string
  session?: CounsellingSession
}

export interface JournalEntry {
  id: string
  studentId: string
  sessionId?: string | null
  mood?: Mood | null
  title?: string | null
  content: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export interface DoctorProfile {
  id: string
  userId: string
  specialization?: string | null
  clinicLocation?: string | null
  availabilityNote?: string | null
  isActive: boolean
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
}

export interface HealthAppointment {
  id: string
  studentId: string
  doctorId: string
  status: HealthAppointmentStatus
  scheduledAt: string
  durationMins: number
  reason?: string | null
  adminNote?: string | null
  doctor?: DoctorProfile
  student?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
  record?: HealthVisitRecord | null
  createdAt: string
  updatedAt: string
}

export interface HealthVisitRecord {
  id: string
  appointmentId: string
  symptoms?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
  doctorNotes?: string | null
  attachments: string[]
  prescription?: Prescription | null
  createdAt: string
  updatedAt: string
}

export interface Prescription {
  id: string
  recordId: string
  status: PrescriptionStatus
  notes?: string | null
  items?: PrescriptionItem[]
  createdAt: string
  updatedAt: string
}

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  medicineId?: string | null
  medicineName: string
  dosage?: string | null
  frequency?: string | null
  durationDays?: number | null
  instructions?: string | null
  quantity?: number | null
}

export interface Medicine {
  id: string
  name: string
  description?: string | null
  unit?: string | null
  stockQty: number
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface InsuranceClaim {
  id: string
  studentId: string
  appointmentId?: string | null
  amount?: number | null
  description?: string | null
  billUrl?: string | null
  status: InsuranceClaimStatus
  adminNote?: string | null
  processedById?: string | null
  createdAt: string
  updatedAt: string
  student?: Pick<User, 'id' | 'name' | 'email'>
}

export interface MedicalLeaveRequest {
  id: string
  studentId: string
  fromDate: string
  toDate: string
  reason: string
  documentUrl?: string | null
  status: MedicalDocumentStatus
  adminNote?: string | null
  createdAt: string
  updatedAt: string
  student?: Pick<User, 'id' | 'name' | 'email'>
}

export interface CounsellingSession {
  id: string
  studentId: string
  counsellorId: string
  student?: User
  counsellor?: CounsellorProfile
  status: SessionStatus
  topic?: string
  mood?: Mood
  startedAt: string
  closedAt?: string | null
  messages?: CounsellingMessage[]
  appointments?: CounsellingAppointment[]
  sessionNotes?: string
  followUpDate?: string | null
  rating?: number | null
  ratingComment?: string | null
  createdAt: string
  updatedAt: string
}
