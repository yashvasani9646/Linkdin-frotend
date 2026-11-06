import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import Logo from "../common/Logo";

const navLinkClass = ({ isActive }) =>
  `nav-link inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${
    isActive
      ? "bg-brand-tint text-brand-action"
      : "text-ink-muted hover:bg-surface-raised hover:text-brand-action"
  }`;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-line-weak/90 bg-white/95 backdrop-blur">
      <div className="app-container">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <div className="flex min-w-0 items-center gap-8">
            <Logo to="/" />
            <div className="hidden items-center gap-1 lg:flex">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                Find jobs
              </NavLink>
              <Link
                to="/#how-it-works"
                className="nav-link inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-brand-action"
              >
                How it works
              </Link>
              <Link
                to="/#employers"
                className="nav-link inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-brand-action"
              >
                For employers
              </Link>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/auth/signin" className="btn btn-ghost">
              Sign in
            </Link>
            <Link to="/auth/signup" className="btn btn-primary">
              Get started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="btn-icon md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="public-mobile-menu"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div id="public-mobile-menu" className="border-t border-line-weak bg-white md:hidden">
          <div className="app-container flex flex-col gap-2 py-4">
            <NavLink
              to="/"
              end
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive ? "bg-brand-tint text-brand-action" : "text-ink-muted hover:bg-surface-raised"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive ? "bg-brand-tint text-brand-action" : "text-ink-muted hover:bg-surface-raised"
                }`
              }
            >
              Find jobs
            </NavLink>
            <Link
              to="/#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-raised"
            >
              How it works
            </Link>
            <Link
              to="/#employers"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-raised"
            >
              For employers
            </Link>
            <Link
              to="/auth/signin"
              className="btn btn-secondary mt-2 w-full"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/auth/signup"
              className="btn btn-primary w-full"
              onClick={() => setIsMenuOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
