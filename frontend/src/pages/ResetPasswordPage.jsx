import { useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, useParams } from 'react-router-dom'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to reset password')
        setLoading(false)
        return
      }

      setMessage(data.message || 'Password reset successfully')

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f4edf8] text-[#4d3b63]">
      <header className="bg-[#f4edf8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link to="/" className="text-4xl font-semibold tracking-tight text-[#c8a8eb]">
            Maharati
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full bg-[#e8e3ea] px-6 py-2 text-lg font-medium text-[#4d3b63]"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center justify-center px-6 pb-12 pt-4">
        <section className="w-full max-w-xl rounded-[34px] bg-white p-8 shadow-[0_12px_30px_rgba(123,92,146,0.14)] sm:p-10">
          <div className="mb-6 text-center">
            <p className="text-lg font-medium text-[#8a68ad]">Set New Password</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#2f1f46]">
              Reset your password
            </h2>
            <p className="mt-3 text-base leading-7 text-[#7c6b93]">
              Choose a strong new password for your Maharati account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e6dcef] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#a97be0]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e6dcef] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#a97be0]"
                required
              />
            </div>

            {message && (
              <div className="rounded-xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#8b3fe0] py-4 text-lg font-semibold text-white hover:opacity-90 disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#7c6b93]">
            Back to{' '}
            <Link to="/login" className="font-semibold text-[#8b3fe0]">
              login
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default ResetPasswordPage