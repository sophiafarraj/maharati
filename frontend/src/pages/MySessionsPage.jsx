import { useEffect, useMemo, useState } from 'react'
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
  Clock3,
} from 'lucide-react'

function MySessionsPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
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

  const fetchSessions = async () => {
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
        fetch(`${API_BASE_URL}/api/sessions/my-sessions`, {
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
        setMessage(sessionsData.message || 'Failed to load sessions')
        return
      }

      const user = userData.user || userData
      setCurrentUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      setSessions(sessionsData.sessions || [])
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
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

  const getStatusStyles = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-[#edf4ff] text-[#2563eb]'
      case 'awaiting_confirmation':
        return 'bg-[#f1ebfb] text-[#7d45c5]'
      case 'finished':
        return 'bg-[#e9f7ec] text-[#2f8a4d]'
      case 'cancelled':
        return 'bg-[#fff0f4] text-[#b4235a]'
      case 'disputed':
        return 'bg-[#ffe9e7] text-[#c2410c]'
      default:
        return 'bg-[#f4f1f8] text-[#4d3b63]'
    }
  }

  const getSessionStageText = (session, isStudent) => {
    const endAt = session.endAt || session.slotId?.endAt
    const ended = endAt ? Date.now() >= new Date(endAt).getTime() : false

    if (session.status === 'booked' && !ended) {
      return isStudent ? 'Booked and upcoming' : 'Booked by a learner'
    }

    if (session.status === 'awaiting_confirmation') {
      return 'Waiting for both sides to confirm completion'
    }

    if (session.status === 'finished') {
      if (isStudent) {
        return session.ratedByStudent ? 'Finished and reviewed' : 'Finished — review available'
      }
      return session.ratedByStudent ? 'Finished with learner feedback' : 'Finished'
    }

    if (session.status === 'disputed') {
      return 'Dispute opened'
    }

    if (session.status === 'cancelled') {
      return 'Cancelled before completion'
    }

    return 'Session update available'
  }

  const getNextActionText = (session, isStudent) => {
    const startAt = session.scheduledAt || session.slotId?.startAt
    const endAt = session.endAt || session.slotId?.endAt
    const started = startAt ? Date.now() >= new Date(startAt).getTime() : false
    const ended = endAt ? Date.now() >= new Date(endAt).getTime() : false

    if (session.status === 'booked') {
      if (!started) return 'Next: prepare for the upcoming session'
      if (!ended) {
        return session.meetingLink
          ? 'Next: join or manage the meeting link'
          : 'Next: wait for or add the meeting link'
      }
      return 'Next: move into confirmation'
    }

    if (session.status === 'awaiting_confirmation') {
      return 'Next: confirm completion or open dispute'
    }

    if (session.status === 'finished') {
      if (isStudent && !session.ratedByStudent) return 'Next: leave a review'
      if (!isStudent && session.ratedByStudent) return 'Next: view learner feedback'
      return 'No further action needed'
    }

    if (session.status === 'disputed') {
      return 'Next: wait for dispute resolution'
    }

    if (session.status === 'cancelled') {
      return 'No further action needed'
    }

    return 'Open details for more information'
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
          Loading sessions...
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
              Session flow
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
            <p className="text-sm text-white/70">Session lifecycle</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Stay in control
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Follow each session from instant booking to final confirmation, dispute handling, and review.
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
                  Session lifecycle
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  My Sessions
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Follow your upcoming, awaiting confirmation, disputed, cancelled, and finished sessions in one place.
                </p>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="rounded-[32px] bg-white p-10 text-center shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                No sessions yet
              </h2>
              <p className="mt-3 text-[#8a7d9f]">
                Your booked and managed sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {sessions.map((session) => {
                const isStudent =
                  String(session.studentId?._id || session.studentId) ===
                  String(currentUser?._id)

                const otherPerson = isStudent ? session.teacherId : session.studentId
                const roleLabel = isStudent ? 'Learner' : 'Instructor'
                const durationMinutes = Number(session.durationMinutes || 60)

                return (
                  <div
                    key={session._id}
                    className="rounded-[30px] bg-white p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(31,23,42,0.08)]"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                            {session.skill}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyles(
                              session.status
                            )}`}
                          >
                            {session.status.replace('_', ' ')}
                          </span>

                          <span className="rounded-full bg-[#f1ebff] px-3 py-1 text-xs font-semibold text-[#6840a3]">
                            {roleLabel}
                          </span>

                          {session.ratedByStudent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7e8] px-3 py-1 text-xs font-semibold text-[#9a6700]">
                              <Star size={12} fill="currentColor" />
                              Reviewed
                            </span>
                          )}
                        </div>

                        <p className="mt-4 text-sm font-medium text-[#6a4e92]">
                          {getSessionStageText(session, isStudent)}
                        </p>

                        <p className="mt-2 text-sm leading-7 text-[#8a7d9f]">
                          {getNextActionText(session, isStudent)}
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                          <div className="rounded-[22px] bg-[#faf8fd] p-4">
                            <p className="text-sm text-[#8a7d9f]">
                              {isStudent ? 'Teacher' : 'Student'}
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                              {otherPerson?.name || '—'}
                            </p>
                          </div>

                          <div className="rounded-[22px] bg-[#faf8fd] p-4">
                            <p className="text-sm text-[#8a7d9f]">Start</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                              {formatDateTime(session.scheduledAt || session.slotId?.startAt)}
                            </p>
                          </div>

                          <div className="rounded-[22px] bg-[#faf8fd] p-4">
                            <p className="text-sm text-[#8a7d9f]">End</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                              {formatDateTime(session.endAt || session.slotId?.endAt)}
                            </p>
                          </div>

                          <div className="rounded-[22px] bg-[#faf8fd] p-4">
                            <p className="text-sm text-[#8a7d9f]">Duration</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                              <span className="inline-flex items-center gap-2">
                                <Clock3 size={14} className="text-[#8a7d9f]" />
                                {durationMinutes === 60 ? '1 hour' : `${durationMinutes} minutes`}
                              </span>
                            </p>
                          </div>

                          <div className="rounded-[22px] bg-[#faf8fd] p-4">
                            <p className="text-sm text-[#8a7d9f]">Mode / Escrow</p>
                            <p className="mt-2 text-sm font-semibold leading-6 capitalize text-[#24152f]">
                              {session.mode} / {session.escrowAmount}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/sessions/${session._id}`}
                        className="group inline-flex items-center gap-2 rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5"
                      >
                        View details
                        <ArrowUpRight
                          size={15}
                          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MySessionsPage