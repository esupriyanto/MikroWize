import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DeviceInventory from './pages/DeviceInventory'
import DeviceDetail from './pages/DeviceDetail'
import DeviceOnboarding from './pages/DeviceOnboarding'
import BackupManager from './pages/BackupManager'
import TroubleshootPanel from './pages/TroubleshootPanel'
import TemplateFramework from './pages/TemplateFramework'
import TaskQueue from './pages/TaskQueue'
import Alerts from './pages/Alerts'
import UsersRoles from './pages/UsersRoles'
import Settings from './pages/Settings'

// Mock auth — replace with real auth context
const isAuthenticated = () => {
  return localStorage.getItem('mw_token') !== null
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/devices" element={<DeviceInventory />} />
                <Route path="/devices/:id" element={<DeviceDetail />} />
                <Route path="/devices/onboard" element={<DeviceOnboarding />} />
                <Route path="/backups" element={<BackupManager />} />
                <Route path="/troubleshoot/:id" element={<TroubleshootPanel />} />
                <Route path="/templates" element={<TemplateFramework />} />
                <Route path="/tasks" element={<TaskQueue />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/users" element={<UsersRoles />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
