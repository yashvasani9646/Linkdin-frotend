import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";

const AdminProfilePage = () => {
  const reduxUser = useSelector(selectUser);

  // Use user data from Redux (API response)
  const user = {
    name:
      reduxUser?.fullName ||
      `${reduxUser?.firstName || ""} ${reduxUser?.lastName || ""}`.trim() ||
      "Admin User",
    role: reduxUser?.role
      ? reduxUser.role.charAt(0).toUpperCase() + reduxUser.role.slice(1)
      : "Admin",
    email: reduxUser?.email || "",
    phone: reduxUser?.phoneNumber || "",
    avatar: reduxUser?.profilePhoto || "/Ellipse_19.png",
    firstName: reduxUser?.firstName || "",
    lastName: reduxUser?.lastName || "",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Admin profile</h1>
        <p className="page-subtitle">
          Manage your personal details and account settings.
        </p>
      </div>

      <div className="mx-auto max-w-[920px] space-y-6">
      {/* Profile Header Card */}
      <section className="panel flex flex-col items-center justify-between gap-6 p-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center gap-5 md:flex-row">
          <img
            src={
              user.avatar.startsWith("/uploads")
                ? `${import.meta.env.VITE_API_URL || "http://localhost:5502"}${
                    user.avatar
                  }`
                : user.avatar
            }
            alt="Profile"
            className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-card"
            onError={(e) => {
              e.target.src = "/Ellipse_19.png";
            }}
          />
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-brand-ink">
              {user.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-ink-muted">
              {user.role}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/profile/edit"
          className="btn btn-secondary shrink-0"
        >
          Edit profile
        </Link>
      </section>

      {/* Basic Information */}
      <section className="panel p-6">
        <h3 className="section-title mb-5">
          Basic information
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="field-label">
              Email address
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-ink">
              {user.email || "Not provided"}
            </p>
          </div>
          <div>
            <p className="field-label">
              Phone number
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {user.phone || "Not provided"}
            </p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="panel p-6">
        <h3 className="section-title mb-5">
          Security
        </h3>

        {/* Change Password */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-line-weak py-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-ink">
              Change password
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Update your password regularly to keep your account secure.
            </p>
          </div>
          <Link to="/dashboard/settings" className="btn btn-secondary shrink-0">
            Change password
          </Link>
        </div>

        {/* Enable Passkey */}
        <div className="flex flex-col items-start justify-between gap-4 py-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-ink">
              Enable passkey login
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Use a secure passkey to sign in without a password.
            </p>
          </div>
          <span className="badge badge-neutral shrink-0">Not available</span>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="panel p-6">
        <h3 className="section-title mb-2">
          Notification preferences
        </h3>
        <p className="mb-5 text-sm text-ink-muted">
          Preference persistence is not available in the current API.
        </p>

        <div className="space-y-2">
          {[
            {
              title: "New candidate application",
              description: "Get notified when a new candidate applies to a job post.",
            },
            {
              title: "New employer sign-ups",
              description: "Get notified when a new employer joins the platform.",
            },
            {
              title: "Security alerts",
              description: "Receive alerts for suspicious activity on your account.",
            },
          ].map((preference) => (
            <label
              key={preference.title}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-weak p-3 transition-colors hover:bg-surface-raised"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-line text-brand-action focus:ring-brand-action"
                defaultChecked
                disabled
              />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {preference.title}
                </p>
                <p className="mt-0.5 text-sm leading-6 text-ink-muted">
                  {preference.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      </div>
    </div>
  );
};

export default AdminProfilePage;
