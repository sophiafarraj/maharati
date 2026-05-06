import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  UserCircle2,
  Wallet,
  AlertTriangle,
  Star,
  Ban,
  CheckCircle2,
  Bell,
  ArrowUpRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

function StarPicker({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const active = starValue <= value

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className={`rounded-full p-2 transition-all ${
              active
                ? 'bg-[#f3edff] text-[#6d3df2]'
                : 'bg-[#f7f4fb] text-[#cdc4da]'
            } ${disabled ? 'opacity-60' : 'hover:-translate-y-0.5'}`}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star size={20} fill={active ? 'currentColor' : 'none'} />
          </button>
        )
      })}
    </div>
  )
}

function StarsDisplay({ value }) {
  const numeric = Number(value || 0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const active = starValue <= numeric

        return (
          <Star
            key={starValue}
            size={18}
            className={active ? 'text-[#6d3df2]' : 'text-[#ddd6ea]'}
            fill={active ? 'currentColor' : 'none'}
          />
        )
      })}
    </div>
  )
}

function SessionDetailsPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [sessionData, setSessionData] = useState(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [disputeReason, setDisputeReason] = useState('')
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  const fetchDetails = async () => {
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
        setMessage(sessionsData.message || 'Failed to load session')
        return
      }

      const user = userData.user || userData
      const sessions = sessionsData.sessions || []
      const foundSession = sessions.find((item) => item._id === sessionId)

      setCurrentUserId(user._id)

      if (!foundSession) {
        setMessage('Session not found')
        return
      }

      setSessionData(foundSession)
      setMeetingLink(foundSession.meetingLink || '')
      setMeetingNotes(foundSession.meetingNotes || '')
      setReview(foundSession.studentReviewForTeacher || '')
      setRating(Number(foundSession.studentRatingForTeacher || 5))
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [sessionId, navigate])

  const formatDateTime = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const statusStyles = {
    booked: 'bg-[#edf4ff] text-[#2563eb]',
    awaiting_confirmation: 'bg-[#f1ebfb] text-[#7d45c5]',
    finished: 'bg-[#e9f7ec] text-[#2f8a4d]',
    cancelled: 'bg-[#fff0f4] text-[#b4235a]',
    disputed: 'bg-[#ffe9e7] text-[#c2410c]',
  }

  const isStudent = useMemo(() => {
    if (!sessionData) return false
    return String(sessionData.studentId?._id || sessionData.studentId) === String(currentUserId)
  }, [sessionData, currentUserId])

  const isTeacher = useMemo(() => {
    if (!sessionData) return false
    return String(sessionData.teacherId?._id || sessionData.teacherId) === String(currentUserId)
  }, [sessionData, currentUserId])

  const sessionStarted = useMemo(() => {
    if (!sessionData?.scheduledAt && !sessionData?.slotId?.startAt) return false
    const value = sessionData.scheduledAt || sessionData.slotId?.startAt
    return Date.now() >= new Date(value).getTime()
  }, [sessionData])

  const sessionEnded = useMemo(() => {
    if (!sessionData?.endAt && !sessionData?.slotId?.endAt) return false
    const value = sessionData.endAt || sessionData.slotId?.endAt
    return Date.now() >= new Date(value).getTime()
  }, [sessionData])

  const canCancel = useMemo(() => {
    if (!sessionData) return false
    return sessionData.status === 'booked' && !sessionStarted
  }, [sessionData, sessionStarted])

  const canDispute = useMemo(() => {
    if (!sessionData) return false
    return (
      ['booked', 'awaiting_confirmation', 'finished'].includes(sessionData.status) &&
      sessionEnded &&
      !sessionData.disputeOpened &&
      sessionData.status !== 'cancelled'
    )
  }, [sessionData, sessionEnded])

  const canTeacherManageMeetingLink = useMemo(() => {
    if (!sessionData) return false
    return isTeacher && sessionData.status === 'booked' && !sessionEnded
  }, [sessionData, isTeacher, sessionEnded])

  const canStudentSeeJoinAction = useMemo(() => {
    if (!sessionData) return false
    return isStudent && !!sessionData.meetingLink && sessionData.status === 'booked' && !sessionEnded
  }, [sessionData, isStudent, sessionEnded])

  const canConfirm = useMemo(() => {
    if (!sessionData) return false
    if (!sessionEnded) return false
    if (!['booked', 'awaiting_confirmation'].includes(sessionData.status)) return false
    if (sessionData.disputeOpened || sessionData.status === 'disputed') return false

    if (isStudent) return !sessionData.studentConfirmed
    if (isTeacher) return !sessionData.teacherConfirmed
    return false
  }, [sessionData, sessionEnded, isStudent, isTeacher])

  const canRate = useMemo(() => {
    if (!sessionData) return false
    return isStudent && sessionData.status === 'finished' && !sessionData.ratedByStudent
  }, [sessionData, isStudent])

  const handleCancel = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    setActionLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to cancel session')
        return
      }

      setMessage(data.message || 'Session cancelled successfully')
      setCancelReason('')
      await fetchDetails()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDispute = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    setActionLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/dispute`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: disputeReason }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to open dispute')
        return
      }

      setMessage(data.message || 'Dispute opened')
      setDisputeReason('')
      await fetchDetails()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRate = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    setActionLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: Number(rating),
          review,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to submit rating')
        return
      }

      setMessage(data.message || 'Rating submitted successfully')
      await fetchDetails()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateMeetingLink = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    setActionLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/meeting-link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingLink,
          meetingNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to update meeting link')
        return
      }

      setMessage(data.message || 'Meeting link updated successfully')
      await fetchDetails()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmSession = async () => {
    const token = localStorage.getItem('token')
    setActionLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/confirm`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to confirm session')
        return
      }

      setMessage(data.message || 'Session confirmation saved')
      await fetchDetails()
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading session details...
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] text-[#1f172b]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#2f1b45] shadow-[0_10px_24px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5"
          >
            <ArrowLeft size={16} />
            Back to sessions
          </Link>

          <div className="mt-6 rounded-[32px] bg-white p-8 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
              Session not found
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#6b6479]">
              {message || 'The requested session could not be loaded.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const otherPerson = isStudent ? sessionData.teacherId : sessionData.studentId
  const durationMinutes = Number(sessionData.durationMinutes || 60)
  const durationText = durationMinutes === 60 ? '1 hour' : `${durationMinutes} minutes`

  return (
    <div className="min-h-screen bg-[#f7f5fb] text-[#1f172b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link
              to="/sessions"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#2f1b45] shadow-[0_10px_24px_rgba(31,23,42,0.05)] transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft size={16} />
              Back to sessions
            </Link>

            <button
              onClick={() => navigate('/notifications')}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5b34a5] shadow-[0_10px_24px_rgba(31,23,42,0.06)] transition-all hover:-translate-y-0.5"
              aria-label="Open notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </motion.div>

        <section className="mb-8 overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#f3edff_0%,#ede5ff_42%,#ffffff_100%)] px-8 py-9 shadow-[0_24px_60px_rgba(31,23,42,0.06)] md:px-10 md:py-11">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8e7aa7]">
              Session details
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[52px] md:leading-[1.02]">
              {sessionData.skill}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  statusStyles[sessionData.status] || 'bg-[#f4f1f8] text-[#4d3b63]'
                }`}
              >
                {sessionData.status.replace('_', ' ')}
              </span>

              {sessionData.ratedByStudent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7e8] px-3 py-1 text-xs font-semibold text-[#9a6700]">
                  <Star size={12} fill="currentColor" />
                  Reviewed
                </span>
              )}
            </div>

            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
              This session follows the protected lifecycle: instant booking, meeting link setup, end-of-session confirmation, optional dispute, final completion, and review.
            </p>
          </div>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.98fr_1.05fr]">
          <motion.div
            custom={0.08}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]"
          >
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
              Session overview
            </h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] bg-[#faf8fd] p-5">
                <div className="flex items-center gap-2 text-[#24152f]">
                  <UserCircle2 size={16} />
                  <span className="text-sm text-[#6b6479]">
                    {isStudent ? 'Teacher' : 'Student'}
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold text-[#24152f]">
                  {otherPerson?.name || '—'}
                </p>
                <p className="mt-1 text-sm text-[#6b6479]">{otherPerson?.email || '—'}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#5b34a5]">
                    <CalendarDays size={16} />
                    <span className="text-sm text-[#6b6479]">Start</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                    {formatDateTime(sessionData.scheduledAt || sessionData.slotId?.startAt)}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#5b34a5]">
                    <Clock3 size={16} />
                    <span className="text-sm text-[#6b6479]">End</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#24152f]">
                    {formatDateTime(sessionData.endAt || sessionData.slotId?.endAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#6b6479]">Duration</p>
                  <p className="mt-2 text-lg font-semibold text-[#24152f]">{durationText}</p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#5b34a5]">
                    <Wallet size={16} />
                    <span className="text-sm text-[#6b6479]">Mode</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold capitalize text-[#24152f]">
                    {sessionData.mode}
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#6b6479]">Escrow Amount</p>
                  <p className="mt-2 text-lg font-semibold text-[#24152f]">
                    {sessionData.escrowAmount}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#faf8fd] p-5">
                <p className="text-sm text-[#6b6479]">Meeting link</p>

                {canStudentSeeJoinAction ? (
                  <>
                    <a
                      href={sessionData.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="group mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#5b34a5]"
                    >
                      Join meeting
                      <ArrowUpRight
                        size={15}
                        className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </a>

                    {sessionData.meetingNotes && (
                      <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                        {sessionData.meetingNotes}
                      </p>
                    )}
                  </>
                ) : sessionEnded ? (
                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    This session has ended, so the meeting link is no longer available as an action here.
                  </p>
                ) : sessionData.meetingLink ? (
                  <>
                    <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                      A meeting link has been added for this session.
                    </p>
                    {sessionData.meetingNotes && (
                      <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                        {sessionData.meetingNotes}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    {isTeacher
                      ? 'No meeting link added yet. Add one below for your learner.'
                      : 'The instructor has not added the meeting link yet.'}
                  </p>
                )}
              </div>

              {sessionData.status === 'booked' && !sessionEnded && (
                <div className="rounded-[24px] bg-[#f4f8ff] p-5">
                  <p className="text-sm font-semibold text-[#2563eb]">Session booked and upcoming</p>
                  <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                    The session is booked. The teacher can still add the meeting link, and cancellation remains available only before the session starts.
                  </p>
                </div>
              )}

              {sessionData.status === 'awaiting_confirmation' && (
                <div className="rounded-[24px] bg-[#faf7fd] p-5">
                  <p className="text-sm font-semibold text-[#7d45c5]">Awaiting confirmation</p>
                  <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                    The session has ended and now requires confirmation from both participants unless a dispute is opened.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] bg-white p-4">
                      <p className="text-sm text-[#8a7d9f]">Student confirmation</p>
                      <p className="mt-2 text-sm font-semibold text-[#24152f]">
                        {sessionData.studentConfirmed ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>

                    <div className="rounded-[20px] bg-white p-4">
                      <p className="text-sm text-[#8a7d9f]">Teacher confirmation</p>
                      <p className="mt-2 text-sm font-semibold text-[#24152f]">
                        {sessionData.teacherConfirmed ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sessionData.status === 'finished' && (
                <div className="rounded-[24px] bg-[#f4fbf8] p-5">
                  <p className="text-sm font-semibold text-[#0f766e]">Session completed</p>
                  <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                    This session has finished. Learners can leave feedback once, and instructors can view the result here after it is submitted.
                  </p>
                </div>
              )}

              {sessionData.status === 'cancelled' && (
                <div className="rounded-[24px] bg-[#fff7fa] p-5">
                  <p className="text-sm font-semibold text-[#b4235a]">Session cancelled</p>
                  <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                    This session was cancelled before it started.
                  </p>
                  {sessionData.cancellationReason && (
                    <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                      Reason: {sessionData.cancellationReason}
                    </p>
                  )}
                </div>
              )}

              {sessionData.disputeOpened && (
                <div className="rounded-[24px] bg-[#fff7fa] p-5">
                  <p className="text-sm font-semibold text-[#b4235a]">Dispute opened</p>
                  <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                    {sessionData.disputeReason || 'No reason provided.'}
                  </p>
                </div>
              )}

              {sessionData.ratedByStudent && (
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm text-[#6b6479]">Student review</p>
                  <div className="mt-3">
                    <StarsDisplay value={sessionData.studentRatingForTeacher} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#24152f]">
                    {sessionData.studentRatingForTeacher}/5
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6b6479]">
                    {sessionData.studentReviewForTeacher || 'No written review.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            custom={0.14}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]"
          >
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9b84b7]">
              Available actions
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
              {sessionEnded ? 'Session actions' : 'Manage this session'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#6b6479]">
              Actions appear only when they are valid for the current time, the session status, and your role in this session.
            </p>

            <div className="mt-6 space-y-5">
              {canTeacherManageMeetingLink && (
                <form onSubmit={handleUpdateMeetingLink} className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <CalendarDays size={18} />
                    <h3 className="text-lg font-semibold">Meeting link</h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    Add or update the official meeting link before the session ends so the learner can join it from this page.
                  </p>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-[#5e5870]">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/... or Zoom link"
                      className="w-full rounded-2xl bg-white px-4 py-3 text-[#1f172b] outline-none ring-1 ring-[#e8e0f2] placeholder:text-[#a49bb5] focus:ring-[#c8b6ea]"
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-[#5e5870]">
                      Notes
                    </label>
                    <textarea
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      rows={4}
                      placeholder="Optional instructions for the learner"
                      className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-[#1f172b] outline-none ring-1 ring-[#e8e0f2] placeholder:text-[#a49bb5] focus:ring-[#c8b6ea]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="mt-4 rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {actionLoading
                      ? 'Saving...'
                      : sessionData.meetingLink
                      ? 'Update Meeting Link'
                      : 'Add Meeting Link'}
                  </button>
                </form>
              )}

              {isStudent && !sessionData.meetingLink && sessionData.status === 'booked' && !sessionEnded && (
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <h3 className="text-lg font-semibold text-[#24152f]">Meeting link pending</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    The instructor has not added the meeting link yet. Once it is added, it will appear here and you should also receive a notification.
                  </p>
                </div>
              )}

              {canCancel && (
                <form onSubmit={handleCancel} className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <Ban size={18} />
                    <h3 className="text-lg font-semibold">Cancel session</h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    Cancellation is allowed only before the session start time.
                  </p>

                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    placeholder="Optional cancellation reason"
                    className="mt-4 w-full resize-none rounded-2xl bg-white px-4 py-3 text-[#1f172b] outline-none ring-1 ring-[#e8e0f2] placeholder:text-[#a49bb5] focus:ring-[#c8b6ea]"
                  />

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="mt-4 rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#b4235a] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Cancel Session'}
                  </button>
                </form>
              )}

              {canConfirm && (
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <CheckCircle2 size={18} />
                    <h3 className="text-lg font-semibold">Confirm session</h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    Confirm that this session happened successfully. Once both sides confirm, the session finishes and review becomes available to the learner.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmSession}
                    disabled={actionLoading}
                    className="mt-4 rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Session'}
                  </button>
                </div>
              )}

              {canDispute && (
                <form onSubmit={handleDispute} className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <AlertTriangle size={18} />
                    <h3 className="text-lg font-semibold">Open dispute</h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    If something went wrong after the session ended, either participant may open a dispute instead of confirming.
                  </p>

                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={4}
                    placeholder="Explain the issue"
                    className="mt-4 w-full resize-none rounded-2xl bg-white px-4 py-3 text-[#1f172b] outline-none ring-1 ring-[#e8e0f2] placeholder:text-[#a49bb5] focus:ring-[#c8b6ea]"
                  />

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="mt-4 rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#b4235a] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Submit Dispute'}
                  </button>
                </form>
              )}

              {canRate && (
                <form onSubmit={handleRate} className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <Star size={18} />
                    <h3 className="text-lg font-semibold">Post a review</h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    Rate your instructor from one to five stars and optionally leave written feedback.
                  </p>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-[#5e5870]">
                      Star Rating
                    </label>
                    <StarPicker value={rating} onChange={setRating} disabled={actionLoading} />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-[#5e5870]">
                      Review
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                      placeholder="Share your feedback"
                      className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-[#1f172b] outline-none ring-1 ring-[#e8e0f2] placeholder:text-[#a49bb5] focus:ring-[#c8b6ea]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="mt-4 rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {isStudent && sessionData.status === 'finished' && sessionData.ratedByStudent && (
                <div className="rounded-[24px] bg-[#f4fbf8] p-5">
                  <div className="flex items-center gap-2 text-[#0f766e]">
                    <CheckCircle2 size={18} />
                    <h3 className="text-lg font-semibold text-[#24152f]">Review submitted</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    Your feedback has already been posted for this instructor.
                  </p>
                </div>
              )}

              {isTeacher && sessionData.status === 'finished' && !sessionData.ratedByStudent && (
                <div className="rounded-[24px] bg-[#f4fbf8] p-5">
                  <div className="flex items-center gap-2 text-[#0f766e]">
                    <CheckCircle2 size={18} />
                    <h3 className="text-lg font-semibold text-[#24152f]">Session completed</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    This session has been completed. The learner can now leave a review.
                  </p>
                </div>
              )}

              {isTeacher && sessionData.ratedByStudent && (
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <Star size={18} />
                    <h3 className="text-lg font-semibold">View feedback</h3>
                  </div>
                  <div className="mt-3">
                    <StarsDisplay value={sessionData.studentRatingForTeacher} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                    {sessionData.studentReviewForTeacher || 'No written review.'}
                  </p>
                </div>
              )}

              {!canTeacherManageMeetingLink &&
                !canCancel &&
                !canConfirm &&
                !canDispute &&
                !canRate &&
                !(isStudent && sessionData.status === 'finished' && sessionData.ratedByStudent) &&
                !(isTeacher && sessionData.status === 'finished' && !sessionData.ratedByStudent) &&
                !(isTeacher && sessionData.ratedByStudent) && (
                  <div className="rounded-[24px] bg-[#faf8fd] p-5">
                    <p className="text-lg font-semibold text-[#24152f]">No active actions right now</p>
                    <p className="mt-3 text-sm leading-7 text-[#6b6479]">
                      There is nothing you need to do for this session at the moment.
                    </p>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SessionDetailsPage