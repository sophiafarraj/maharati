import { useEffect, useMemo, useState } from 'react'
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
  LayoutDashboard,
  LogOut,
  Search,
  MailCheck,
  UserPlus,
  UserMinus,
} from 'lucide-react'

function SuperAdminAdminsPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [admins, setAdmins] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchAdmins, setSearchAdmins] = useState('')
  const [searchUsers, setSearchUsers] = useState('')
  const [savingId, setSavingId] = useState('')

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, adminsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/admin/admins`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const userData = await userRes.json()
        const adminsData = await adminsRes.json()
        const usersData = await usersRes.json()

        if (!userRes.ok) {
          navigate('/login')
          return
        }

        const user = userData.user || userData

        if (user.role !== 'super_admin') {
          navigate('/admin')
          return
        }

        setCurrentUser(user)
        localStorage.setItem('user', JSON.stringify(user))

        if (!adminsRes.ok) {
          setMessage(adminsData.message || 'Failed to load admins')
          return
        }

        if (!usersRes.ok) {
          setMessage(usersData.message || 'Failed to load users')
          return
        }

        setAdmins(adminsData.admins || [])
        setAllUsers(usersData.users || [])
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const sidebarLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/sessions', label: 'Sessions', icon: History },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
    { to: '/super-admin/admins', label: 'Admin Management', icon: Shield },
  ]

  const filteredAdmins = useMemo(() => {
    const q = searchAdmins.trim().toLowerCase()

    return admins.filter((user) => {
      if (!q) return true
      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      )
    })
  }, [admins, searchAdmins])

  const promotableUsers = useMemo(() => {
    const q = searchUsers.trim().toLowerCase()

    return allUsers.filter((user) => {
      if (user.role === 'admin' || user.role === 'super_admin') return false

      if (!q) return true

      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      )
    })
  }, [allUsers, searchUsers])

  const refreshData = async () => {
    const token = localStorage.getItem('token')

    try {
      const [adminsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const adminsData = await adminsRes.json()
      const usersData = await usersRes.json()

      if (adminsRes.ok) {
        setAdmins(adminsData.admins || [])
      }

      if (usersRes.ok) {
        setAllUsers(usersData.users || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleMakeAdmin = async (userId) => {
    const token = localStorage.getItem('token')
    setSavingId(userId)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/admins/${userId}/promote`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to promote user')
        return
      }

      setMessage(data.message || 'User promoted to admin successfully.')
      await refreshData()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setSavingId('')
    }
  }

  const handleRemoveAdmin = async (userId) => {
    const token = localStorage.getItem('token')
    setSavingId(userId)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/admins/${userId}/remove`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to remove admin')
        return
      }

      setMessage(data.message || 'Admin removed successfully.')
      await refreshData()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setSavingId('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading admin management...
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
            <Link to="/super-admin/admins" className="transition-colors hover:text-[#2f1b45]">
              Admin Management
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
                  {currentUser?.name || 'Super Admin'}
                </h2>
                <p className="mt-1 text-sm text-[#857996]">Super admin console</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-3 py-2 text-xs font-medium text-[#5b34a5]">
              <ShieldCheck size={12} />
              Super administrator access
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
            <p className="text-sm text-white/70">Authority control</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Manage admins
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Promote trusted users into admin roles and remove admin access when needed.
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
                Super admin workspace
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                Admin Management
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                Control who becomes an admin, review current administrative access, and keep platform authority centralized.
              </p>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                    Current admins
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                    Admin accounts
                  </h2>
                </div>
                <span className="rounded-full bg-[#f4efff] px-3 py-1 text-xs font-semibold text-[#5b34a5]">
                  {filteredAdmins.length}
                </span>
              </div>

              <div className="mt-5 relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                />
                <input
                  value={searchAdmins}
                  onChange={(e) => setSearchAdmins(e.target.value)}
                  placeholder="Search current admins"
                  className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
                />
              </div>

              <div className="mt-5 space-y-4">
                {filteredAdmins.map((user) => (
                  <div
                    key={user._id}
                    className="rounded-[24px] bg-[#faf8fd] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <UserAvatar
                          name={user.name}
                          profileImage={user.profileImage}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-[#24152f]">
                              {user.name}
                            </h3>
                            <span className="rounded-full bg-[#f1ebff] px-3 py-1 text-xs font-semibold text-[#6840a3]">
                              {user.role}
                            </span>
                            {user.isEmailVerified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#027a48]">
                                <MailCheck size={12} />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="mt-2 truncate text-sm text-[#8a7d9f]">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {user.role === 'admin' ? (
                        <button
                          onClick={() => handleRemoveAdmin(user._id)}
                          disabled={savingId === user._id}
                          className="rounded-2xl bg-[#fff1f3] px-4 py-2.5 text-sm font-medium text-[#c01048] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        >
                          <span className="inline-flex items-center gap-2">
                            <UserMinus size={14} />
                            {savingId === user._id ? 'Removing...' : 'Remove admin'}
                          </span>
                        </button>
                      ) : (
                        <span className="rounded-2xl bg-[#f4f1f8] px-4 py-2.5 text-sm font-medium text-[#4d3b63]">
                          Super admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                    Promotion candidates
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                    Promote users
                  </h2>
                </div>
                <span className="rounded-full bg-[#f4efff] px-3 py-1 text-xs font-semibold text-[#5b34a5]">
                  {promotableUsers.length}
                </span>
              </div>

              <div className="mt-5 relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                />
                <input
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  placeholder="Search promotable users"
                  className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
                />
              </div>

              <div className="mt-5 space-y-4">
                {promotableUsers.map((user) => (
                  <div
                    key={user._id}
                    className="rounded-[24px] bg-[#faf8fd] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <UserAvatar
                          name={user.name}
                          profileImage={user.profileImage}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-[#24152f]">
                              {user.name}
                            </h3>
                            <span className="rounded-full bg-[#f4f1f8] px-3 py-1 text-xs font-semibold text-[#5b34a5]">
                              {user.role}
                            </span>
                            {user.isEmailVerified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#027a48]">
                                <MailCheck size={12} />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="mt-2 truncate text-sm text-[#8a7d9f]">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleMakeAdmin(user._id)}
                        disabled={savingId === user._id}
                        className="rounded-2xl bg-[#6d3df2] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        <span className="inline-flex items-center gap-2">
                          <UserPlus size={14} />
                          {savingId === user._id ? 'Promoting...' : 'Make admin'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default SuperAdminAdminsPage