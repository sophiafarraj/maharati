import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import { isProfileComplete } from '../utils/profile'
import UserAvatar from '../components/UserAvatar'
import {
  Bell,
  Sparkles,
  LayoutDashboard,
  UserPen,
  Search,
  CalendarRange,
  History,
  Briefcase,
  LogOut,
  ArrowUpRight,
} from 'lucide-react'

function DashboardPage() {
  const [user, setUser] = useState(null)
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const fetchUnreadNotifications = async (token) => {
    try {
      setNotificationsLoading(true)

      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) return
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setNotificationsLoading(false)
    }
  }

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          navigate('/login')
          return
        }

        const currentUser = data.user || data
        setUser(currentUser)
        localStorage.setItem('user', JSON.stringify(currentUser))
        await fetchUnreadNotifications(token)

        if (!isProfileComplete(currentUser)) {
          setShowProfilePrompt(true)
        }
      } catch (err) {
        console.error(err)
        navigate('/login')
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberedEmail')
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading dashboard...
        </div>
      </div>
    )
  }

  const creditBalance = user.creditBalance ?? 0
  const reliabilityScore = user.reliabilityScore ?? 0
  const ratingAvg = user.ratingAvg ?? 0
  const completedSessions = user.completedSessions ?? 0
  const ratingCount = user.ratingCount ?? 0
  const disputeCount = user.disputeCount ?? 0

  const trustStatus =
    reliabilityScore >= 75 ? 'Excellent' : reliabilityScore >= 40 ? 'Strong' : 'Growing'

  const sidebarLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile/edit', label: 'Edit Profile', icon: UserPen },
    { to: '/teachers', label: 'Find tutors', icon: Search },
    { to: '/slots', label: 'My Slots', icon: CalendarRange },
    { to: '/sessions', label: 'Session History', icon: History },
    { to: '/teacher/requests', label: 'Booked Sessions', icon: Briefcase },
  ]

  const quickActions = [
    {
      to: '/teachers',
      title: 'Browse Teachers',
      description: 'Explore instructors, skills, and available sessions.',
    },
    {
      to: '/slots/new',
      title: 'Create Slot',
      description: 'Publish a one-hour teaching slot for learners to book.',
    },
    {
      to: '/sessions',
      title: 'Session History',
      description: 'Track your sessions through every stage.',
    },
    {
      to: '/slots',
      title: 'My Slots',
      description: 'Manage your teaching availability and updates.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f5fb] text-[#1f172b]">
      <header className="sticky top-0 z-30 border-b border-[#ece7f4] bg-[#f7f5fb]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-[34px] font-semibold tracking-[-0.05em] text-[#5b34a5]">
            Maharati
          </div>

          <nav className="hidden items-center gap-10 text-[15px] font-medium text-[#594e68] md:flex">
            <Link to="/teachers" className="transition-colors hover:text-[#2f1b45]">
              Find tutors
            </Link>
            <Link to="/slots" className="transition-colors hover:text-[#2f1b45]">
              My slots
            </Link>
            <Link to="/sessions" className="transition-colors hover:text-[#2f1b45]">
              Session history
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5b34a5] shadow-[0_10px_24px_rgba(31,23,42,0.06)] transition-all hover:-translate-y-0.5"
              aria-label="Open notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#6d3df2] px-1 text-[11px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="transition-transform hover:scale-105"
            >
              <UserAvatar name={user.name} profileImage={user?.profileImage} size="sm" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[250px_1fr]">
        <aside className="flex flex-col">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <div className="flex items-center gap-4">
              <UserAvatar name={user.name} profileImage={user?.profileImage} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-[-0.03em] text-[#2f1b45]">
                  {user.name}
                </h2>
                <p className="mt-1 text-sm text-[#857996]">Member workspace</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-3 py-2 text-xs font-medium text-[#5b34a5]">
              <Sparkles size={12} />
              {user.isEmailVerified ? 'Verified account' : 'Verification pending'}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] bg-white p-3 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <div className="space-y-1.5">
              {sidebarLinks.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink key={item.to} to={item.to} className={getSidebarLinkClass}>
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] bg-[#2b173f] p-5 text-white shadow-[0_22px_55px_rgba(43,23,63,0.24)]">
            <p className="text-sm text-white/70">Trust Status</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {trustStatus}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Your profile grows stronger as you complete sessions and receive reviews.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#6f5a89] shadow-[0_10px_24px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:text-[#2f1b45]"
          >
            <LogOut size={15} />
            Log out
          </button>
        </aside>

        <main className="space-y-8">
          <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#f3edff_0%,#ede5ff_42%,#ffffff_100%)] px-8 py-9 shadow-[0_24px_60px_rgba(31,23,42,0.06)] md:px-10 md:py-11">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8e7aa7]">
                  Member workspace
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  Welcome back, {user.name}
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Manage your growth, discover tutors, publish your availability, and move through Maharati with clarity and confidence.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5b34a5] shadow-sm">
                    Protected session flow
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5b34a5] shadow-sm">
                    Structured skill matching
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/teachers"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-[#6d3df2] px-6 py-3.5 text-sm font-medium text-white shadow-[0_16px_32px_rgba(109,61,242,0.28)] transition-all hover:-translate-y-0.5"
                >
                  Find tutors
                  <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/slots/new"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-medium text-[#2f1b45] shadow-[0_10px_24px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5"
                >
                  Create slot
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Credit Balance</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {creditBalance}
              </h2>
              <p className="mt-2 text-sm text-[#8a7d9f]">Available for future bookings.</p>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Reliability Score</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {reliabilityScore}
              </h2>
              <p className="mt-2 text-sm text-[#8a7d9f]">Trust indicator across your activity.</p>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Rating Average</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {Number(ratingAvg).toFixed(1)}
              </h2>
              <p className="mt-2 text-sm text-[#8a7d9f]">Average learner sentiment.</p>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Completed Sessions</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {completedSessions}
              </h2>
              <p className="mt-2 text-sm text-[#8a7d9f]">Finished sessions across your account.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
            <div className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                    Profile Summary
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                    Your Maharati identity
                  </h3>
                </div>

                <Link
                  to="/profile/edit"
                  className="rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5"
                >
                  Edit Profile
                </Link>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Email</p>
                  <p className="mt-2 font-medium text-[#352046]">{user.email}</p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Role</p>
                  <p className="mt-2 font-medium capitalize text-[#352046]">
                    {user.role || 'member'}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Skills Offered</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.isArray(user.skillsOffered) && user.skillsOffered.length > 0 ? (
                      user.skillsOffered.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#f1ebff] px-3 py-2 text-sm font-medium text-[#6840a3]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-[#4d3b63]">No skills added yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Skills Wanted</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.isArray(user.skillsWanted) && user.skillsWanted.length > 0 ? (
                      user.skillsWanted.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#ede9fe] px-3 py-2 text-sm font-medium text-[#5f43a1]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-[#4d3b63]">No learning goals added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                Quick Actions
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Continue your journey
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#7d6a95]">
                Move through the most important flows with clarity and speed.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4">
                {quickActions.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group rounded-[24px] bg-[#faf8fd] p-5 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-[0_14px_28px_rgba(31,23,42,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-[#352046]">{item.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-[#8a7d9f]">
                          {item.description}
                        </p>
                      </div>

                      <ArrowUpRight
                        size={18}
                        className="mt-1 text-[#9b84b7] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Rating Count</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {ratingCount}
              </h3>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Disputes</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {disputeCount}
              </h3>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Trust Status</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {trustStatus}
              </h3>
            </div>
          </section>
        </main>
      </div>

      {showProfilePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1028]/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-[0_34px_80px_rgba(43,23,72,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Complete your profile
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#2e1847]">
              Finish setting up Maharati
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#8a7d9f]">
              Add your offered and wanted skills so the platform can guide you properly through tutor discovery, booking, and teaching.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/profile/edit')}
                className="rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5"
              >
                Complete Profile
              </button>

              <button
                onClick={() => setShowProfilePrompt(false)}
                className="rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage