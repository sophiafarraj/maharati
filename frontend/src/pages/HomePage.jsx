import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  Star,
  Search,
  CalendarDays,
  Clock3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

function HomePage() {
  const trustPillars = [
    {
      icon: Search,
      title: 'Discover instructors',
      text: 'Browse members through skills, ratings, and availability.',
    },
    {
      icon: Wallet,
      title: 'Protected exchange',
      text: 'Credits and payment stay protected through escrow-based logic.',
    },
    {
      icon: ShieldCheck,
      title: 'Trust-driven system',
      text: 'Confirmations, disputes, and ratings shape platform reliability.',
    },
  ]

  const flow = [
    {
      step: '01',
      title: 'Instructor publishes slot',
      text: 'Teachers create available time slots for specific skills.',
    },
    {
      step: '02',
      title: 'Students request a slot',
      text: 'Multiple learners can request the same slot while it remains available.',
    },
    {
      step: '03',
      title: 'Teacher accepts one request',
      text: 'The slot becomes booked and the other pending requests are rejected.',
    },
    {
      step: '04',
      title: 'Session completes with trust',
      text: 'Users confirm, dispute if needed, and ratings strengthen reputation.',
    },
  ]

  const highlights = [
    {
      icon: CalendarDays,
      title: 'Slot-based learning',
      text: 'A more realistic scheduling model where instructors control availability.',
    },
    {
      icon: Clock3,
      title: 'Structured session flow',
      text: 'From request to confirmation, every session follows a clear lifecycle.',
    },
    {
      icon: CheckCircle2,
      title: 'Escrow and reputation',
      text: 'Maharati protects both sides through trust-focused system rules.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f4edf8] text-[#4d3b63]">
      <header className="sticky top-0 z-30 border-b border-[#ece2f5]/80 bg-[#f4edf8]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b186ea] to-[#8b3fe0] text-white shadow-[0_8px_18px_rgba(139,63,224,0.22)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-[#b186ea]">
                Maharati
              </div>
              <div className="-mt-1 text-xs tracking-[0.22em] text-[#9a8aac] uppercase">
                skill exchange
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-10 text-lg font-semibold text-[#5b3b85] md:flex">
            <a href="#discover" className="transition-opacity duration-300 hover:opacity-70">
              Find tutors
            </a>
            <a href="#how-it-works" className="transition-opacity duration-300 hover:opacity-70">
              How it works
            </a>
            <a href="#trust" className="transition-opacity duration-300 hover:opacity-70">
              Trust system
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-[#ddd3ea] bg-white px-6 py-2.5 text-base font-medium text-[#4d3b63] shadow-[0_6px_14px_rgba(123,92,146,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(123,92,146,0.12)]"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-gradient-to-r from-[#9b58e5] to-[#7f35dd] px-6 py-2.5 text-base font-medium text-white shadow-[0_10px_20px_rgba(139,63,224,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(139,63,224,0.32)]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-14 pt-10 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-2xl">
              <motion.p
                custom={0}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="inline-flex rounded-full border border-[#e5d8f1] bg-white/80 px-4 py-2 text-sm font-semibold text-[#7b5c92] shadow-sm"
              >
                Skill exchange, powered by trust
              </motion.p>

              <motion.h1
                custom={0.08}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-5 text-5xl font-bold leading-tight text-[#2f1f46] sm:text-6xl"
              >
                Teach what you know.
                <br />
                Learn what you need.
              </motion.h1>

              <motion.p
                custom={0.16}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-6 max-w-xl text-xl leading-9 text-[#4d3b63]"
              >
                Maharati is a credit-based skill exchange platform where members
                teach, earn credits, learn from others, and complete sessions
                through a structured trust system.
              </motion.p>

              <motion.div
                custom={0.24}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#9b58e5] to-[#7f35dd] px-8 py-4 text-lg font-semibold text-white shadow-[0_12px_24px_rgba(139,63,224,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(139,63,224,0.30)]"
                >
                  Find tutors
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-2xl border border-[#d9caea] bg-white px-8 py-4 text-lg font-semibold text-[#4d3b63] shadow-[0_8px_18px_rgba(123,92,146,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_22px_rgba(123,92,146,0.12)]"
                >
                  Teach a skill
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>

              <motion.div
                custom={0.32}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="mt-8 flex flex-wrap gap-3"
              >
                {['Credit-based', 'Escrow protected', 'Reputation driven'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#b186ea] px-5 py-2.5 text-base font-medium text-white shadow-sm"
                  >
                    • {item}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              custom={0.18}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="relative"
            >
              <div className="rounded-[38px] bg-white/75 p-5 shadow-[0_16px_40px_rgba(123,92,146,0.16)]">
                <div className="rounded-[30px] bg-gradient-to-br from-[#ffffff] via-[#f2e9fb] to-[#dcc7f4] p-5">
                  <div className="rounded-[26px] bg-white p-6 shadow-[0_10px_24px_rgba(139,63,224,0.10)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a68ad]">
                          How Maharati works
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#3d245b]">
                          A protected learning system
                        </h3>
                      </div>

                      <div className="rounded-full bg-[#edf7ef] px-3 py-1 text-xs font-semibold text-[#2f8a4d]">
                        Trust active
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl bg-[#f6f0fb] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-[#8a7d9f]">Discovery</p>
                            <p className="mt-1 text-lg font-semibold text-[#4d3b63]">
                              Students browse instructors and slots
                            </p>
                          </div>
                          <Search size={18} className="text-[#8b3fe0]" />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#f6f0fb] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-[#8a7d9f]">Booking flow</p>
                            <p className="mt-1 text-lg font-semibold text-[#4d3b63]">
                              Instructors publish slots and accept one request
                            </p>
                          </div>
                          <CalendarDays size={18} className="text-[#8b3fe0]" />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#f6f0fb] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-[#8a7d9f]">Escrow</p>
                            <p className="mt-1 text-lg font-semibold text-[#4d3b63]">
                              Credits or balance are protected on acceptance
                            </p>
                          </div>
                          <Wallet size={18} className="text-[#8b3fe0]" />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#f6f0fb] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-[#8a7d9f]">Completion</p>
                            <p className="mt-1 text-lg font-semibold text-[#4d3b63]">
                              Confirmations, disputes, and ratings close the loop
                            </p>
                          </div>
                          <Star size={18} className="text-[#8b3fe0]" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-[#faf6fd] p-4 text-center">
                        <p className="text-2xl font-bold text-[#5a2b8a]">Safe</p>
                        <p className="mt-1 text-sm text-[#7c6b93]">Escrow</p>
                      </div>
                      <div className="rounded-2xl bg-[#faf6fd] p-4 text-center">
                        <p className="text-2xl font-bold text-[#5a2b8a]">Clear</p>
                        <p className="mt-1 text-sm text-[#7c6b93]">Flow</p>
                      </div>
                      <div className="rounded-2xl bg-[#faf6fd] p-4 text-center">
                        <p className="text-2xl font-bold text-[#5a2b8a]">Trusted</p>
                        <p className="mt-1 text-sm text-[#7c6b93]">Ratings</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12" id="discover">
          <div className="grid gap-5 md:grid-cols-3">
            {trustPillars.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  custom={0.08 + index * 0.07}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={fadeUp}
                  className="rounded-[28px] bg-white p-6 shadow-[0_10px_24px_rgba(123,92,146,0.10)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ebfb] text-[#8b3fe0]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-[#3d245b]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-8 text-[#6f5d86]">
                    {item.text}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10" id="how-it-works">
          <div className="rounded-[36px] bg-white p-8 shadow-[0_12px_30px_rgba(123,92,146,0.12)] lg:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a68ad]">
                Session flow
              </p>
              <h2 className="mt-3 text-4xl font-semibold text-[#2f1f46]">
                Built around the real slot-based Maharati workflow
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#6f5d86]">
                Maharati is more than discovery. It turns knowledge exchange into
                a guided process with availability, requests, confirmation, and trust.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {flow.map((item, index) => (
                <motion.div
                  key={item.step}
                  custom={0.08 + index * 0.05}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={fadeUp}
                  className="rounded-[26px] bg-[#f8f3fc] p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-sm font-semibold tracking-[0.16em] text-[#8a68ad]">
                    {item.step}
                  </p>
                  <h3 className="mt-4 text-xl font-semibold text-[#3d245b]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6f5d86]">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10" id="trust">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[34px] bg-white p-8 shadow-[0_12px_30px_rgba(123,92,146,0.12)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a68ad]">
                Why it matters
              </p>
              <h2 className="mt-3 text-4xl font-semibold text-[#2f1f46]">
                A platform that treats trust as part of the product
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#6f5d86]">
                Maharati combines skill discovery with a system of escrow,
                session states, confirmations, disputes, and ratings so every
                exchange feels safer and more structured.
              </p>

              <div className="mt-8 grid gap-4">
                {highlights.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.title}
                      custom={0.08 + index * 0.05}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.25 }}
                      variants={fadeUp}
                      className="flex gap-4 rounded-2xl bg-[#f8f3fc] p-5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8b3fe0]">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#3d245b]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-base leading-7 text-[#6f5d86]">
                          {item.text}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              className="rounded-[34px] bg-gradient-to-br from-[#c9a7ef] via-[#b48ae9] to-[#9252df] p-8 text-white shadow-[0_18px_34px_rgba(139,63,224,0.22)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                Learn • Teach • Earn
              </p>
              <h3 className="mt-4 text-4xl font-semibold">
                One trusted platform for skill exchange
              </h3>
              <p className="mt-4 text-lg leading-8 text-white/90">
                Start as a learner, become an instructor, or do both within a single
                system designed for clarity, fairness, and growth.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="rounded-2xl bg-white px-7 py-4 text-base font-semibold text-[#6f34c8] shadow-[0_8px_18px_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-1"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl border border-white/40 px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  Log in
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 pt-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeUp}
            className="rounded-[40px] bg-white px-8 py-8 text-center shadow-[0_12px_28px_rgba(123,92,146,0.12)]"
          >
            <div className="text-4xl font-semibold text-[#3d245b] sm:text-5xl">
              Learn <span className="text-[#d5b04d]">•</span> Teach{' '}
              <span className="text-[#d5b04d]">•</span> Earn
            </div>
            <div className="mt-3 text-xl text-[#7c6b93] sm:text-2xl">
              All in one trusted platform
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}

export default HomePage