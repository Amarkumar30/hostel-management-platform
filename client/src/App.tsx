import { useSyncExternalStore } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from '@/components/shared/OfflineBanner'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import StudentDashboard from '@/pages/student/StudentDashboard'
import MyRoomPage from '@/pages/student/MyRoomPage'
import ComplaintsPage from '@/pages/student/ComplaintsPage'
import AnonymousComplaintPage from '@/pages/student/AnonymousComplaintPage'
import TrackComplaintPage from '@/pages/student/TrackComplaintPage'
import MessPage from '@/pages/student/MessPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import RoomManagement from '@/pages/admin/RoomManagement'
import ComplaintsAdmin from '@/pages/admin/ComplaintsAdmin'
import MaintenanceAdmin from '@/pages/admin/MaintenanceAdmin'
import StudentManagement from '@/pages/admin/StudentManagement'
import CleaningSchedule from '@/pages/admin/CleaningSchedule'
import WardenDashboard from '@/pages/warden/WardenDashboard'
import { StudentChatPage } from '@/pages/counselling/StudentChatPage'
import { CounsellorDashboard } from '@/pages/counselling/CounsellorDashboard'
import LeaveApplicationPage from '@/pages/student/LeaveApplicationPage'
import LeaveHistoryPage from '@/pages/student/LeaveHistoryPage'
import WardenLeavesPage from '@/pages/warden/WardenLeavesPage'
import AdminLeavesPage from '@/pages/admin/AdminLeavesPage'
import CampusHealthStudentPage from '@/pages/health/CampusHealthStudentPage'
import CampusHealthDoctorPage from '@/pages/health/CampusHealthDoctorPage'
import CampusHealthAdminPage from '@/pages/health/CampusHealthAdminPage'

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function useAuthHydrationReady() {
  return useSyncExternalStore(
    (callback) => {
      const unsubHydrate = useAuthStore.persist.onHydrate(callback)
      const unsubFinish = useAuthStore.persist.onFinishHydration(callback)
      return () => {
        unsubHydrate()
        unsubFinish()
      }
    },
    () => useAuthStore.persist.hasHydrated(),
    () => true
  )
}

export default function App() {
  const { user } = useAuthStore()
  const authHydrationReady = useAuthHydrationReady()

  if (!authHydrationReady) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OfflineBanner />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/track" element={<TrackComplaintPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  user?.role === 'ADMIN' ? (
                    <AdminDashboard />
                  ) : user?.role === 'WARDEN' ? (
                    <WardenDashboard />
                  ) : user?.role === 'COUNSELLOR' ? (
                    <CounsellorDashboard />
                  ) : user?.role === 'DOCTOR' ? (
                    <CampusHealthDoctorPage />
                  ) : (
                    <StudentDashboard />
                  )
                }
              />
              <Route
                path="rooms"
                element={
                  <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                    <RoomManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-room"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <MyRoomPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="mess"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <MessPage />
                  </ProtectedRoute>
                }
              />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route
                path="complaints/anonymous"
                element={<AnonymousComplaintPage />}
              />
              <Route
                path="admin/complaints"
                element={
                  <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                    <ComplaintsAdmin />
                  </ProtectedRoute>
                }
              />
              <Route path="maintenance" element={<MaintenanceAdmin />} />
              <Route
                path="cleaning"
                element={
                  <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                    <CleaningSchedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedRoute roles={['ADMIN', 'WARDEN']}>
                    <StudentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="counselling"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <StudentChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="counsellor/dashboard"
                element={
                  <ProtectedRoute roles={['COUNSELLOR']}>
                    <CounsellorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="health"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <CampusHealthStudentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="health/doctor"
                element={
                  <ProtectedRoute roles={['DOCTOR']}>
                    <CampusHealthDoctorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="health/admin"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <CampusHealthAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="leaves"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <LeaveApplicationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="leaves/history"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <LeaveHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="warden/leaves"
                element={
                  <ProtectedRoute roles={['WARDEN']}>
                    <WardenLeavesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/leaves"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminLeavesPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
