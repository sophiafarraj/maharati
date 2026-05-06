import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import UserAvatar from '../components/UserAvatar'
import {
  Star,
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
  SlidersHorizontal,
} from 'lucide-react'

function StarsDisplay({ value, size = 15 }) {
  const numeric = Number(value || 0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const active = starValue <= Math.round(numeric)

        return (
          <Star
            key={starValue}
            size={size}
            className={active ? 'text-[#6d3df2]' : 'text-[#ddd6ea]'}
            fill={active ? 'currentColor' : 'none'}
          />
        )
      })}
    </div>
  )
}

function BrowseTeachersPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [minRating, setMinRating] = useState('')
  const [minTrust, setMinTrust] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  const fetchUnreadNotifications = async (token) => {
    try {
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
    }
  }

  const fetchTeachers = async (skill = '') => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const [userRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(
          skill.trim()
            ? `${API_BASE_URL}/api/users/search?skill=${encodeURIComponent(skill.trim())}`
            : `${API_BASE_URL}/api/users/search`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ])

      const userData = await userRes.json()
      const teachersData = await teachersRes.json()

      if (!userRes.ok) {
        navigate('/login')
        return
      }

      if (!teachersRes.ok) {
        setMessage(teachersData.message || 'Failed to load teachers')
        setTeachers([])
        return
      }

      const loggedInUser = userData.user || userData
      setCurrentUser(loggedInUser)
      localStorage.setItem('user', JSON.stringify(loggedInUser))
      setTeachers(teachersData.users || teachersData.teachers || [])
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetchUnreadNotifications(token)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTeachers(search)
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  const filteredTeachers = teachers.filter((teacher) => {
    const ratingOk = minRating
      ? (teacher.ratingAvg ?? 0) >= Number(minRating)
      : true

    const trustOk = minTrust
      ? (teacher.reliabilityScore ?? 0) >= Number(minTrust)
      : true

    return ratingOk && trustOk
  })

  const handleResetFilters = () => {
    setSearch('')
    setMinRating('')
    setMinTrust('')
  }

  const sidebarLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile/edit', label: 'Edit Profile', icon: UserPen },
    { to: '/teachers', label: 'Find tutors', icon: Search },
    { to: '/slots', label: 'My Slots', icon: CalendarRange },
    { to: '/sessions', label: 'Session History', icon: History },
    { to: '/teacher/requests', label: 'Booked Sessions', icon: Briefcase },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading teachers...
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
                  {currentUser?.name || 'Member'}
                </h2>
                <p className="mt-1 text-sm text-[#857996]">Member workspace</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-3 py-2 text-xs font-medium text-[#5b34a5]">
              <Sparkles size={12} />
              Discover mode
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
            <p className="text-sm text-white/70">Discovery tip</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Choose by trust
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Compare reviews, ratings, and skills before opening a teacher profile.
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
                  Discover instructors
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  Browse Teachers
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Search by skill, compare trust and reviews, and open teacher profiles to explore their available teaching slots.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(31,23,42,0.05)] md:p-7">
            <div className="mb-5 flex items-center gap-2 text-[#5b34a5]">
              <SlidersHorizontal size={18} />
              <p className="text-sm font-medium uppercase tracking-[0.14em]">
                Search & Filters
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by skill, e.g. UI Design"
                className="rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
              />

              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
              >
                <option value="">Min rating</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>

              <select
                value={minTrust}
                onChange={(e) => setMinTrust(e.target.value)}
                className="rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
              >
                <option value="">Min trust</option>
                <option value="20">20+</option>
                <option value="40">40+</option>
                <option value="60">60+</option>
                <option value="80">80+</option>
                <option value="100">100</option>
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-2xl bg-[#f4f1f8] px-6 py-3.5 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
              >
                Reset
              </button>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          {filteredTeachers.length === 0 ? (
            <div className="rounded-[32px] bg-white p-10 text-center shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <p className="text-lg font-semibold text-[#24152f]">No teachers found</p>
              <p className="mt-2 text-[#8a7d9f]">
                Try another skill search or adjust the rating and trust filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher._id}
                  className="rounded-[30px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(31,23,42,0.08)]"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      name={teacher.name}
                      profileImage={teacher?.profileImage}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold tracking-[-0.03em] text-[#24152f]">
                        {teacher.name}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[#8a7d9f]">
                        {teacher.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <StarsDisplay value={teacher.ratingAvg ?? 0} />
                    <span className="text-sm font-semibold text-[#4d3b63]">
                      {Number(teacher.ratingAvg ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-[#8a7d9f]">
                      ({teacher.ratingCount ?? 0})
                    </span>
                  </div>

                  <div className="mt-5 rounded-[24px] bg-[#faf8fd] p-4">
                    <p className="text-sm text-[#8a7d9f]">Skills Offered</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.isArray(teacher.skillsOffered) && teacher.skillsOffered.length > 0 ? (
                        teacher.skillsOffered.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#f1ebff] px-3 py-2 text-sm font-medium text-[#6840a3]"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-[#4d3b63]">
                          No skills listed yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm text-[#8a7d9f]">Rating</p>
                      <p className="mt-2 text-lg font-semibold text-[#24152f]">
                        {Number(teacher.ratingAvg ?? 0).toFixed(1)}
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-[#faf8fd] p-4">
                      <p className="text-sm text-[#8a7d9f]">Trust</p>
                      <p className="mt-2 text-lg font-semibold text-[#24152f]">
                        {teacher.reliabilityScore ?? 0}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/teachers/${teacher._id}`}
                    className="group mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5"
                  >
                    View profile
                    <ArrowUpRight
                      size={15}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default BrowseTeachersPage