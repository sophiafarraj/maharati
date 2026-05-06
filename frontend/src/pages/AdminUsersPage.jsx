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
  MailCheck,
  Ban,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

function AdminUsersPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedUserId, setExpandedUserId] = useState('')
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'user',
    creditBalance: 0,
    moneyBalance: 0,
    reliabilityScore: 50,
    isEmailVerified: false,
    skillsOffered: '',
    skillsWanted: '',
  })

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  useEffect(() => {
    const fetchAdminUsers = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const userData = await userRes.json()
        const usersData = await usersRes.json()

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

        if (!usersRes.ok) {
          setMessage(usersData.message || 'Failed to load users')
          return
        }

        setUsers(usersData.users || [])
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminUsers()
  }, [navigate])

  const sidebarLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/sessions', label: 'Sessions', icon: History },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  ]

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)

      const matchesRole = !filterRole || user.role === filterRole

      const matchesStatus =
        !filterStatus ||
        (filterStatus === 'verified' && user.isEmailVerified) ||
        (filterStatus === 'unverified' && !user.isEmailVerified) ||
        (filterStatus === 'suspended' && user.isSuspended) ||
        (filterStatus === 'active' && !user.isSuspended)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, filterRole, filterStatus])

  const openUser = (user) => {
    if (expandedUserId === user._id) {
      setExpandedUserId('')
      return
    }

    setExpandedUserId(user._id)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      creditBalance: Number(user.creditBalance || 0),
      moneyBalance: Number(user.moneyBalance || 0),
      reliabilityScore: Number(user.reliabilityScore || 0),
      isEmailVerified: !!user.isEmailVerified,
      skillsOffered: Array.isArray(user.skillsOffered) ? user.skillsOffered.join(', ') : '',
      skillsWanted: Array.isArray(user.skillsWanted) ? user.skillsWanted.join(', ') : '',
    })
    setMessage('')
  }

  const closeUser = () => {
    setExpandedUserId('')
  }

  const parseSkills = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const handleSaveUser = async (userId) => {
    const token = localStorage.getItem('token')
    if (!token || !userId) return

    setSavingUserId(userId)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          creditBalance: Number(editForm.creditBalance),
          moneyBalance: Number(editForm.moneyBalance),
          reliabilityScore: Number(editForm.reliabilityScore),
          isEmailVerified: !!editForm.isEmailVerified,
          skillsOffered: parseSkills(editForm.skillsOffered),
          skillsWanted: parseSkills(editForm.skillsWanted),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to update user')
        return
      }

      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? data.user : user))
      )
      setMessage('User updated successfully.')
      setExpandedUserId('')
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setSavingUserId('')
    }
  }

  const handleToggleSuspension = async (user) => {
    const token = localStorage.getItem('token')
    if (!token) return

    const reason =
      user.isSuspended
        ? ''
        : window.prompt('Enter suspension reason', user.suspensionReason || '') || ''

    setSavingUserId(user._id)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user._id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isSuspended: !user.isSuspended,
          suspensionReason: reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to update suspension state')
        return
      }

      setUsers((prev) => prev.map((item) => (item._id === user._id ? data.user : item)))
      setMessage(data.message || 'User updated successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setSavingUserId('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading admin users...
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
              User control
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
            <p className="text-sm text-white/70">User governance</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Review carefully
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Scan quickly, expand only when needed, and keep actions deliberate.
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
                Manage Users
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                Search and scan the user base quickly, then expand only the account you want to inspect or edit.
              </p>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          <section className="rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
              >
                <option value="">All roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
              >
                <option value="">All statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="suspended">Suspended</option>
                <option value="active">Active</option>
              </select>
            </div>
          </section>

          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUserId === user._id

              return (
                <div
                  key={user._id}
                  className="rounded-[28px] bg-white p-5 shadow-[0_18px_44px_rgba(31,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          name={user.name}
                          profileImage={user.profileImage}
                          size="md"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-semibold tracking-[-0.03em] text-[#24152f]">
                              {user.name}
                            </h3>

                            <span className="rounded-full bg-[#f4f1f8] px-3 py-1 text-xs font-semibold text-[#5b34a5]">
                              {user.role}
                            </span>

                            {user.isEmailVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#027a48]">
                                <MailCheck size={12} />
                                Verified
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#fff7e8] px-3 py-1 text-xs font-semibold text-[#9a6700]">
                                Unverified
                              </span>
                            )}

                            {user.isSuspended && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f3] px-3 py-1 text-xs font-semibold text-[#c01048]">
                                <Ban size={12} />
                                Suspended
                              </span>
                            )}
                          </div>

                          <p className="mt-2 truncate text-sm text-[#8a7d9f]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openUser(user)}
                        className="rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
                      >
                        <span className="inline-flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Close' : 'View'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleToggleSuspension(user)}
                        disabled={savingUserId === user._id || currentUser?._id === user._id}
                        className={`rounded-2xl px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 ${
                          user.isSuspended
                            ? 'bg-[#ecfdf3] text-[#027a48]'
                            : 'bg-[#fff1f3] text-[#c01048]'
                        }`}
                      >
                        {savingUserId === user._id
                          ? 'Updating...'
                          : user.isSuspended
                          ? 'Unsuspend'
                          : 'Suspend'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 rounded-[24px] bg-[#faf8fd] p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[20px] bg-white p-4">
                          <p className="text-sm text-[#8a7d9f]">Credits</p>
                          <p className="mt-2 text-sm font-semibold text-[#24152f]">
                            {user.creditBalance ?? 0}
                          </p>
                        </div>

                        <div className="rounded-[20px] bg-white p-4">
                          <p className="text-sm text-[#8a7d9f]">Money</p>
                          <p className="mt-2 text-sm font-semibold text-[#24152f]">
                            {user.moneyBalance ?? 0}
                          </p>
                        </div>

                        <div className="rounded-[20px] bg-white p-4">
                          <p className="text-sm text-[#8a7d9f]">Reliability</p>
                          <p className="mt-2 text-sm font-semibold text-[#24152f]">
                            {user.reliabilityScore ?? 0}
                          </p>
                        </div>

                        <div className="rounded-[20px] bg-white p-4">
                          <p className="text-sm text-[#8a7d9f]">Completed Sessions</p>
                          <p className="mt-2 text-sm font-semibold text-[#24152f]">
                            {user.completedSessions ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-[20px] bg-white p-4">
                          <p className="text-sm text-[#8a7d9f]">Skills Offered</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(user.skillsOffered || []).length > 0 ? (
                              user.skillsOffered.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-[#f1ebff] px-3 py-2 text-sm font-medium text-[#6840a3]"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-[#8a7d9f]">None</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[20px] bg-white p-4">
                          <p className="text-sm text-[#8a7d9f]">Skills Wanted</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(user.skillsWanted || []).length > 0 ? (
                              user.skillsWanted.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-[#ede9fe] px-3 py-2 text-sm font-medium text-[#5f43a1]"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-[#8a7d9f]">None</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {user.isSuspended && user.suspensionReason && (
                        <div className="mt-4 rounded-[20px] bg-[#fff7fa] p-4">
                          <p className="text-sm font-medium text-[#c01048]">Suspension reason</p>
                          <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                            {user.suspensionReason}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 rounded-[20px] bg-white p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Name"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          />

                          <input
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder="Email"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          />

                          <select
                            value={editForm.role}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, role: e.target.value }))
                            }
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>

                          <select
                            value={editForm.isEmailVerified ? 'yes' : 'no'}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                isEmailVerified: e.target.value === 'yes',
                              }))
                            }
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          >
                            <option value="yes">Verified</option>
                            <option value="no">Unverified</option>
                          </select>

                          <input
                            type="number"
                            value={editForm.creditBalance}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                creditBalance: e.target.value,
                              }))
                            }
                            placeholder="Credit balance"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          />

                          <input
                            type="number"
                            value={editForm.moneyBalance}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                moneyBalance: e.target.value,
                              }))
                            }
                            placeholder="Money balance"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          />

                          <input
                            type="number"
                            value={editForm.reliabilityScore}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                reliabilityScore: e.target.value,
                              }))
                            }
                            placeholder="Reliability score"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea] md:col-span-2"
                          />

                          <textarea
                            value={editForm.skillsOffered}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                skillsOffered: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Skills offered, comma separated"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          />

                          <textarea
                            value={editForm.skillsWanted}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                skillsWanted: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Skills wanted, comma separated"
                            className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveUser(user._id)}
                            disabled={savingUserId === user._id}
                            className="rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                          >
                            {savingUserId === user._id ? 'Saving...' : 'Save user'}
                          </button>

                          <button
                            type="button"
                            onClick={closeUser}
                            className="rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
                          >
                            <span className="inline-flex items-center gap-2">
                              <X size={14} />
                              Close
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminUsersPage