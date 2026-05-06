import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false)
  const [nextRoute, setNextRoute] = useState('/dashboard')

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      setForm((prev) => ({ ...prev, email: rememberedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const fetchCurrentUser = async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to load user profile')
    }

    return data.user || data
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Login failed')
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      const currentUser = data.user || (await fetchCurrentUser(data.token))
      localStorage.setItem('user', JSON.stringify(currentUser))

      if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
        setNextRoute('/admin')
      } else {
        setNextRoute('/dashboard')
      }

      if (currentUser && !currentUser.isEmailVerified) {
        setMessage('Logged in successfully. Please verify your email to unlock booking and slot creation.')
      }

      setShowWelcomeBackModal(true)
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
              to="/"
              className="rounded-full bg-[#e8e3ea] px-6 py-2 text-lg font-medium text-[#4d3b63]"
            >
              Home
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-[#8b3fe0] px-6 py-2 text-lg font-medium text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-10 px-6 pb-12 pt-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <div className="rounded-[42px] bg-white/70 p-6 shadow-[0_12px_35px_rgba(123,92,146,0.14)]">
            <div className="rounded-[34px] bg-gradient-to-br from-[#ffffff] via-[#f1e9fb] to-[#d8c0f3] p-8">
              <div className="rounded-[26px] bg-white p-6 shadow-[0_10px_24px_rgba(139,63,224,0.10)]">
                <p className="text-lg font-semibold italic text-[#7b5c92]">
                  Welcome back to Maharati
                </p>

                <h1 className="mt-4 text-5xl font-bold leading-tight text-[#2f1f46]">
                  Learn.
                  <br />
                  Teach.
                  <br />
                  Earn.
                </h1>

                <p className="mt-5 text-xl leading-9 text-[#6f5d86]">
                  Sign in to manage your sessions, discover tutors, and continue
                  your trusted skill exchange journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-xl rounded-[34px] bg-white p-8 shadow-[0_12px_30px_rgba(123,92,146,0.14)] sm:p-10">
            <div className="mb-6 text-center">
              <p className="text-lg font-medium text-[#8a68ad]">Member Login</p>
              <h2 className="mt-2 text-4xl font-semibold text-[#2f1f46]">
                Sign in to your account
              </h2>
              <p className="mt-3 text-base leading-7 text-[#7c6b93]">
                Access your dashboard, sessions, profile, and instructor workflow.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e6dcef] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#a97be0]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e6dcef] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#a97be0]"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#7c6b93]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#d7cae6]"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="font-medium text-[#8b3fe0]">
                  Forgot Password?
                </Link>
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
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#7c6b93]">
              Don’t have an account?{' '}
              <Link to="/signup" className="font-semibold text-[#8b3fe0]">
                Create one
              </Link>
            </p>
          </div>
        </section>
      </main>

      {showWelcomeBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#e8ddf2] bg-white p-8 text-center shadow-[0_20px_50px_rgba(43,23,72,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Welcome back
            </p>
            <h2 className="mt-3 text-4xl font-semibold text-[#4d3b63]">
              Great to see you again
            </h2>
            <p className="mt-4 text-base leading-8 text-[#8a7d9f]">
              Your Maharati workspace is ready. Continue to your dashboard to
              manage your profile, sessions, and availability. If your email is not
              verified yet, some important actions will stay locked until you verify it.
            </p>

            <div className="mt-8">
              <button
                onClick={() => navigate(nextRoute)}
                className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage