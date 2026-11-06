import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, setUser } from "../store/slices/authSlice";
import { authService } from "../services/authService";
import { ROLES } from "../constants/roles";

/**
 * PrivateRoute - Wrapper for auth routes (signin, signup, forgot password)
 * Redirects to dashboard if user is already authenticated with complete profile
 * Redirects to signup step 3 if authenticated but profile incomplete
 */
const PrivateRoute = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        // No token, user is not authenticated
        setIsChecking(false);
        return;
      }

      // If we already have user data in Redux, use it (no API call needed)
      if (user) {
        setIsChecking(false);
        return;
      }

      // User has token but no Redux data, fetch from API and store in Redux
      try {
        const response = await authService.getCurrentUser();
        const userData = response?.data?.user || response?.data;

        if (userData) {
          dispatch(setUser(userData));
        }
      } catch {
        // API error - token might still be valid, don't clear anything
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [dispatch, user]);

  // Show loading while checking auth status
  if (isChecking) {
    return (
      <div className="loading-state min-h-screen bg-surface-page">
        <div className="loading-spinner h-12 w-12"></div>
        <p>Checking your session...</p>
      </div>
    );
  }

  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    // Admin users should always go to admin dashboard
    if (user?.role === ROLES.ADMIN) {
      return <Navigate to="/admin" replace />;
    }

    if (user?.isProfileComplete) {
      // Fully authenticated with complete profile, redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }

    // Authenticated but profile incomplete, redirect to step 3
    // BUT allow access to signup page itself (for step 3)
    if (!location.pathname.includes("/signup")) {
      return <Navigate to="/auth/signup?step=3" replace />;
    }
  }

  return <Outlet />;
};

export default PrivateRoute;
