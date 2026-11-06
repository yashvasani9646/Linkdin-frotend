import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"; // Import Outlet and NavLink
import { useDispatch, useSelector } from "react-redux";
import { clearUser, selectUser } from "../store/slices/authSlice";
import { Users } from "../icons/Users";
import { Stack } from "../icons/Stack";
import { Briefcase } from "../icons/Briefcase";
import { BellRinging } from "../icons/BellRinging";
import { PenNib } from "../icons/PenNib";
import { List } from "../icons/List";
import Logo from "../components/common/Logo";
import { BRAND } from "../config/brand";

const AdminDashboardPage = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = () => {
    dispatch(clearUser());
    navigate("/auth/signin");
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 border-l-4 px-5 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "border-brand-action bg-brand-tint text-brand-action"
        : "border-transparent text-ink-muted hover:bg-surface-raised hover:text-brand-ink"
    }`;

  // Get profile photo URL
  const getProfilePhotoUrl = () => {
    if (!user?.profilePhoto) return "/Ellipse_19.png";
    if (user.profilePhoto.startsWith("/uploads")) {
      return `${import.meta.env.VITE_API_URL || "http://localhost:5502"}${
        user.profilePhoto
      }`;
    }
    return user.profilePhoto;
  };

  return (
    <div className="flex min-h-screen bg-surface-page font-sans text-ink">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-30 flex w-64 flex-col border-r border-line-weak bg-white transition-transform duration-300 lg:static lg:inset-auto lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center border-b border-line-weak px-6 py-5">
          <Logo to="/admin/dashboard" />
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-3 px-5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Menu
          </div>
          <nav className="">
            <NavLink
              to="/admin/dashboard"
              className={navLinkClass}
            >
              <Stack />
              Overview
            </NavLink>
            <NavLink
              to="/admin/users"
              className={navLinkClass}
            >
              <Users />
              Users
            </NavLink>
            <NavLink
              to="/admin/jobs"
              className={navLinkClass}
            >
              <Briefcase />
              Jobs
            </NavLink>
            <NavLink
              to="/admin/notifications"
              className={navLinkClass}
            >
              <BellRinging />
              Notifications
            </NavLink>
            <NavLink
              to="/admin/branding"
              className={navLinkClass}
            >
              <PenNib />
              Branding
            </NavLink>
          </nav>
        </div>

        <div className="border-t border-line-weak p-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <img src="/SignOut.svg" className="h-5 w-5" alt="" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line-weak bg-white px-4 py-3 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-ink-muted hover:bg-surface-raised lg:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <div className="block mt-1 lg:hidden">
              <Logo to="/admin/dashboard" />
            </div>
          </div>
          <Link to="/admin/profile">
            <img
              className="h-[46px] w-[46px] rounded-full object-cover border border-gray-200 cursor-pointer"
              src={getProfilePhotoUrl()}
              alt="User avatar"
              onError={(e) => {
                e.target.src = "/Ellipse_19.png";
              }}
            />
          </Link>
        </div>

        {/* Page Content */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <Outlet />
        </div>
        {/* Footer */}
        <footer className="mt-auto flex flex-col items-center justify-between gap-3 border-t border-line-weak px-4 py-5 text-sm text-ink-muted md:flex-row md:px-10">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} {BRAND.name} Admin. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="transition-colors hover:text-brand-ink">
              Privacy Policy
            </Link>
            <span className="text-line">|</span>
            <Link to="/terms" className="transition-colors hover:text-brand-ink">
              Terms of Use
            </Link>
          </div>
        </footer>
      </main>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
