import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
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
  CheckCheck,
} from 'lucide-react'

function NotificationsPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  const getNotificationBadgeStyle = (type) => {
    switch (type) {
      case 'slot_booked':
      case 'slot_booked_teacher_notice':
        return 'bg-[#edf4ff] text-[#2563eb]'
      case 'session_confirmation_needed':
      case 'session_awaiting_confirmation':
      case 'session_partial_confirmation':
        return 'bg-[#f1ebfb] text-[#7d45c5]'
      case 'dispute_opened':
        return 'bg-[#ffe7e7] text-[#b42318]'
      case 'meeting_link_added':
      case 'meeting_link_updated':
        return 'bg-[#ebf7f4] text-[#0f766e]'
      case 'session_finished':
        return 'bg-[#ecfdf3] text-[#027a48]'
      case 'session_cancelled':
        return 'bg-[#fff1f3] text-[#c01048]'
      case 'new_review':
      case 'review_requested':
        return 'bg-[#fff7e8] text-[#9a6700]'
      default:
        return 'bg-[#f4f1f8] text-[#6f5a89]'
    }
  }

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'slot_booked':
        return 'Booking'
      case 'slot_booked_teacher_notice':
        return 'Booked Slot'
      case 'session_confirmation_needed':
      case 'session_awaiting_confirmation':
        return 'Confirmation'
      case 'session_partial_confirmation':
        return 'Partial Confirm'
      case 'dispute_opened':
        return 'Dispute'
      case 'meeting_link_added':
        return 'Meeting Link'
      case 'meeting_link_updated':
        return 'Meeting Update'
      case 'session_finished':
        return 'Finished'
      case 'session_cancelled':
        return 'Cancelled'
      case 'new_review':
        return 'New Review'
      case 'review_requested':
        return 'Review'
      default:
        return 'Update'
    }
  }

  const fetchNotifications = async ({ markAll = false } = {}) => {
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
      const notificationsData = await notificationsRes.json()

      if (!userRes.ok) {
        navigate('/login')
        return
      }

      if (!notificationsRes.ok) {
        setMessage(notificationsData.message || 'Failed to load notifications')
        return
      }

      const user = userData.user || userData
      setCurrentUser(user)
      localStorage.setItem('user', JSON.stringify(user))

      setNotifications(notificationsData.notifications || [])
      setUnreadCount(notificationsData.unreadCount || 0)

      if (markAll && (notificationsData.unreadCount || 0) > 0) {
        await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const refreshedRes = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const refreshedData = await refreshedRes.json()

        if (refreshedRes.ok) {
          setNotifications(refreshedData.notifications || [])
          setUnreadCount(refreshedData.unreadCount || 0)
        }
      }
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications({ markAll: true })
  }, [navigate])

  const handleMarkOneRead = async (notificationId) => {
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to mark notification as read')
        return
      }

      await fetchNotifications()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    }
  }

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to mark all as read')
        return
      }

      await fetchNotifications()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const sidebarLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile/edit', label: 'Edit Profile', icon: UserPen },
    { to: '/teachers', label: 'Find tutors', icon: Search },
    { to: '/slots', label: 'My Slots', icon: CalendarRange },
    { to: '/sessions', label: 'Session History', icon: History },
    { to: '/teacher/requests', label: 'Booked Sessions', icon: Briefcase },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading notifications...
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
              Notification center
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
            <p className="text-sm text-white/70">Stay updated</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              One inbox
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Track booking, meeting links, disputes, reviews, and completion updates in one place.
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
                  Notifications
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  Your updates
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Track booking, confirmation, dispute, meeting-link, and review reminders across your Maharati workflow.
                </p>
              </div>

              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#2f1b45] shadow-[0_10px_24px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
              {message}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="rounded-[32px] bg-white p-10 text-center shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                No notifications yet
              </h2>
              <p className="mt-3 text-[#8a7d9f]">
                When important session events happen, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`rounded-[28px] p-6 shadow-[0_18px_44px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5 ${
                    notification.isRead ? 'bg-white' : 'bg-[#fcfaff]'
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getNotificationBadgeStyle(
                            notification.type
                          )}`}
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </span>

                        {!notification.isRead && (
                          <span className="rounded-full bg-[#6d3df2] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#24152f]">
                        {notification.title}
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                        {notification.message}
                      </p>

                      <p className="mt-3 text-xs text-[#9b84b7]">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {notification.sessionId && (
                        <Link
                          to={`/sessions/${notification.sessionId}`}
                          className="group inline-flex items-center gap-2 rounded-2xl bg-[#6d3df2] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5"
                        >
                          Open session
                          <ArrowUpRight
                            size={14}
                            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          />
                        </Link>
                      )}

                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkOneRead(notification._id)}
                          className="rounded-2xl bg-[#f4f1f8] px-4 py-2.5 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
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

export default NotificationsPage