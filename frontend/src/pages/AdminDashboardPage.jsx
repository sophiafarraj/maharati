import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import UserAvatar from '../components/UserAvatar'
import {
  Bell,
  ShieldCheck,
  Shield,
  Users,
  History,
  AlertTriangle,
  CheckCircle2,
  Ban,
  MailCheck,
  LayoutDashboard,
  LogOut,
  ArrowUpRight,
} from 'lucide-react'

function AdminDashboardPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        const userData = await userRes.json()
        const statsData = await statsRes.json()

        if (!userRes.ok) {
          navigate('/login')
          return
        }

        const user = userData.user || userData

        if (!['admin', 'super_admin'].includes(user.role)) {
          navigate('/dashboard')
          return
        }

        setCurrentUser(user)
        localStorage.setItem('user', JSON.stringify(user))

        if (!statsRes.ok) {
          setMessage(statsData.message || 'Failed to load admin stats')
          return
        }

        setStats(statsData.stats || null)
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [navigate])

  const isSuperAdmin = currentUser?.role === 'super_admin'

  const sidebarLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/sessions', label: 'Sessions', icon: History },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
    ...(isSuperAdmin
      ? [{ to: '/super-admin/admins', label: 'Admin Management', icon: Shield }]
      : []),
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading admin dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f5fb] text-[#1f172b]">
      <header className="sticky top-0 z-30 border-b border-[#ece7f4] bg-[#f7f5fb]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-[34px] font-semibold tracking-[-0.05em] text-[#5b34a5]">
            Maharati
          </div>

          <nav className="hidden items-center gap-10 text-[15px] font-medium text-[#594e68] md:flex">
            <Link to="/admin" className="transition-colors hover:text-[#2f1b45]">
              Dashboard
            </Link>
            <Link to="/admin/users" className="transition-colors hover:text-[#2f1b45]">
              Users
            </Link>
            <Link to="/admin/disputes" className="transition-colors hover:text-[#2f1b45]">
              Disputes
            </Link>
            {isSuperAdmin && (
              <Link
                to="/super-admin/admins"
                className="transition-colors hover:text-[#2f1b45]"
              >
                Admin Management
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5b34a5] shadow-[0_10px_24px_rgba(31,23,42,0.06)] transition-all hover:-translate-y-0.5"
              aria-label="Open notifications"
            >
              <Bell size={18} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="transition-transform hover:scale-105"
            >
              <UserAvatar
                name={currentUser?.name}
                profileImage={currentUser?.profileImage}
                size="sm"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[250px_1fr]">
        <aside className="flex flex-col">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={currentUser?.name}
                profileImage={currentUser?.profileImage}
                size="lg"
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-[-0.03em] text-[#2f1b45]">
                  {currentUser?.name || 'Admin'}
                </h2>
                <p className="mt-1 text-sm text-[#857996]">
                  {isSuperAdmin ? 'Super admin console' : 'Admin console'}
                </p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-3 py-2 text-xs font-medium text-[#5b34a5]">
              <ShieldCheck size={12} />
              {isSuperAdmin ? 'Super administrator access' : 'Administrator access'}
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
            <p className="text-sm text-white/70">Platform oversight</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {isSuperAdmin ? 'Govern the system' : 'Monitor operations'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {isSuperAdmin
                ? 'Manage admins, users, sessions, disputes, verification, and overall platform control.'
                : 'Monitor users, sessions, disputes, verification, and overall platform health.'}
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              navigate('/login')
            }}
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
                  {isSuperAdmin ? 'Super admin workspace' : 'Admin workspace'}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  {isSuperAdmin
                    ? 'Oversee platform health, control admin access, inspect session flow, and manage disputes with full authority.'
                    : 'Monitor the platform, review user activity, inspect session flow, and resolve disputes with confidence.'}
                </p>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Total Users</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalUsers ?? 0}
              </h2>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Total Sessions</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalSessions ?? 0}
              </h2>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Total Slots</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalSlots ?? 0}
              </h2>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <p className="text-sm text-[#8a7d9f]">Disputes</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalDisputes ?? 0}
              </h2>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#5b34a5]">
                <CheckCircle2 size={16} />
                <p className="text-sm text-[#8a7d9f]">Finished Sessions</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalFinishedSessions ?? 0}
              </h2>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#5b34a5]">
                <Ban size={16} />
                <p className="text-sm text-[#8a7d9f]">Cancelled Sessions</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalCancelledSessions ?? 0}
              </h2>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#5b34a5]">
                <ShieldCheck size={16} />
                <p className="text-sm text-[#8a7d9f]">Suspended Users</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalSuspendedUsers ?? 0}
              </h2>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#5b34a5]">
                <MailCheck size={16} />
                <p className="text-sm text-[#8a7d9f]">Verified Users</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                {stats?.totalVerifiedUsers ?? 0}
              </h2>
            </div>
          </section>

          {isSuperAdmin && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
                <p className="text-sm text-[#8a7d9f]">Admin Accounts</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                  {stats?.totalAdmins ?? 0}
                </h2>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]">
                <p className="text-sm text-[#8a7d9f]">Super Admin Accounts</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#24152f]">
                  {stats?.totalSuperAdmins ?? 0}
                </h2>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                Session flow
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Live session states
              </h3>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Booked</p>
                  <p className="mt-2 text-2xl font-semibold text-[#24152f]">
                    {stats?.totalBookedSessions ?? 0}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Awaiting Confirmation</p>
                  <p className="mt-2 text-2xl font-semibold text-[#24152f]">
                    {stats?.totalAwaitingConfirmationSessions ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                Slot inventory
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Current availability
              </h3>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Available Slots</p>
                  <p className="mt-2 text-2xl font-semibold text-[#24152f]">
                    {stats?.totalAvailableSlots ?? 0}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#8a7d9f]">Booked Slots</p>
                  <p className="mt-2 text-2xl font-semibold text-[#24152f]">
                    {stats?.totalBookedSlots ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={`grid grid-cols-1 gap-4 ${isSuperAdmin ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
            <Link
              to="/admin/users"
              className="group rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#5b34a5]">
                    <Users size={18} />
                    <p className="text-sm font-medium">Users</p>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[#24152f]">Manage users</h3>
                  <p className="mt-2 text-sm leading-7 text-[#8a7d9f]">
                    Review profiles, balances, skills, verification, and suspension state.
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-[#9b84b7] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </Link>

            <Link
              to="/admin/sessions"
              className="group rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#5b34a5]">
                    <History size={18} />
                    <p className="text-sm font-medium">Sessions</p>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[#24152f]">Inspect sessions</h3>
                  <p className="mt-2 text-sm leading-7 text-[#8a7d9f]">
                    Review session states, timing, participants, and overall flow.
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-[#9b84b7] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </Link>

            <Link
              to="/admin/disputes"
              className="group rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#5b34a5]">
                    <AlertTriangle size={18} />
                    <p className="text-sm font-medium">Disputes</p>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[#24152f]">Resolve disputes</h3>
                  <p className="mt-2 text-sm leading-7 text-[#8a7d9f]">
                    Refund students or release escrow to teachers when disputes occur.
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-[#9b84b7] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </Link>

            {isSuperAdmin && (
              <Link
                to="/super-admin/admins"
                className="group rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#5b34a5]">
                      <Shield size={18} />
                      <p className="text-sm font-medium">Admin Management</p>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-[#24152f]">Control admins</h3>
                    <p className="mt-2 text-sm leading-7 text-[#8a7d9f]">
                      Promote users to admin, review admin accounts, and remove admin access.
                    </p>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-[#9b84b7] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardPage