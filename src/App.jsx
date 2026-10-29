import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Splash from './components/Splash.jsx'
import FloatingContact from './components/FloatingContact.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import Profile from './pages/Profile.jsx'
import Services from './pages/Services.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import OrderHistory from './pages/OrderHistory.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import StaffOrderDetail from './pages/StaffOrderDetail.jsx'
import StaffManagement from './pages/StaffManagement.jsx'
import { useAuth } from './context/AuthContext.jsx'

// Sends a signed-in user to the right dashboard based on their role.
function RoleHome() {
  const { role, loading } = useAuth()
  if (loading) return null
  return <Navigate to={role === 'staff' || role === 'admin' ? '/staff' : '/app'} replace />
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />
  }

  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute allow={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute allow={['customer']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/services"
        element={
          <ProtectedRoute allow={['customer']}>
            <Services />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/cart"
        element={
          <ProtectedRoute allow={['customer']}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/checkout"
        element={
          <ProtectedRoute allow={['customer']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/orders"
        element={
          <ProtectedRoute allow={['customer']}>
            <OrderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/order/:id"
        element={
          <ProtectedRoute allow={['customer']}>
            <OrderDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allow={['staff', 'admin']}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/order/:id"
        element={
          <ProtectedRoute allow={['staff', 'admin']}>
            <StaffOrderDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/team"
        element={
          <ProtectedRoute allow={['staff', 'admin']}>
            <StaffManagement />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <FloatingContact />
    </>
  )
}
