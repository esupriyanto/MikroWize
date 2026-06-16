import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Mock login
    if (email && password) {
      localStorage.setItem('mw_token', 'mock-token')
      navigate('/dashboard')
    } else {
      setError('Email and password are required')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[48rem]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-on-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">MikroWize</h1>
          <p className="text-sm text-on-surface-variant mt-1">Network Management Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-8">
          <h2 className="text-lg font-semibold text-on-surface mb-6">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="admin@mikrowize.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email ? 'Required' : ''}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && !password ? 'Required' : ''}
            />
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-outline mt-4">
          MikroWize v0.1.0 — Powered by MikroTik RouterOS API
        </p>
      </div>
    </div>
  )
}
