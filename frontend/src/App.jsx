import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar    from './components/Navbar'
import Login     from './pages/Login'
import Home      from './pages/Home'
import Dashboard   from './pages/Dashboard'
import Trades      from './pages/Trades'
import Deposits    from './pages/Deposits'
import Withdrawals from './pages/Withdrawals'
import Referral    from './pages/Referral'
import AdminUsers  from './pages/AdminUsers'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="trades"      element={<ProtectedRoute><Trades /></ProtectedRoute>} />
            <Route path="deposits"    element={<ProtectedRoute><Deposits /></ProtectedRoute>} />
            <Route path="withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
            <Route path="referral"    element={<ProtectedRoute><Referral /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
