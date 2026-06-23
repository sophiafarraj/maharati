import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08070c]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-2xl font-semibold tracking-[-0.04em] text-white transition hover:text-[#b38cff]"
        >
          Maharati
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#system"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            System
          </a>
          <a
            href="#flow"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            Flow
          </a>
          <Link
            to="/login"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/20"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Navbar