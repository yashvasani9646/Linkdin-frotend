import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addJob } from "../../utils/jobStorage";
import { Settings } from "../../icons/settings";
import { Briefcase } from "../../icons/Briefcase";
import { Profile } from "../../icons/profile";
import { LogOut } from "../../icons/LogOut";
import CreateJobPostModal from "../CreateJobPostModal";
import { clearUser, selectUser } from "../../store/slices/authSlice";
import { API_CONFIG } from "../../config/api.config";
import { toAssetUrl } from "../../utils/assetUrl";
import notificationService from "../../services/notificationService";
import chatService from "../../services/chatService";
import socketService from "../../services/socketService";
import { toast } from "react-toastify";
import Logo from "../common/Logo";
import { ROLES } from "../../constants/roles";

const ProtectedNavBar = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const dropdownRef = useRef(null);

  // Get profile photo URL from Redux store
  const profilePhotoUrl = user?.profilePhoto ? toAssetUrl(user.profilePhoto) : null;

  const userInitials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase())
    .join("") || "U";
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the account menu with Escape for keyboard accessibility.
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDropdownOpen]);

  // Check for unread notifications and messages on mount
  useEffect(() => {
    const checkUnreadCounts = async () => {
      try {
        // Check notifications
        const notifResponse = await notificationService.getUnreadCount();
        if (notifResponse.success && notifResponse.data) {
          setHasNotifications(notifResponse.data.unreadCount > 0);
        }

        // Check messages
        const msgResponse = await chatService.getUnreadCount();
        if (msgResponse.success && msgResponse.data) {
          setHasMessages(msgResponse.data.unreadCount > 0);
        }
      } catch {
        // Unread indicators are non-critical; leave the last known state intact.
      }
    };

    checkUnreadCounts();
  }, []);

  // Initialize socket connection if not already connected
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }
  }, []);

  // Listen for real-time notifications via socket
  useEffect(() => {
    // Register listeners on the socket instance, even while it is still connecting.
    // Socket.IO keeps listeners across connect/reconnect for the same instance.
    if (!socketService.getSocket()) {
      return;
    }

    const handleNewJobNotification = (data) => {
      setHasNotifications(true);

      if (data.notification) {
        toast.info(data.notification.title || "A new job has been posted.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClick: () => navigate("/dashboard/notification"),
        });
      }
    };

    const handleReceiveMessage = () => {
      setHasMessages(true);
    };

    socketService.on("new_job_notification", handleNewJobNotification);
    socketService.on("receive_message", handleReceiveMessage);

    return () => {
      socketService.off("new_job_notification", handleNewJobNotification);
      socketService.off("receive_message", handleReceiveMessage);
    };
  }, [navigate]);
  const handleSignOut = () => {
    dispatch(clearUser());
    navigate("/auth/signin");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-line-weak bg-white">
      <div className="app-container-wide">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="py-2">
              <Logo to="/dashboard" />
            </div>

            <div className="hidden items-center gap-7 lg:flex">
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `nav-link inline-flex min-h-10 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-brand-action text-brand-action"
                      : "border-transparent text-ink-muted hover:border-brand-action hover:text-brand-action"
                  }`
                }
              >
                Find jobs
              </NavLink>
              {(user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN) && (
                <NavLink
                  to="/dashboard/my-posted-jobs"
                  className={({ isActive }) =>
                    `nav-link inline-flex min-h-10 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-brand-action text-brand-action"
                        : "border-transparent text-ink-muted hover:border-brand-action hover:text-brand-action"
                    }`
                  }
                >
                  My Posted Jobs
                </NavLink>
              )}
              <NavLink
                to="/dashboard/my-saved-job"
                className={({ isActive }) =>
                  `nav-link inline-flex min-h-10 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-brand-action text-brand-action"
                      : "border-transparent text-ink-muted hover:border-brand-action hover:text-brand-action"
                  }`
                }
              >
                Saved jobs
              </NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <NavLink
              to="/dashboard/message"
              className={({ isActive }) =>
                `nav-link no-underline hover:no-underline focus:no-underline hidden lg:block lg:pt-[26px] lg:pb-[24px] lg:border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "lg:border-brand text-brand"
                    : "lg:border-transparent text-secondary hover:text-brand hover:lg:border-brand"
                }`
              }
              style={{ textDecoration: "none" }}
            >
              <img
                src={hasMessages ? "/MsgRinging.svg" : "/ChatCircleDots.svg"}
                alt="Messages"
                className="w-6 h-6"
              />
            </NavLink>

            <NavLink
              to="/dashboard/notification"
              className={({ isActive }) =>
                `nav-link no-underline hover:no-underline focus:no-underline hidden lg:block relative lg:pt-[26px] lg:pb-[24px] lg:border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "lg:border-brand text-brand"
                    : "lg:border-transparent text-secondary hover:text-brand hover:lg:border-brand"
                }`
              }
              style={{ textDecoration: "none" }}
            >
              <img
                src={hasNotifications ? "/BellRinging.svg" : "/Bell.svg"}
                alt="Notifications"
                className="w-6 h-6"
              />
            </NavLink>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/40 focus-visible:ring-offset-2"
                aria-expanded={isDropdownOpen}
                aria-controls="protected-account-menu"
                aria-haspopup="menu"
                aria-label="Open account menu"
              >
                {profilePhotoUrl && !imageLoadError ? (
                  <img
                    src={profilePhotoUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-line-weak object-cover lg:h-11 lg:w-11"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-action text-sm font-semibold text-white transition-colors hover:bg-brand-action-hover lg:h-11 lg:w-11"
                    aria-hidden="true"
                  >
                    {userInitials}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  id="protected-account-menu"
                  role="menu"
                  aria-label="Account navigation"
                  className="absolute right-0 z-50 mt-2 w-[232px] overflow-hidden rounded-xl border border-line-weak bg-white py-2 shadow-dropdown"
                >
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-muted transition hover:bg-brand-tint hover:text-brand-action"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Profile />
                    My profile
                  </Link>

                  <Link
                    to="/dashboard/my-saved-job?tab=applied"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-muted transition hover:bg-brand-tint hover:text-brand-action"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Briefcase />
                    My applications
                  </Link>

                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-muted transition hover:bg-brand-tint hover:text-brand-action"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-line-weak" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger transition hover:bg-danger-soft"
                  >
                    <LogOut />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Post Job Button - Desktop Only (Recruiter & Admin only) */}
            {(user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN) && (
              <button
                type="button"
                onClick={() => setIsPostJobModalOpen(true)}
                className="btn btn-primary hidden lg:inline-flex"
              >
                Post a job
              </button>
            )}

            {/* Hamburger Menu Button - Mobile Only */}
            <button
              type="button"
              className="btn-icon lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="protected-mobile-menu"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="protected-mobile-menu"
          className="absolute left-0 top-full flex w-full flex-col gap-1.5 border-b border-line-weak bg-white px-4 py-4 shadow-dropdown lg:hidden"
        >
          <NavLink
            to="/dashboard"
            end
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `text-sm font-medium leading-[18px] -tracking-[0.2px] transition-colors py-2 ${isActive ? "text-primary" : "text-gray-600 hover:text-primary"
              }`
            }
          >
            Find jobs
          </NavLink>
          {(user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN) && (
            <NavLink
              to="/dashboard/my-posted-jobs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm font-medium leading-[18px] -tracking-[0.2px] transition-colors py-2 ${isActive ? "text-primary" : "text-gray-600 hover:text-primary"
                }`
              }
            >
              My Posted Jobs
            </NavLink>
          )}
          <NavLink
            to="/dashboard/my-saved-job"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `text-sm font-medium leading-[18px] -tracking-[0.2px] transition-colors py-2 ${isActive ? "text-primary" : "text-gray-600 hover:text-primary"
              }`
            }
          >
            Saved jobs
          </NavLink>
          <NavLink
            to="/dashboard/message"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-medium leading-[18px] -tracking-[0.2px] transition-colors py-2 ${isActive ? "text-primary" : "text-gray-600 hover:text-primary"
              }`
            }
          >
            <img
              src={hasMessages ? "/MsgRinging.svg" : "/ChatCircleDots.svg"}
              alt="Messages"
              className="w-5 h-5"
            />
            Messages
          </NavLink>
          <NavLink
            to="/dashboard/notification"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-medium leading-[18px] -tracking-[0.2px] transition-colors py-2 ${isActive ? "text-primary" : "text-gray-600 hover:text-primary"
              }`
            }
          >
            <img
              src={hasNotifications ? "/BellRinging.svg" : "/Bell.svg"}
              alt="Notifications"
              className="w-5 h-5"
            />
            Notifications
          </NavLink>
          {(user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN) && (
            <button
              onClick={() => {
                setIsPostJobModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              type="button"
              className="btn btn-primary mt-2 w-full"
            >
              Post job
            </button>
          )}
        </div>
      )}

      {(user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN) && (
        <CreateJobPostModal
          isOpen={isPostJobModalOpen}
          onClose={() => setIsPostJobModalOpen(false)}
          onPublish={(data) => {
            addJob(data);
            setIsPostJobModalOpen(false);
            navigate("/dashboard/my-posted-jobs");
          }}
        />
      )}
    </nav>
  );
};

export default ProtectedNavBar;
