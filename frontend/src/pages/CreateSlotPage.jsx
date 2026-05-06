import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import UserAvatar from '../components/UserAvatar'
import { useNavigate, Link, NavLink } from 'react-router-dom'
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
  Clock3,
  CalendarDays,
  Wallet,
  Repeat,
} from 'lucide-react'

function CreateSlotPage() {
  const navigate = useNavigate()

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  const [currentUser, setCurrentUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [message, setMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const [creationType, setCreationType] = useState('one_time')

  const [form, setForm] = useState({
    skill: '',
    date: '',
    startTime: '',
    dayOfWeek: '1',
    mode: 'credit',
    price: '',
  })

  const availableTimes = [
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
  ]

  const daysOfWeek = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ]

  const isEmailVerified = !!currentUser?.isEmailVerified

  const isProfileComplete =
    !!currentUser?.name &&
    Array.isArray(currentUser?.skillsOffered) &&
    currentUser.skillsOffered.length > 0 &&
    Array.isArray(currentUser?.skillsWanted) &&
    currentUser.skillsWanted.length > 0

  const offeredSkills = useMemo(
    () => (Array.isArray(currentUser?.skillsOffered) ? currentUser.skillsOffered : []),
    [currentUser]
  )

  const todayDate = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, notificationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/notifications`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        const userData = await userRes.json()

        if (!userRes.ok) {
          navigate('/login')
          return
        }

        const user = userData.user || userData
        setCurrentUser(user)

        if (Array.isArray(user.skillsOffered) && user.skillsOffered.length > 0) {
          setForm((prev) => ({
            ...prev,
            skill: user.skillsOffered[0],
          }))
        }

        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json()
          setUnreadCount(notificationsData.unreadCount || 0)
        }
      } catch (error) {
        console.error(error)
        navigate('/login')
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const buildStartAt = () => {
    if (!form.date || !form.startTime) return ''
    return `${form.date}T${form.startTime}`
  }

  const getOneTimePreview = () => {
    if (!form.date || !form.startTime) return ''

    const start = new Date(`${form.date}T${form.startTime}`)
    if (Number.isNaN(start.getTime())) return ''

    const end = new Date(start.getTime() + 60 * 60 * 1000)

    const startText = start.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    const endText = end.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

    return `${startText} - ${endText}`
  }

  const getRecurringPreview = () => {
    const dayLabel = daysOfWeek.find((d) => d.value === form.dayOfWeek)?.label
    const timeLabel = availableTimes.find((t) => t.value === form.startTime)?.label

    if (!dayLabel || !timeLabel) return ''

    return `Every ${dayLabel} at ${timeLabel}, generating upcoming one-hour slots.`
  }

  const validateBaseFields = () => {
    if (!isEmailVerified) {
      setMessage('Please verify your email before creating availability.')
      return false
    }

    if (!isProfileComplete) {
      setMessage('Please complete your profile before creating availability.')
      return false
    }

    if (!form.skill) {
      setMessage('Please choose one of your offered skills.')
      return false
    }

    if (!offeredSkills.includes(form.skill)) {
      setMessage('You can only create slots using skills from your profile.')
      return false
    }

    if (!form.startTime) {
      setMessage('Please choose a start time.')
      return false
    }

    if (form.price === '' || Number(form.price) < 0) {
      setMessage('Please enter a valid price.')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    if (!validateBaseFields()) {
      setSaving(false)
      return
    }

    if (creationType === 'one_time' && !form.date) {
      setMessage('Please choose a date for the one-time slot.')
      setSaving(false)
      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const isRecurring = creationType === 'recurring_weekly'

      const payload = isRecurring
        ? {
            skill: form.skill,
            dayOfWeek: Number(form.dayOfWeek),
            startTime: form.startTime,
            mode: form.mode,
            price: Number(form.price),
          }
        : {
            skill: form.skill,
            startAt: buildStartAt(),
            mode: form.mode,
            price: Number(form.price),
          }

      const endpoint = isRecurring
        ? `${API_BASE_URL}/api/slots/recurring`
        : `${API_BASE_URL}/api/slots`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setMessage('Please verify your email before creating availability.')
        } else if (data.code === 'PROFILE_INCOMPLETE') {
          setMessage('Please complete your profile before creating availability.')
        } else {
          setMessage(data.message || 'Failed to create availability')
        }

        setSaving(false)
        return
      }

      navigate('/slots')
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setSaving(false)
    }
  }

  const sidebarLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile/edit', label: 'Edit Profile', icon: UserPen },
    { to: '/teachers', label: 'Find tutors', icon: Search },
    { to: '/slots', label: 'My Slots', icon: CalendarRange },
    { to: '/sessions', label: 'Session History', icon: History },
    { to: '/teacher/requests', label: 'Booked Sessions', icon: Briefcase },
  ]

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading page...
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
              aria-label="Open profile"
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
              Instructor availability
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
            <p className="text-sm text-white/70">Availability options</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              One-time or weekly
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/70">
              <li>• Publish a single one-time slot</li>
              <li>• Or create a weekly recurring rule</li>
              <li>• Choose a clean hourly time</li>
              <li>• Available hours run from 7:00 AM to 9:00 PM</li>
              <li>• Every generated slot lasts 1 hour</li>
            </ul>
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
                  Instructor availability
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  Create Availability
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Choose whether to publish a one-time teaching slot or create a weekly recurring schedule that automatically generates upcoming slots.
                </p>
              </div>

              <Link
                to="/slots"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#2f1b45] shadow-[0_10px_24px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5"
              >
                Back to slots
              </Link>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <section className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Before you publish
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">One-time slot</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    Best when you want to publish a specific date and hour only once.
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">Weekly recurring</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    Best when you repeatedly teach on the same weekday and time every week.
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">Preview</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    {creationType === 'one_time'
                      ? getOneTimePreview() || 'Choose a date and time to preview the one-time one-hour session.'
                      : getRecurringPreview() || 'Choose a weekday and time to preview the recurring weekly pattern.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Availability Details
              </h3>
              <p className="mt-2 text-sm text-[#8a7d9f]">
                Choose one of your profile skills, then decide whether this availability should be one-time or weekly recurring.
              </p>

              {(!isEmailVerified || !isProfileComplete) && (
                <div className="mt-6 rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">Before you can create availability</p>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-[#4d3b63]">
                    {!isEmailVerified && <p>• Please verify your email first.</p>}
                    {!isProfileComplete && (
                      <p>• Please complete your profile with offered and wanted skills.</p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={() =>
                          setMessage('Please verify your email from the verification email we sent you.')
                        }
                        className="rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
                      >
                        Verify Email First
                      </button>
                    )}

                    {!isProfileComplete && (
                      <button
                        type="button"
                        onClick={() => navigate('/profile/edit')}
                        className="rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5"
                      >
                        Complete Profile
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                    Availability Type
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setCreationType('one_time')}
                      className={`rounded-[24px] border px-5 py-4 text-left transition-all ${
                        creationType === 'one_time'
                          ? 'border-[#cdbbf1] bg-[#f6f1ff] shadow-[0_12px_24px_rgba(109,61,242,0.08)]'
                          : 'border-[#ebe3f5] bg-[#faf8fd]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[#5b34a5]">
                        <CalendarDays size={16} />
                        <span className="text-sm font-semibold">One-time slot</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#6f5a89]">
                        Create one specific slot on one exact date.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreationType('recurring_weekly')}
                      className={`rounded-[24px] border px-5 py-4 text-left transition-all ${
                        creationType === 'recurring_weekly'
                          ? 'border-[#cdbbf1] bg-[#f6f1ff] shadow-[0_12px_24px_rgba(109,61,242,0.08)]'
                          : 'border-[#ebe3f5] bg-[#faf8fd]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[#5b34a5]">
                        <Repeat size={16} />
                        <span className="text-sm font-semibold">Weekly recurring</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#6f5a89]">
                        Create a weekly rule that generates upcoming slots.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                    Skill
                  </label>
                  <select
                    name="skill"
                    value={form.skill}
                    onChange={handleChange}
                    className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                    required
                  >
                    {offeredSkills.length === 0 ? (
                      <option value="">No offered skills found</option>
                    ) : (
                      <>
                        <option value="">Select one of your offered skills</option>
                        {offeredSkills.map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <p className="mt-2 text-xs text-[#8c859a]">
                    You can only publish availability for skills already listed in your profile.
                  </p>
                </div>

                {creationType === 'one_time' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                        Date
                      </label>
                      <div className="relative">
                        <CalendarDays
                          size={16}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                        />
                        <input
                          name="date"
                          type="date"
                          min={todayDate}
                          value={form.date}
                          onChange={handleChange}
                          className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          required={creationType === 'one_time'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                        Start Time
                      </label>
                      <div className="relative">
                        <Clock3
                          size={16}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                        />
                        <select
                          name="startTime"
                          value={form.startTime}
                          onChange={handleChange}
                          className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          required
                        >
                          <option value="">Select an hourly start time</option>
                          {availableTimes.map((time) => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-[#8c859a]">
                        Choose a clear hourly start between 7:00 AM and 9:00 PM.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                        Day of Week
                      </label>
                      <div className="relative">
                        <Repeat
                          size={16}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                        />
                        <select
                          name="dayOfWeek"
                          value={form.dayOfWeek}
                          onChange={handleChange}
                          className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          required={creationType === 'recurring_weekly'}
                        >
                          {daysOfWeek.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                        Weekly Start Time
                      </label>
                      <div className="relative">
                        <Clock3
                          size={16}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                        />
                        <select
                          name="startTime"
                          value={form.startTime}
                          onChange={handleChange}
                          className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                          required
                        >
                          <option value="">Select an hourly start time</option>
                          {availableTimes.map((time) => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-[#8c859a]">
                        The system will generate upcoming weekly one-hour slots from this time.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#6b5d80]">Duration</p>
                  <p className="mt-2 inline-flex items-center gap-2 font-medium text-[#24152f]">
                    <Clock3 size={15} className="text-[#8a7d9f]" />
                    1 hour
                  </p>
                  <p className="mt-1 text-xs text-[#8c859a]">
                    Every slot is fixed to one hour to keep booking and scheduling simple.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                      Mode
                    </label>
                    <div className="relative">
                      <Wallet
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                      />
                      <select
                        name="mode"
                        value={form.mode}
                        onChange={handleChange}
                        className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 pl-11 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                      >
                        <option value="credit">Credit</option>
                        <option value="money">Money</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                      Price
                    </label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="1"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="10"
                      className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
                      required
                    />
                  </div>
                </div>

                {message && (
                  <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
                    {message}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !isEmailVerified ||
                      !isProfileComplete ||
                      offeredSkills.length === 0
                    }
                    className="rounded-2xl bg-[#6d3df2] px-7 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-70"
                  >
                    {saving
                      ? creationType === 'recurring_weekly'
                        ? 'Creating weekly availability...'
                        : 'Creating slot...'
                      : creationType === 'recurring_weekly'
                      ? 'Create Weekly Availability'
                      : 'Create One-Time Slot'}
                  </button>

                  <Link
                    to="/slots"
                    className="rounded-2xl bg-[#f4f1f8] px-7 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CreateSlotPage