import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink, useParams } from 'react-router-dom'
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
  Clock3,
  CalendarDays,
  Wallet,
} from 'lucide-react'

function EditSlotPage() {
  const { slotId } = useParams()
  const navigate = useNavigate()

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [slotStatus, setSlotStatus] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const [form, setForm] = useState({
    skill: '',
    date: '',
    startTime: '',
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

  const todayDate = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  const formatDateInput = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  const formatTimeInput = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const buildStartAt = () => {
    if (!form.date || !form.startTime) return ''
    return `${form.date}T${form.startTime}`
  }

  const getSessionPreview = () => {
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
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const fetchSlot = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, slotsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/slots/my-slots`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        const userData = await userRes.json()
        const slotsData = await slotsRes.json()

        if (!userRes.ok) {
          navigate('/login')
          return
        }

        if (!slotsRes.ok) {
          setMessage(slotsData.message || 'Failed to load slot')
          setLoading(false)
          return
        }

        const user = userData.user || userData
        setCurrentUser(user)
        localStorage.setItem('user', JSON.stringify(user))
        fetchUnreadNotifications(token)

        const slots = slotsData.slots || []
        const slot = slots.find((item) => item._id === slotId)

        if (!slot) {
          setMessage('Slot not found')
          setLoading(false)
          return
        }

        setSlotStatus(slot.status || '')
        setForm({
          skill: slot.skill || '',
          date: formatDateInput(slot.startAt),
          startTime: formatTimeInput(slot.startAt),
          mode: slot.mode || 'credit',
          price: slot.price ?? '',
        })
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchSlot()
  }, [slotId, navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const payload = {
        skill: form.skill.trim(),
        startAt: buildStartAt(),
        mode: form.mode,
        price: Number(form.price),
      }

      const res = await fetch(`${API_BASE_URL}/api/slots/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to update slot')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading slot...
        </div>
      </div>
    )
  }

  if (message === 'Slot not found') {
    return (
      <div className="min-h-screen bg-[#f7f5fb] text-[#1f172b]">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            to="/slots"
            className="inline-block rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#4d3b63] shadow-[0_10px_24px_rgba(31,23,42,0.05)]"
          >
            Back to slots
          </Link>

          <div className="mt-6 rounded-[32px] bg-white p-8 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <h1 className="text-2xl font-semibold text-[#24152f]">Slot not found</h1>
            <p className="mt-3 text-[#8a7d9f]">
              The requested slot could not be loaded.
            </p>
          </div>
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
            <p className="text-sm text-white/70">Slot status</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] capitalize">
              {slotStatus || 'Unknown'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Only available slots without active bookings should be edited.
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
                  Instructor availability
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  Edit Slot
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Update your slot while it is still available. Slots last one hour and should start on a clean hourly time between 7:00 AM and 9:00 PM.
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

          {message && message !== 'Slot not found' && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <section className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Editing guidance
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">What you can change</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    You can revise the skill, date, start time, mode, and price while the slot is still available.
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">Fixed structure</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    All slots last exactly one hour, and start times should be chosen on the hour between 7:00 AM and 9:00 PM.
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">Session preview</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    {getSessionPreview() || 'Choose a date and start time to preview the one-hour session window.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Slot Details
              </h3>
              <p className="mt-2 text-sm text-[#8a7d9f]">
                Update the slot exactly as students should see it, using a clear one-hour time between 7:00 AM and 9:00 PM.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                    Skill
                  </label>
                  <input
                    name="skill"
                    type="text"
                    value={form.skill}
                    onChange={handleChange}
                    placeholder="Example: UI Design"
                    className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                    required
                  />
                </div>

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
                        required
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
                  </div>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#6b5d80]">Duration</p>
                  <p className="mt-2 inline-flex items-center gap-2 font-medium text-[#24152f]">
                    <Clock3 size={15} className="text-[#8a7d9f]" />
                    1 hour
                  </p>
                  <p className="mt-1 text-xs text-[#8c859a]">
                    Duration is fixed and calculated automatically.
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
                      className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] focus:ring-[#c8b6ea]"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#6d3df2] px-7 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-70"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
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

export default EditSlotPage