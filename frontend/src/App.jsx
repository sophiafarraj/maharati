import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import EditProfilePage from './pages/EditProfilePage'
import BrowseTeachersPage from './pages/BrowseTeachersPage'
import TeacherProfilePage from './pages/TeacherProfilePage'
import MySlotsPage from './pages/MySlotsPage'
import CreateSlotPage from './pages/CreateSlotPage'
import EditSlotPage from './pages/EditSlotPage'
import TeacherRequestsPage from './pages/TeacherRequestsPage'
import MySessionsPage from './pages/MySessionsPage'
import SessionDetailsPage from './pages/SessionDetailsPage'
import NotificationsPage from './pages/NotificationsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminSessionsPage from './pages/AdminSessionsPage'
import AdminDisputesPage from './pages/AdminDisputesPage'
import SuperAdminAdminsPage from './pages/SuperAdminAdminsPage'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function SuperAdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

function UserRoute({ children }) {
  const token = localStorage.getItem('token')
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/dashboard"
          element={
            <UserRoute>
              <DashboardPage />
            </UserRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <UserRoute>
              <EditProfilePage />
            </UserRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <UserRoute>
              <BrowseTeachersPage />
            </UserRoute>
          }
        />

        <Route
          path="/teachers/:teacherId"
          element={
            <UserRoute>
              <TeacherProfilePage />
            </UserRoute>
          }
        />

        <Route
          path="/slots"
          element={
            <UserRoute>
              <MySlotsPage />
            </UserRoute>
          }
        />

        <Route
          path="/slots/new"
          element={
            <UserRoute>
              <CreateSlotPage />
            </UserRoute>
          }
        />

        <Route
          path="/slots/:slotId/edit"
          element={
            <UserRoute>
              <EditSlotPage />
            </UserRoute>
          }
        />

        <Route
          path="/teacher/requests"
          element={
            <UserRoute>
              <TeacherRequestsPage />
            </UserRoute>
          }
        />

        <Route
          path="/sessions"
          element={
            <UserRoute>
              <MySessionsPage />
            </UserRoute>
          }
        />

        <Route
          path="/sessions/:sessionId"
          element={
            <UserRoute>
              <SessionDetailsPage />
            </UserRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <UserRoute>
              <NotificationsPage />
            </UserRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/sessions"
          element={
            <AdminRoute>
              <AdminSessionsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/disputes"
          element={
            <AdminRoute>
              <AdminDisputesPage />
            </AdminRoute>
          }
        />

        <Route
          path="/super-admin/admins"
          element={
            <SuperAdminRoute>
              <SuperAdminAdminsPage />
            </SuperAdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App