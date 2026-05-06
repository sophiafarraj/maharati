import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, useParams } from 'react-router-dom'

function VerifyEmailPage() {
  const navigate = useNavigate()
  const { token } = useParams()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-email/${token}`)
        const data = await res.json()

        if (!res.ok) {
          setMessage(data.message || 'Verification link is invalid or expired.')
          setLoading(false)
          return
        }

        if (data.user) {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            localStorage.setItem(
              'user',
              JSON.stringify({ ...parsedUser, ...data.user })
            )
          }
        }

        setSuccess(true)
        setMessage(data.message || 'Email verified successfully.')

        setTimeout(() => {
          navigate('/dashboard')
        }, 1200)
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token, navigate])

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
        <section className="w-full max-w-xl rounded-[34px] bg-white p-8 text-center shadow-[0_12px_30px_rgba(123,92,146,0.14)] sm:p-10">
          <p className="text-lg font-medium text-[#8a68ad]">Email Verification</p>
          <h2 className="mt-2 text-4xl font-semibold text-[#2f1f46]">
            {loading
              ? 'Verifying your email...'
              : success
              ? 'Email verified'
              : 'Verification failed'}
          </h2>

          <p className="mt-4 text-base leading-8 text-[#7c6b93]">
            {message}
          </p>

          {!loading && !success && (
            <div className="mt-8">
              <Link
                to="/login"
                className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)]"
              >
                Back to Login
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default VerifyEmailPage