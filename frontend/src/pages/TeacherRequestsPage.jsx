import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import UserAvatar from '../components/UserAvatar'

function TeacherRequestsPage() {
  const navigate = useNavigate()

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'block rounded-xl bg-white px-4 py-3 font-medium text-[#5b3b85]'
      : 'block rounded-xl px-4 py-3 text-[#6f5a89] hover:bg-white'

  const [currentUser, setCurrentUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

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

  const fetchBookedSessions = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const [userRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/api/sessions/booked-sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      const userData = await userRes.json()
      const sessionsData = await sessionsRes.json()

      if (!userRes.ok) {
        navigate('/login')
        return
      }

      if (!sessionsRes.ok) {
        setMessage(sessionsData.message || 'Failed to load booked sessions')
        return
      }

      const loggedInUser = userData.user || userData
      setCurrentUser(loggedInUser)
      localStorage.setItem('user', JSON.stringify(loggedInUser))
      setSessions(sessionsData.sessions || [])
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookedSessions()
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    fetchUnreadNotifications(token)
  }, [])

  const formatDateTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const statusStyles = {
    confirmed: 'bg-[#edf4ff] text-[#2563eb]',
    awaiting_confirmation: 'bg-[#f1ebfb] text-[#7d45c5]',
    finished: 'bg-[#e9f7ec] text-[#2f8a4d]',
    cancelled: 'bg-[#fff0f4] text-[#b4235a]',
    disputed: 'bg-[#ffe9e7] text-[#c2410c]',
  }

  const groupedBySlot = useMemo(() => {
    const map = new Map()

    sessions.forEach((session) => {
      const slotKey =
        session.slotId?._id ||
        session.slotId ||
        `${session.skill}-${session.scheduledAt || session.createdAt}`

      if (!map.has(slotKey)) {
        map.set(slotKey, {
          slotKey,
          skill: session.skill || session.slotId?.skill || 'Session',
          startAt: session.slotId?.startAt || session.scheduledAt || null,
          endAt: session.slotId?.endAt || session.endAt || null,
          durationHours: session.slotId?.durationHours || session.durationHours || null,
          mode: session.slotId?.mode || session.mode || null,
          price: session.slotId?.price ?? session.escrowAmount ?? null,
          bookings: [],
        })
      }

      map.get(slotKey).bookings.push(session)
    })

    return Array.from(map.values())
  }, [sessions])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4edf8] flex items-center justify-center">
        <div className="bg-white border border-[#e8ddf2] rounded-2xl px-6 py-4 text-[#4d3b63]">
          Loading booked sessions...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4edf8] text-[#4d3b63]">
      <header className="border-b border-[#ece2f5] bg-[#f4edf8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-3xl font-semibold text-[#c8a8eb]">Maharati</div>

          <nav className="hidden gap-8 text-lg font-semibold text-[#5b3b85] md:flex">
            <Link to="/teachers" className="transition-opacity hover:opacity-75">
              Find tutors
            </Link>
            <Link to="/slots" className="transition-opacity hover:opacity-75">
              My slots
            </Link>
            <Link to="/sessions" className="transition-opacity hover:opacity-75">
              Session history
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative text-xl transition-transform hover:scale-105"
              aria-label="Open notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#8b3fe0] px-1 text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(139,63,224,0.28)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <Link to="/profile/edit">
              <UserAvatar
                name={currentUser?.name}
                profileImage={currentUser?.profileImage}
                size="sm"
              />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl bg-[#f1eaf8] p-4">
          <div className="flex flex-col items-center border-b border-[#e3d7ef] pb-5">
            <UserAvatar
              name={currentUser?.name}
              profileImage={currentUser?.profileImage}
              size="lg"
            />
            <h2 className="mt-3 text-lg font-semibold text-[#4d3b63]">
              {currentUser?.name || 'Member'}
            </h2>
            <p className="text-sm text-[#8a7d9f]">Member</p>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <NavLink to="/dashboard" className={getSidebarLinkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/profile/edit" className={getSidebarLinkClass}>
              Edit Profile
            </NavLink>

            <NavLink to="/teachers" className={getSidebarLinkClass}>
              Find tutors
            </NavLink>

            <NavLink to="/slots" className={getSidebarLinkClass}>
              My Slots
            </NavLink>

            <NavLink to="/sessions" className={getSidebarLinkClass}>
              Session History
            </NavLink>

            <NavLink to="/teacher/requests" className={getSidebarLinkClass}>
              Booked Sessions
            </NavLink>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-4">
            <p className="text-sm font-medium text-[#8a7d9f]">Automated booking</p>
            <p className="mt-2 text-sm leading-6 text-[#4d3b63]">
              Slots are booked instantly by the system when a learner has enough
              balance. Escrow is held until both sides confirm completion.
            </p>
          </div>

          <div className="mt-10 border-t border-[#e3d7ef] pt-4">
            <button
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                localStorage.removeItem('rememberedEmail')
                navigate('/login')
              }}
              className="text-sm text-[#8a7d9f]"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="rounded-2xl border border-[#e8ddf2] bg-white p-6 md:p-8">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Instructor workflow
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#4d3b63]">
              Booked Sessions
            </h1>
            <p className="mt-2 max-w-2xl text-[#8a7d9f]">
              Review the learners who booked your slots automatically, follow each
              session through confirmation, cancellation, dispute, and completion,
              and keep track of the session lifecycle in one place.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          {groupedBySlot.length === 0 ? (
            <div className="rounded-2xl border border-[#eee4f7] bg-[#faf7fd] p-8 text-center">
              <h2 className="text-2xl font-semibold text-[#4d3b63]">No booked sessions yet</h2>
              <p className="mt-3 text-[#8a7d9f]">
                Once learners book your available slots, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedBySlot.map((group) => (
                <div
                  key={group.slotKey}
                  className="rounded-2xl border border-[#eee4f7] bg-[#faf7fd] p-6 shadow-sm"
                >
                  <div className="mb-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-[#4d3b63]">
                        {group.skill}
                      </h2>
                      <span className="rounded-full bg-[#f1ebfb] px-3 py-1 text-xs font-semibold text-[#7d45c5]">
                        Booked Slot
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                        <p className="text-sm text-[#8a7d9f]">Start</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                          {formatDateTime(group.startAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                        <p className="text-sm text-[#8a7d9f]">End</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                          {formatDateTime(group.endAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                        <p className="text-sm text-[#8a7d9f]">Duration</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                          {group.durationHours
                            ? `${group.durationHours} hour${Number(group.durationHours) > 1 ? 's' : ''}`
                            : '—'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                        <p className="text-sm text-[#8a7d9f]">Mode / Price</p>
                        <p className="mt-2 text-sm font-semibold leading-6 capitalize text-[#4d3b63]">
                          {group.mode ? `${group.mode} / ${group.price ?? '—'}` : `${group.price ?? '—'}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {group.bookings.map((session) => {
                      const student =
                        session.studentId && typeof session.studentId === 'object'
                          ? session.studentId
                          : null

                      return (
                        <div
                          key={session._id}
                          className="rounded-2xl border border-[#eee4f7] bg-white p-5"
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-3">
                                  <UserAvatar
                                    name={student?.name || 'S'}
                                    profileImage={student?.profileImage}
                                    size="sm"
                                  />
                                  <div>
                                    <p className="font-semibold text-[#4d3b63]">
                                      {student?.name || 'Student'}
                                    </p>
                                    <p className="text-sm text-[#8a7d9f]">
                                      {student?.email || '—'}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                    statusStyles[session.status] || 'bg-white text-[#4d3b63]'
                                  }`}
                                >
                                  {session.status}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-[#faf7fd] p-4">
                                  <p className="text-sm text-[#8a7d9f]">Escrow Amount</p>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                                    {session.escrowAmount ?? group.price ?? 0}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-[#faf7fd] p-4">
                                  <p className="text-sm text-[#8a7d9f]">Booked On</p>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                                    {formatDateTime(session.createdAt)}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-[#faf7fd] p-4">
                                  <p className="text-sm text-[#8a7d9f]">Confirmation</p>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                                    Student: {session.studentConfirmed ? 'Confirmed' : 'Not confirmed'}
                                  </p>
                                  <p className="text-sm font-semibold leading-6 text-[#4d3b63]">
                                    Teacher: {session.teacherConfirmed ? 'Confirmed' : 'Not confirmed'}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-[#faf7fd] p-4">
                                  <p className="text-sm text-[#8a7d9f]">Actions</p>
                                  <div className="mt-2">
                                    <Link
                                      to={`/sessions/${session._id}`}
                                      className="inline-block rounded-xl bg-[#8b3fe0] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(139,63,224,0.24)]"
                                    >
                                      View Session
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default TeacherRequestsPage