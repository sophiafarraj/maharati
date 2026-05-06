import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, useParams, NavLink } from 'react-router-dom'
import UserAvatar from '../components/UserAvatar'
import {
  Star,
  Bell,
  CalendarDays,
  Clock3,
  Wallet,
  ShieldCheck,
} from 'lucide-react'

function StarsDisplay({ value, size = 16 }) {
  const numeric = Number(value || 0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const active = starValue <= Math.round(numeric)

        return (
          <Star
            key={starValue}
            size={size}
            className={active ? 'text-[#8b3fe0]' : 'text-[#d7cde6]'}
            fill={active ? 'currentColor' : 'none'}
          />
        )
      })}
    </div>
  )
}

function TeacherProfilePage() {
  const { teacherId } = useParams()
  const navigate = useNavigate()

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'block rounded-xl bg-white px-4 py-3 font-medium text-[#5b3b85]'
      : 'block rounded-xl px-4 py-3 text-[#6f5a89] hover:bg-white'

  const [unreadCount, setUnreadCount] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const [teacher, setTeacher] = useState(null)
  const [slots, setSlots] = useState([])
  const [teacherReviews, setTeacherReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingSlotId, setBookingSlotId] = useState(null)
  const [message, setMessage] = useState('')

  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [balanceModalText, setBalanceModalText] = useState('')

  const [showBookedModal, setShowBookedModal] = useState(false)
  const [showBookedSuccessModal, setShowBookedSuccessModal] = useState(false)

  const [showAccessBlockedModal, setShowAccessBlockedModal] = useState(false)
  const [accessBlockedTitle, setAccessBlockedTitle] = useState('')
  const [accessBlockedText, setAccessBlockedText] = useState('')

  const [showAllReviews, setShowAllReviews] = useState(false)

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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetchUnreadNotifications(token)
  }, [])

  useEffect(() => {
    const fetchTeacherAndSlots = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const [userRes, teachersRes, slotsRes, sessionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/users/search`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/slots/tutor/${teacherId}`, {
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
        const teachersData = await teachersRes.json()
        const slotsData = await slotsRes.json()
        const sessionsData = await sessionsRes.json()

        if (!userRes.ok) {
          navigate('/login')
          return
        }

        if (!teachersRes.ok) {
          setMessage(teachersData.message || 'Failed to load teacher')
          setLoading(false)
          return
        }

        if (!slotsRes.ok) {
          setMessage(slotsData.message || 'Failed to load slots')
          setLoading(false)
          return
        }

        const loggedInUser = userData.user || userData
        setCurrentUser(loggedInUser)
        localStorage.setItem('user', JSON.stringify(loggedInUser))

        const teacherList = teachersData.users || teachersData.teachers || []
        const selectedTeacher = teacherList.find((item) => item._id === teacherId)

        if (!selectedTeacher) {
          setMessage('Teacher not found')
          setLoading(false)
          return
        }

        setTeacher(selectedTeacher)
        setSlots(slotsData.slots || [])

        const sessions = sessionsData.sessions || []
        const reviews = sessions
          .filter((session) => {
            const sessionTeacherId =
              typeof session.teacherId === 'object' ? session.teacherId?._id : session.teacherId

            return (
              String(sessionTeacherId) === String(teacherId) &&
              session.ratedByStudent &&
              session.studentRatingForTeacher
            )
          })
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))

        setTeacherReviews(reviews)
      } catch (error) {
        console.error(error)
        setMessage('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherAndSlots()
  }, [teacherId, navigate])

  const isEmailVerified = !!currentUser?.isEmailVerified

  const isProfileComplete =
    !!currentUser?.name &&
    Array.isArray(currentUser?.skillsOffered) &&
    currentUser.skillsOffered.length > 0 &&
    Array.isArray(currentUser?.skillsWanted) &&
    currentUser.skillsWanted.length > 0

  const formatDate = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatTimeRange = (startAt, endAt) => {
    if (!startAt || !endAt) return '—'
    return `${formatTime(startAt)} – ${formatTime(endAt)}`
  }

  const displayedReviews = useMemo(
    () => (showAllReviews ? teacherReviews : teacherReviews.slice(0, 5)),
    [teacherReviews, showAllReviews]
  )

  const upcomingSlots = useMemo(() => {
    const now = new Date()
    return slots
      .filter((slot) => {
        const start = new Date(slot.startAt)
        return slot.status === 'available' && start > now
      })
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
  }, [slots])

  const handleGainCreditsRedirect = () => {
    const hasOfferedSkills =
      Array.isArray(currentUser?.skillsOffered) && currentUser.skillsOffered.length > 0

    setShowBalanceModal(false)
    navigate(hasOfferedSkills ? '/slots/new' : '/profile/edit')
  }

  const handleBookSlot = async (slotId) => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    setBookingSlotId(slotId)
    setMessage('')

    if (!isEmailVerified) {
      setAccessBlockedTitle('Verify your email first')
      setAccessBlockedText(
        'You can browse teachers, but booking stays locked until you verify your email.'
      )
      setShowAccessBlockedModal(true)
      setBookingSlotId(null)
      return
    }

    if (!isProfileComplete) {
      setAccessBlockedTitle('Complete your profile first')
      setAccessBlockedText(
        'Please add your offered and wanted skills before booking a session.'
      )
      setShowAccessBlockedModal(true)
      setBookingSlotId(null)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slotId }),
      })

      const data = await res.json()

      if (!res.ok) {
        const backendMessage = data.message || 'Failed to book slot'

        if (
          backendMessage.toLowerCase().includes('not enough credits') ||
          backendMessage.toLowerCase().includes('not enough money')
        ) {
          setBalanceModalText(backendMessage)
          setShowBalanceModal(true)
          return
        }

        if (backendMessage.toLowerCase().includes('just been booked')) {
          setShowBookedModal(true)

          setSlots((prev) =>
            prev.map((slot) =>
              slot._id === slotId ? { ...slot, status: 'booked', alreadyBooked: true } : slot
            )
          )
          return
        }

        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setAccessBlockedTitle('Verify your email first')
          setAccessBlockedText(
            'You can browse teachers, but booking stays locked until you verify your email.'
          )
          setShowAccessBlockedModal(true)
          return
        }

        if (data.code === 'PROFILE_INCOMPLETE') {
          setAccessBlockedTitle('Complete your profile first')
          setAccessBlockedText(
            'Please add your offered and wanted skills before booking a session.'
          )
          setShowAccessBlockedModal(true)
          return
        }

        setMessage(backendMessage)
        return
      }

      setSlots((prev) =>
        prev.map((slot) =>
          slot._id === slotId ? { ...slot, status: 'booked', alreadyBooked: true } : slot
        )
      )

      setShowBookedSuccessModal(true)
      setMessage('Slot booked successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setBookingSlotId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4edf8] flex items-center justify-center">
        <div className="bg-white border border-[#e8ddf2] rounded-2xl px-6 py-4 text-[#4d3b63]">
          Loading teacher profile...
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#f4edf8] text-[#4d3b63]">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            to="/teachers"
            className="inline-block rounded-xl bg-[#ded3eb] px-4 py-2 text-sm font-medium text-[#4d3b63]"
          >
            Back to teachers
          </Link>

          <div className="mt-6 rounded-2xl border border-[#e8ddf2] bg-white p-8">
            <h1 className="text-2xl font-semibold">Teacher not found</h1>
            <p className="mt-3 text-[#8a7d9f]">
              {message || 'The requested teacher could not be loaded.'}
            </p>
          </div>
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
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <UserAvatar
                name={teacher?.name}
                profileImage={teacher?.profileImage}
                size="md"
              />

              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                  Instructor profile
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[#4d3b63]">
                  {teacher?.name}
                </h1>
                <p className="mt-2 text-[#8a7d9f]">{teacher?.email}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StarsDisplay value={teacher?.ratingAvg || 0} />
                  <span className="text-sm font-semibold text-[#4d3b63]">
                    {Number(teacher?.ratingAvg || 0).toFixed(1)}
                  </span>
                  <span className="text-sm text-[#8a7d9f]">
                    ({teacher?.ratingCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/teachers"
              className="rounded-xl border border-[#ddd2ee] bg-white px-5 py-3 text-sm font-medium text-[#4d3b63] shadow-sm transition-all hover:-translate-y-0.5"
            >
              Back to teachers
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.2fr]">
            <section className="rounded-2xl bg-[#faf7fd] p-6">
              <h3 className="text-2xl font-semibold text-[#4d3b63]">
                Teacher Overview
              </h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                  <p className="text-sm text-[#8a7d9f]">Skills Offered</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.isArray(teacher?.skillsOffered) && teacher.skillsOffered.length > 0 ? (
                      teacher.skillsOffered.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#f1ebfb] px-3 py-2 text-sm font-medium text-[#7d45c5]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="leading-7 text-[#4d3b63]">No skills listed yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                    <p className="text-sm text-[#8a7d9f]">Rating Average</p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-2xl font-semibold text-[#4d3b63]">
                        {Number(teacher?.ratingAvg || 0).toFixed(1)}
                      </p>
                      <StarsDisplay value={teacher?.ratingAvg || 0} size={14} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                    <p className="text-sm text-[#8a7d9f]">Trust Score</p>
                    <p className="mt-2 text-2xl font-semibold text-[#4d3b63]">
                      {teacher?.reliabilityScore ?? 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                    <p className="text-sm text-[#8a7d9f]">Rating Count</p>
                    <p className="mt-2 text-2xl font-semibold text-[#4d3b63]">
                      {teacher?.ratingCount ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                    <p className="text-sm text-[#8a7d9f]">Completed Sessions</p>
                    <p className="mt-2 text-2xl font-semibold text-[#4d3b63]">
                      {teacher?.completedSessions ?? 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eee4f7] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#8a7d9f]">Latest reviews</p>
                      <p className="mt-2 text-sm leading-7 text-[#4d3b63]">
                        Feedback from completed sessions.
                      </p>
                    </div>

                    {teacherReviews.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllReviews((prev) => !prev)}
                        className="rounded-xl border border-[#ddd2ee] bg-white px-4 py-2 text-sm font-medium text-[#4d3b63]"
                      >
                        {showAllReviews ? 'Show less' : 'See all'}
                      </button>
                    )}
                  </div>

                  {teacherReviews.length === 0 ? (
                    <p className="mt-4 text-sm leading-7 text-[#8a7d9f]">
                      No reviews yet.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {displayedReviews.map((reviewItem) => (
                        <div
                          key={reviewItem._id}
                          className="rounded-2xl bg-[#faf7fd] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#4d3b63]">
                              {reviewItem.skill}
                            </p>

                            <div className="flex items-center gap-2">
                              <StarsDisplay value={reviewItem.studentRatingForTeacher} size={14} />
                              <p className="text-sm font-semibold text-[#7d45c5]">
                                {reviewItem.studentRatingForTeacher}/5
                              </p>
                            </div>
                          </div>

                          <p className="mt-2 text-sm leading-7 text-[#6f5a89]">
                            {reviewItem.studentReviewForTeacher || 'No written review provided.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-[#faf7fd] p-6">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
                  Available slots
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[#4d3b63]">
                  Choose a time to book
                </h2>
                <p className="mt-2 text-[#8a7d9f]">
                  Booking is instant. Choose a clean one-hour slot and continue the protected session flow after it ends.
                </p>
              </div>

              {(!isEmailVerified || !isProfileComplete) && (
                <div className="mb-5 rounded-2xl border border-[#eadff5] bg-white p-4">
                  <p className="text-sm font-medium text-[#8a7d9f]">Before you can book</p>
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
                        className="rounded-xl border border-[#ddd2ee] bg-white px-5 py-3 text-sm font-medium text-[#4d3b63] shadow-sm transition-all hover:-translate-y-0.5"
                      >
                        Verify Email First
                      </button>
                    )}

                    {!isProfileComplete && (
                      <button
                        type="button"
                        onClick={() => navigate('/profile/edit')}
                        className="rounded-xl bg-[#8b3fe0] px-5 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)] transition-all hover:-translate-y-0.5"
                      >
                        Complete Profile
                      </button>
                    )}
                  </div>
                </div>
              )}

              {message && (
                <div className="mb-5 rounded-xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
                  {message}
                </div>
              )}

              {upcomingSlots.length === 0 ? (
                <div className="rounded-2xl border border-[#eee4f7] bg-white p-6 text-center">
                  <p className="text-lg font-semibold text-[#4d3b63]">
                    No available slots right now
                  </p>
                  <p className="mt-2 text-[#8a7d9f]">
                    Check again later or continue browsing other instructors.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSlots.map((slot) => {
                    const durationMinutes = Number(slot.durationMinutes || 60)

                    return (
                      <div
                        key={slot._id}
                        className="rounded-2xl border border-[#eee4f7] bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-semibold text-[#4d3b63]">
                                {slot.skill}
                              </h3>
                              <span className="rounded-full bg-[#e9f7ec] px-3 py-1 text-xs font-semibold text-[#2f8a4d]">
                                available
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-2xl bg-[#faf7fd] p-4">
                                <div className="flex items-center gap-2 text-[#8a7d9f]">
                                  <CalendarDays size={14} />
                                  <p className="text-sm">Date</p>
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                                  {formatDate(slot.startAt)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#faf7fd] p-4">
                                <div className="flex items-center gap-2 text-[#8a7d9f]">
                                  <Clock3 size={14} />
                                  <p className="text-sm">Time</p>
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                                  {formatTimeRange(slot.startAt, slot.endAt)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#faf7fd] p-4">
                                <div className="flex items-center gap-2 text-[#8a7d9f]">
                                  <Clock3 size={14} />
                                  <p className="text-sm">Duration</p>
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[#4d3b63]">
                                  {durationMinutes === 60 ? '1 hour' : `${durationMinutes} minutes`}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#faf7fd] p-4">
                                <div className="flex items-center gap-2 text-[#8a7d9f]">
                                  <Wallet size={14} />
                                  <p className="text-sm">Mode / Price</p>
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6 capitalize text-[#4d3b63]">
                                  {slot.mode} / {slot.price}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f5f0ff] px-3 py-2 text-xs font-medium text-[#6f45b8]">
                              <ShieldCheck size={13} />
                              Protected session flow
                            </div>
                          </div>

                          {slot.alreadyBooked || slot.status === 'booked' ? (
                            <div className="rounded-xl border border-[#ddd2ee] bg-white px-5 py-3 text-sm font-medium text-[#7d45c5] shadow-sm">
                              Booked
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBookSlot(slot._id)}
                              disabled={
                                bookingSlotId === slot._id ||
                                !isEmailVerified ||
                                !isProfileComplete
                              }
                              className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(139,63,224,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {bookingSlotId === slot._id ? 'Booking...' : 'Book Slot'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#e8ddf2] bg-white p-8 text-center shadow-[0_20px_50px_rgba(43,23,72,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Booking unavailable
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#4d3b63]">
              Not enough balance
            </h2>
            <p className="mt-4 text-base leading-8 text-[#8a7d9f]">
              {balanceModalText}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleGainCreditsRedirect}
                className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)]"
              >
                Gain Credits by Teaching
              </button>

              <button
                onClick={() => setShowBalanceModal(false)}
                className="rounded-xl border border-[#ddd2ee] bg-white px-6 py-3 text-sm font-medium text-[#4d3b63]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#e8ddf2] bg-white p-8 text-center shadow-[0_20px_50px_rgba(43,23,72,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Slot no longer available
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#4d3b63]">
              Someone booked it first
            </h2>
            <p className="mt-4 text-base leading-8 text-[#8a7d9f]">
              This slot has just been booked by another learner.
            </p>

            <div className="mt-8">
              <button
                onClick={() => setShowBookedModal(false)}
                className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookedSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#e8ddf2] bg-white p-8 text-center shadow-[0_20px_50px_rgba(43,23,72,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Slot booked
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#4d3b63]">
              Your booking is confirmed
            </h2>
            <p className="mt-4 text-base leading-8 text-[#8a7d9f]">
              The slot has been booked successfully and the selected amount is now held in escrow until both participants confirm the session or it is auto-completed later.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setShowBookedSuccessModal(false)
                  navigate('/sessions')
                }}
                className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)]"
              >
                Go to My Sessions
              </button>

              <button
                onClick={() => setShowBookedSuccessModal(false)}
                className="rounded-xl border border-[#ddd2ee] bg-white px-6 py-3 text-sm font-medium text-[#4d3b63]"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccessBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#e8ddf2] bg-white p-8 text-center shadow-[0_20px_50px_rgba(43,23,72,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Action unavailable
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#4d3b63]">
              {accessBlockedTitle}
            </h2>
            <p className="mt-4 text-base leading-8 text-[#8a7d9f]">
              {accessBlockedText}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {!isEmailVerified && (
                <button
                  onClick={() => {
                    setShowAccessBlockedModal(false)
                    setMessage('Please verify your email from the verification email we sent you.')
                  }}
                  className="rounded-xl border border-[#ddd2ee] bg-white px-6 py-3 text-sm font-medium text-[#4d3b63]"
                >
                  Verify Email First
                </button>
              )}

              {!isProfileComplete && (
                <button
                  onClick={() => {
                    setShowAccessBlockedModal(false)
                    navigate('/profile/edit')
                  }}
                  className="rounded-xl bg-[#8b3fe0] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(139,63,224,0.18)]"
                >
                  Complete Profile
                </button>
              )}

              <button
                onClick={() => setShowAccessBlockedModal(false)}
                className="rounded-xl border border-[#ddd2ee] bg-white px-6 py-3 text-sm font-medium text-[#4d3b63]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherProfilePage