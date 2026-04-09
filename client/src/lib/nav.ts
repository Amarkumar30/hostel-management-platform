import type { Role } from '@/types'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  BedDouble,
  CalendarDays,
  EyeOff,
  Heart,
  Home,
  LayoutDashboard,
  Search,
  UserCheck,
  Wrench,
  CheckSquare,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react'

export type NavItem = { to: string; icon: LucideIcon; label: string }

const studentNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-room', icon: Home, label: 'My Room' },
  { to: '/mess', icon: UtensilsCrossed, label: 'Mess' },
  { to: '/leaves', icon: CheckSquare, label: 'Apply for Leave' },
  { to: '/leaves/history', icon: CalendarDays, label: 'My Leaves' },
  { to: '/complaints', icon: AlertCircle, label: 'My Complaints' },
  { to: '/complaints/anonymous', icon: EyeOff, label: 'Report Anonymously' },
  { to: '/counselling', icon: Heart, label: 'Talk to Counsellor' },
  { to: '/health', icon: Stethoscope, label: 'Campus Health' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/track', icon: Search, label: 'Track Complaint' },
]

const adminNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Room Management' },
  { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
  { to: '/admin/leaves', icon: CalendarDays, label: 'Leave Requests' },
  { to: '/cleaning', icon: CalendarDays, label: 'Cleaning Schedule' },
  { to: '/students', icon: UserCheck, label: 'Students' },
  { to: '/health/admin', icon: Stethoscope, label: 'Campus Health' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

const wardenNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/warden/leaves', icon: CalendarDays, label: 'Leave Requests' },
  { to: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
  { to: '/cleaning', icon: CalendarDays, label: 'Cleaning Schedule' },
  { to: '/students', icon: UserCheck, label: 'Students' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

const counsellorNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/counsellor/dashboard', icon: Heart, label: 'My Sessions' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
]

const doctorNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/health/doctor', icon: Stethoscope, label: 'Campus Health' },
]

export function getNavItems(role: Role | undefined): NavItem[] {
  if (role === 'ADMIN') return adminNav
  if (role === 'WARDEN') return wardenNav
  if (role === 'COUNSELLOR') return counsellorNav
  if (role === 'DOCTOR') return doctorNav
  return studentNav
}
