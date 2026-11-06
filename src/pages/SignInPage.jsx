import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import InputField from "../components/common/InputField";
import Logo from "../components/common/Logo";
import { BRAND } from "../config/brand";
import { ROLES } from "../constants/roles";
import { authService } from "../services/authService";
import { setUser, setTokens } from "../store/slices/authSlice";
import { getErrorMessage } from "../utils/errorHandler";

const SignInPage = () => {
  const [formData, setFormData] = useState(() => ({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
    rememberMe: Boolean(localStorage.getItem("rememberedEmail")),
  }));
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const routerLocation = useLocation();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response?.data?.user) {
        dispatch(setUser(response.data.user));
      }

      if (response?.data?.tokens?.accessToken) {
        const { accessToken, refreshToken } = response.data.tokens;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        dispatch(
          setTokens({
            accessToken,
            refreshToken,
          })
        );
      }

      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      const successMessage = response?.message || response?.data?.message;
      if (successMessage) {
        toast.success(successMessage);
      }

      const user = response?.data?.user;
      const requestedPath = routerLocation.state?.from;
      const safeReturnPath =
        requestedPath?.pathname &&
        requestedPath.pathname.startsWith("/") &&
        !requestedPath.pathname.startsWith("/auth")
          ? `${requestedPath.pathname}${requestedPath.search || ""}`
          : null;

      if (user?.role === ROLES.ADMIN) {
        navigate("/admin");
      } else if (!user?.isProfileComplete) {
        navigate("/auth/signup?step=3");
      } else {
        navigate(safeReturnPath || "/dashboard");
      }
    } catch (error) {
      const errorData = error.response?.data;
      const message = getErrorMessage(
        error,
        "Login failed. Please check your credentials and try again."
      );
      const errorPath = errorData?.error?.path;

      if (errorPath === "email" || errorPath === "password") {
        setErrors((prev) => ({ ...prev, [errorPath]: message }));
      } else if (message.toLowerCase().includes("not verified")) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-line-weak bg-white shadow-panel lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="hidden bg-brand-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Logo variant="white" to="/" />

          <div className="py-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
              Your next move
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white">
              A clearer path from search to offer.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Sign in to keep your saved roles, applications, and conversations
              in one place.
            </p>

            <ul className="mt-8 space-y-4 text-sm text-white/80">
              {[
                "Save and compare promising roles",
                "Track applications and interviews",
                "Message employers from one inbox",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-5 text-white/45">
            Search with context. Apply with confidence.
          </p>
        </aside>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo to="/" />
          </div>

          <p className="section-eyebrow">Welcome back</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">
            Sign in to {BRAND.name}
          </h1>
          <p className="mb-8 mt-2 text-sm leading-6 text-ink-muted">
            Pick up where you left off and keep your job search moving.
          </p>

          <form onSubmit={handleSignIn}>
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email}
            />
            <InputField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
              error={errors.password}
            />

            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <label className="group flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-line text-brand-action focus:ring-brand-action/30"
                />
                Remember my email
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm font-semibold text-brand-action transition-colors hover:text-brand-action-hover"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary min-h-12 w-full"
            >
              {isLoading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-7 border-t border-line-weak pt-6 text-center">
            <p className="text-sm text-ink-muted">
              New to {BRAND.name}?{" "}
              <Link
                to="/auth/signup"
                className="font-semibold text-brand-action transition-colors hover:text-brand-action-hover"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
