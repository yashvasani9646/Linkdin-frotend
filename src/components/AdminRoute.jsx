import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import { setUser } from "../store/slices/authSlice";
import { ROLES } from "../constants/roles";

/**
 * AdminRoute - Strict protective routing for /admin and its child routes.
 *
 * Verifies with the backend 'me' API (/api/v1/auth/UserDetails) using the stored JWT token.
 * Only users verified with role === 'admin' can access the admin panel.
 * Non-admin users are rejected and redirected to their previous/main page with a notification.
 */
const AdminRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const reduxUser = useSelector((state) => state.auth.user);

  // Status can be: "checking" | "authorized" | "forbidden" | "unauthenticated"
  const [authStatus, setAuthStatus] = useState("checking");
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        if (isMounted) {
          setAuthStatus("unauthenticated");
        }
        return;
      }

      try {
        // ALWAYS call the server API to ensure token & role are authentic
        const response = await authService.getCurrentUser();
        const userData = response?.data?.user || response?.data;

        if (!isMounted) return;

        if (userData) {
          // Keep Redux updated with the latest user data
          dispatch(setUser(userData));

          if (userData.role === ROLES.ADMIN) {
            setAuthStatus("authorized");
          } else {
            toast.error("Access denied. Admin privileges are required to view this page.");
            // Set safe destination for non-admin user
            const safePath = userData.isProfileComplete ? "/dashboard" : "/auth/signup?step=3";
            setRedirectPath(safePath);
            setAuthStatus("forbidden");
          }
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        console.error("[AdminRoute] Error verifying admin privileges:", error);
        if (!isMounted) return;

        if (error.response?.status === 401) {
          toast.error("Session expired. Please sign in again.");
          setAuthStatus("unauthenticated");
        } else if (reduxUser?.role === ROLES.ADMIN) {
          // Transient network error, but Redux already has verified admin role
          setAuthStatus("authorized");
        } else {
          toast.error("Unable to verify administrator permissions. Access denied.");
          setRedirectPath("/dashboard");
          setAuthStatus("forbidden");
        }
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [dispatch, reduxUser?.role]);

  // Loading state while verifying token with backend
  if (authStatus === "checking") {
    return (
      <div className="loading-state min-h-screen bg-surface-page">
        <div className="loading-spinner h-12 w-12"></div>
        <p>Verifying administrator privileges...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login page
  if (authStatus === "unauthenticated") {
    return <Navigate to="/auth/signin" replace state={{ from: location }} />;
  }

  // Logged in, but NOT an admin -> redirect to main/dashboard page
  if (authStatus === "forbidden") {
    return <Navigate to={redirectPath} replace />;
  }

  // Verified admin user -> render admin routes
  return <Outlet />;
};

export default AdminRoute;
