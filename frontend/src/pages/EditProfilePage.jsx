import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import { isProfileComplete } from '../utils/profile'
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
  CheckCircle2,
  Mail,
  Camera,
} from 'lucide-react'

const SKILL_GROUPS = [
  {
    title: 'Academic',
    skills: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'Arabic',
      'History',
      'Geography',
      'Economics',
    ],
  },
  {
    title: 'Technology',
    skills: [
      'Programming',
      'Python',
      'Java',
      'JavaScript',
      'Web Development',
      'Data Analysis',
      'Excel',
      'UI Design',
      'UX Design',
    ],
  },
  {
    title: 'Creative',
    skills: [
      'Graphic Design',
      'Photoshop',
      'Illustrator',
      'Video Editing',
      'Photography',
      'Content Writing',
      'Public Speaking',
      'Presentation Design',
    ],
  },
  {
    title: 'Languages & Business',
    skills: [
      'French',
      'German',
      'Spanish',
      'Translation',
      'Marketing',
      'Business',
      'Accounting',
      'Project Management',
    ],
  },
]

function normalizeSkill(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function uniqueSkills(values = []) {
  return [...new Set(values.map(normalizeSkill).filter(Boolean))]
}

function SkillSelector({
  label,
  selectedSkills,
  onToggleSkill,
  customSkill,
  onCustomSkillChange,
  onAddCustomSkill,
  helperText,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#6b5d80]">{label}</label>

      <div className="space-y-5 rounded-[24px] bg-[#faf8fd] p-5">
        {SKILL_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b84b7]">
              {group.title}
            </p>

            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill) => {
                const active = selectedSkills.includes(skill)

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => onToggleSkill(skill)}
                    className={
                      active
                        ? 'rounded-full bg-[#6d3df2] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_22px_rgba(109,61,242,0.18)]'
                        : 'rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5e4a79] ring-1 ring-[#e6dcef] transition-all hover:-translate-y-0.5 hover:bg-[#f8f3ff]'
                    }
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="rounded-[20px] bg-white p-4 ring-1 ring-[#ebe3f5]">
          <p className="text-sm font-medium text-[#6b5d80]">Add another skill</p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => onCustomSkillChange(e.target.value)}
              placeholder="Type a custom skill"
              className="flex-1 rounded-2xl bg-[#faf8fd] px-4 py-3 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
            />
            <button
              type="button"
              onClick={onAddCustomSkill}
              className="rounded-2xl bg-[#f4f1f8] px-5 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5"
            >
              Add
            </button>
          </div>
        </div>

        {selectedSkills.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b84b7]">
              Selected
            </p>

            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onToggleSkill(skill)}
                  className="rounded-full bg-[#efe8ff] px-4 py-2 text-sm font-medium text-[#6a4e92]"
                >
                  {skill} ×
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-[#8c859a]">{helperText}</p>
    </div>
  )
}

function EditProfilePage() {
  const navigate = useNavigate()

  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [resendingVerification, setResendingVerification] = useState(false)

  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const [customOfferedSkill, setCustomOfferedSkill] = useState('')
  const [customWantedSkill, setCustomWantedSkill] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    skillsOffered: [],
    skillsWanted: [],
  })

  const getSidebarLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 rounded-2xl bg-[#f3edff] px-4 py-3 text-[#2f1b45] transition-all'
      : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-[#766886] transition-all hover:bg-white hover:text-[#2f1b45]'

  const profileImageSrc = previewUrl || user?.profileImage || ''

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
    const fetchUser = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          navigate('/login')
          return
        }

        const currentUser = data.user || data
        setUser(currentUser)
        localStorage.setItem('user', JSON.stringify(currentUser))
        await fetchUnreadNotifications(token)

        setForm({
          name: currentUser.name || '',
          email: currentUser.email || '',
          skillsOffered: uniqueSkills(currentUser.skillsOffered || []),
          skillsWanted: uniqueSkills(currentUser.skillsWanted || []),
        })
      } catch (error) {
        console.error(error)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleNameChange = (e) => {
    setForm((prev) => ({ ...prev, name: e.target.value }))
  }

  const toggleSkill = (field, skill) => {
    const normalized = normalizeSkill(skill)

    setForm((prev) => {
      const exists = prev[field].includes(normalized)

      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== normalized)
          : [...prev[field], normalized],
      }
    })
  }

  const addCustomSkill = (field, value, clear) => {
    const normalized = normalizeSkill(value)

    if (!normalized) return
    if (normalized.length > 50) {
      setMessage('Custom skill must be 50 characters or less.')
      return
    }

    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(normalized)
        ? prev[field]
        : [...prev[field], normalized],
    }))

    clear('')
    setMessage('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const uploadProfilePhoto = async (token) => {
    if (!selectedImage) return null

    const formData = new FormData()
    formData.append('profileImage', selectedImage)

    const res = await fetch(`${API_BASE_URL}/api/users/me/photo`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload profile photo')
    }

    return data.user || data
  }

  const handleResendVerification = async () => {
    if (!user?.email) return

    setResendingVerification(true)
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to resend verification email')
        return
      }

      setMessage(data.message || 'Verification email sent successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Connection error')
    } finally {
      setResendingVerification(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const token = localStorage.getItem('token')

    try {
      const updatedUserPayload = {
        name: form.name.trim(),
        skillsOffered: uniqueSkills(form.skillsOffered),
        skillsWanted: uniqueSkills(form.skillsWanted),
      }

      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUserPayload),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Failed to update profile')
        setSaving(false)
        return
      }

      let latestUser = data.user || null

      if (selectedImage) {
        latestUser = await uploadProfilePhoto(token)
      }

      const refreshedUserRes = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const refreshedUserData = await refreshedUserRes.json()
      const refreshedUser = refreshedUserData.user || latestUser || refreshedUserData

      setUser(refreshedUser)
      localStorage.setItem('user', JSON.stringify(refreshedUser))
      setSelectedImage(null)
      setPreviewUrl('')
      setForm({
        name: refreshedUser.name || '',
        email: refreshedUser.email || '',
        skillsOffered: uniqueSkills(refreshedUser.skillsOffered || []),
        skillsWanted: uniqueSkills(refreshedUser.skillsWanted || []),
      })
      setCustomOfferedSkill('')
      setCustomWantedSkill('')
      setMessage('Profile updated successfully.')

      if (isProfileComplete(refreshedUser)) {
        setTimeout(() => {
          navigate('/dashboard')
        }, 500)
      }
    } catch (error) {
      console.error(error)
      setMessage(error.message || 'Connection error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-5 text-[#4d3b63] shadow-[0_20px_50px_rgba(31,23,42,0.06)]">
          Loading profile...
        </div>
      </div>
    )
  }

  const profileReady = isProfileComplete({
    name: form.name,
    skillsOffered: form.skillsOffered,
    skillsWanted: form.skillsWanted,
  })

  const sidebarLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile/edit', label: 'Edit Profile', icon: UserPen },
    { to: '/teachers', label: 'Find tutors', icon: Search },
    { to: '/slots', label: 'My Slots', icon: CalendarRange },
    { to: '/sessions', label: 'Session History', icon: History },
    { to: '/teacher/requests', label: 'Booked Sessions', icon: Briefcase },
  ]

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
                name={user?.name}
                profileImage={profileImageSrc}
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
                name={user?.name}
                profileImage={profileImageSrc}
                size="lg"
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-[-0.03em] text-[#2f1b45]">
                  {user?.name || 'Member'}
                </h2>
                <p className="mt-1 text-sm text-[#857996]">Member workspace</p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-3 py-2 text-xs font-medium text-[#5b34a5]">
              <Sparkles size={12} />
              Profile setup
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
            <p className="text-sm text-white/70">Profile status</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {profileReady ? 'Complete' : 'In progress'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Add both offered and wanted skills to unlock the full platform flow.
            </p>
          </div>

          <div className="mt-4 rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
            <p className="text-sm font-medium text-[#8a7d9f]">Email verification</p>
            <p className="mt-2 text-lg font-semibold text-[#24152f]">
              {user?.isEmailVerified ? 'Verified' : 'Not verified'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#8a7d9f]">
              {user?.isEmailVerified
                ? 'Your email is verified and important actions are fully unlocked.'
                : 'Booking sessions and creating slots stay blocked until your email is verified.'}
            </p>

            {!user?.isEmailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="mt-4 rounded-2xl bg-[#f4f1f8] px-4 py-3 text-sm font-medium text-[#4d3b63] transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
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
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8e7aa7]">
                  Complete your profile
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#24152f] md:text-[54px] md:leading-[1.02]">
                  Set up your Maharati profile
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#6f5a89]">
                  Add the skills you teach, the skills you want to learn, and your profile image so your identity feels complete across the platform.
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#6a4e92] shadow-[0_10px_24px_rgba(31,23,42,0.05)]">
                {profileReady ? 'Ready for dashboard' : 'Profile setup in progress'}
              </div>
            </div>
          </section>

          {!user?.isEmailVerified && (
            <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#9b84b7]">
                Verification required
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Verify your email to unlock key actions
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#8a7d9f]">
                You can complete your profile and browse the platform, but booking sessions and creating slots stay locked until your email address is verified.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="rounded-2xl bg-[#6d3df2] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <section className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Why this matters
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">What this updates</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[#4d3b63]">
                    <li>• Your visible member identity</li>
                    <li>• Your profile photo</li>
                    <li>• Skills you can teach</li>
                    <li>• Skills you want to learn</li>
                  </ul>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <p className="text-sm font-medium text-[#8a7d9f]">What happens next</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    Once your profile is complete and your email is verified, you can browse teachers, book sessions, create slots, and manage your full learning journey.
                  </p>
                </div>

                <div className="rounded-[24px] bg-[#faf8fd] p-5">
                  <div className="flex items-center gap-2 text-[#24152f]">
                    <CheckCircle2 size={16} className="text-[#6d3df2]" />
                    <p className="text-sm font-medium">Profile completion</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#4d3b63]">
                    {profileReady
                      ? 'Your profile has the core information needed to participate fully.'
                      : 'Add both offered and wanted skills so the platform can guide matching and actions correctly.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-7 shadow-[0_20px_50px_rgba(31,23,42,0.05)]">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#24152f]">
                Profile Details
              </h3>
              <p className="mt-2 text-sm text-[#8a7d9f]">
                Keep this information aligned with your real teaching and learning goals.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                    Profile Photo
                  </label>

                  <div className="flex items-center gap-4 rounded-[24px] bg-[#faf8fd] p-5">
                    <UserAvatar
                      name={user?.name}
                      profileImage={profileImageSrc}
                      size="md"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[#24152f]">
                        <Camera size={16} />
                        <p className="text-sm font-medium">Upload a profile image</p>
                      </div>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageChange}
                        className="mt-3 block w-full text-sm text-[#4d3b63] file:mr-4 file:rounded-xl file:border-0 file:bg-[#6d3df2] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
                      />

                      <p className="mt-2 text-xs text-[#8c859a]">
                        Upload PNG, JPG, or WEBP up to 2 MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl bg-[#faf8fd] px-4 py-3.5 text-[#24152f] outline-none ring-1 ring-[#ebe3f5] placeholder:text-[#aa9abf] focus:ring-[#c8b6ea]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#6b5d80]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a393b8]"
                    />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      readOnly
                      className="w-full rounded-2xl bg-[#f3eff9] px-4 py-3.5 pl-11 text-[#6b6479] outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#8c859a]">
                    Your email is shown for reference only.
                  </p>
                </div>

                <SkillSelector
                  label="Skills Offered"
                  selectedSkills={form.skillsOffered}
                  onToggleSkill={(skill) => toggleSkill('skillsOffered', skill)}
                  customSkill={customOfferedSkill}
                  onCustomSkillChange={setCustomOfferedSkill}
                  onAddCustomSkill={() =>
                    addCustomSkill('skillsOffered', customOfferedSkill, setCustomOfferedSkill)
                  }
                  helperText="Choose from common skills, then add a custom one only if it is missing."
                />

                <SkillSelector
                  label="Skills Wanted"
                  selectedSkills={form.skillsWanted}
                  onToggleSkill={(skill) => toggleSkill('skillsWanted', skill)}
                  customSkill={customWantedSkill}
                  onCustomSkillChange={setCustomWantedSkill}
                  onAddCustomSkill={() =>
                    addCustomSkill('skillsWanted', customWantedSkill, setCustomWantedSkill)
                  }
                  helperText="Select what you want to learn so tutor search and matching stay cleaner."
                />

                {message && (
                  <div className="rounded-2xl bg-[#f7f1fc] px-4 py-3 text-sm text-[#6a4e92]">
                    {message}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#6d3df2] px-7 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(109,61,242,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-70"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>

                  <Link
                    to="/dashboard"
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

export default EditProfilePage