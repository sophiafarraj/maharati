import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import UserAvatar from '../components/UserAvatar'
import {
  Bell,
  ShieldCheck,
  Users,
  History,
  AlertTriangle,
  LayoutDashboard,
  LogOut,
  Search,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'

function AdminDisputesPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [savingId, setSavingId] = useState('')

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  useEffect(() => {
    const fetchAdminDisputes = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, disputesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/admin/disputes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const userData = await userRes.json()
        const disputesData = await disputesRes.json()

        if (!userRes.ok) {
          navigate('/login')
          return
        }

        const user = userData.user || userData

        if (user.role !== 'admin') {
          navigate('/dashboard')
          return
        }

        setCurrentUser(user)
        localStorage.setItem('user', JSON.stringify(user))

        if (!disputesRes.ok) {
          setMessage(disputesData.message || 'Failed to load disputes')
          return
        }

        setDisputes(disputesData.disputes || [])
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminDisputes()
  }, [navigate])

  const filteredDisputes = useMemo(() => {
    const q = search.trim().toLowerCase()

    return disputes.filter((session) => {
      const matchesSearch =
        !q ||
        session.skill?.toLowerCase().includes(q) ||
        session.studentId?.name?.toLowerCase().includes(q) ||
        session.studentId?.email?.toLowerCase().includes(q) ||
        session.teacherId?.name?.toLowerCase().includes(q) ||
        session.teacherId?.email?.toLowerCase().includes(q) ||
        session.disputeReason?.toLowerCase().includes(q)

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'open' && !session.disputeResolved) ||
        (statusFilter === 'resolved' && session.disputeResolved)

      return matchesSearch && matchesStatus
    })
  }, [disputes, search, statusFilter])

  const formatDateTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const handleResolve = async (sessionId, resolution) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setSavingId(sessionId)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/disputes/${sessionId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolution }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to resolve dispute')
        return
      }

      setDisputes((prev) =>
        prev.map((item) => (item._id === sessionId ? data.session : item))
      )
      setMessage(data.message || 'Dispute resolved successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setSavingId('')
    }
  }

  const sidebarLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/sessions', label: 'Sessions', icon: History },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading disputes...
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
                <p className="mt-1 text-sm text-[#857996]">Admin workspace</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-3 py-2 text-xs font-medium text-[#5b34a5]">
              <ShieldCheck size={12} />
              Dispute resolution
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
            <p className="text-sm text-white/70">Dispute handling</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Resolve fairly
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Review the context carefully, then refund the student or release to the teacher.
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
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8e7aa7]">
                Admin workspace
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                Resolve Disputes
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                Review disputed sessions, inspect context, and decide whether to refund the student or release funds to the teacher.
              </p>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          <section className="rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by skill, student, teacher, or dispute reason"
                  className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
              >
                <option value="">All disputes</option>
                <option value="open">Open disputes</option>
                <option value="resolved">Resolved disputes</option>
              </select>
            </div>
          </section>

          <div className="space-y-5">
            {filteredDisputes.map((session) => (
              <div
                key={session._id}
                className="rounded-[30px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)]"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                      {session.skill}
                    </h3>

                    {session.disputeResolved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#027a48]">
                        <CheckCircle2 size={12} />
                        Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ffe7e7] px-3 py-1 text-xs font-semibold text-[#b42318]">
                        <AlertTriangle size={12} />
                        Open dispute
                      </span>
                    )}

                    {session.disputeResolution && (
                      <span className="rounded-full bg-[#f4f1f8] px-3 py-1 text-xs font-semibold capitalize text-[#5b34a5]">
                        {session.disputeResolution.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm text-[#8a7d9f]">Student</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                        {session.studentId?.name || '—'}
                      </p>
                      <p className="text-xs text-[#8a7d9f]">{session.studentId?.email || ''}</p>
                    </div>

                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm text-[#8a7d9f]">Teacher</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                        {session.teacherId?.name || '—'}
                      </p>
                      <p className="text-xs text-[#8a7d9f]">{session.teacherId?.email || ''}</p>
                    </div>

                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm text-[#8a7d9f]">Scheduled</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                        {formatDateTime(session.scheduledAt || session.slotId?.startAt)}
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm text-[#8a7d9f]">Mode / Escrow</p>
                      <p className="mt-2 text-sm font-semibold leading-6 capitalize text-[#24152f]">
                        {session.mode} / {session.escrowAmount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-[22px] bg-[#fff7fa] p-4">
                      <p className="text-sm font-medium text-[#c01048]">Dispute reason</p>
                      <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                        {session.disputeReason || 'No dispute reason provided.'}
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm font-medium text-[#8a7d9f]">Resolution details</p>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[#6b6479]">
                        <p>
                          <span className="font-medium text-[#24152f]">Resolved:</span>{' '}
                          {session.disputeResolved ? 'Yes' : 'No'}
                        </p>
                        <p>
                          <span className="font-medium text-[#24152f]">Resolution:</span>{' '}
                          {session.disputeResolution
                            ? session.disputeResolution.replace('_', ' ')
                            : 'Pending'}
                        </p>
                        <p>
                          <span className="font-medium text-[#24152f]">Resolved at:</span>{' '}
                          {session.disputeResolvedAt
                            ? formatDateTime(session.disputeResolvedAt)
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!session.disputeResolved && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleResolve(session._id, 'refund_student')}
                        disabled={savingId === session._id}
                        className="rounded-2xl bg-[#fff1f3] px-5 py-3 text-sm font-medium text-[#c01048] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {savingId === session._id ? 'Resolving...' : 'Refund Student'}
                      </button>

                      <button
                        onClick={() => handleResolve(session._id, 'release_to_teacher')}
                        disabled={savingId === session._id}
                        className="rounded-2xl bg-[#ecfdf3] px-5 py-3 text-sm font-medium text-[#027a48] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {savingId === session._id ? 'Resolving...' : 'Release to Teacher'}
                      </button>
                    </div>
                  )}

                  {session.disputeResolved && (
                    <div className="rounded-[22px] bg-[#ecfdf3] p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-[#027a48]">
                        <RotateCcw size={14} />
                        This dispute has already been resolved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDisputesPage