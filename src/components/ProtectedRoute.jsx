import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { authService } from "../services/authService";
import { setUser } from "../store/slices/authSlice";
import { ROLES } from "../constants/roles";

const ProtectedRoute = ({ adminOnly = false }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setIsChecking(false);
        return;
      }

      // If we already have user data in Redux, use it
      if (user) {
        setIsChecking(false);
        return;
      }

      // Fetch user from API
      try {
        const response = await authService.getCurrentUser();
        const userData = response?.data?.user || response?.data;
        if (userData) {
          dispatch(setUser(userData));
        }
      } catch {
        // API error - token might still be valid
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

  // If not authenticated, redirect to signin
  if (!accessToken) {
    return <Navigate to="/auth/signin" replace />;
  }

  // If admin-only route but user is not admin, redirect to dashboard
  if (adminOnly && user && user.role !== ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated but profile incomplete, redirect to signup step 3
  // Skip this check for admin users - they have full access regardless of profile status
  if (user && !user.isProfileComplete && user.role !== ROLES.ADMIN) {
    return <Navigate to="/auth/signup?step=3" replace />;
  }

  // User is authenticated and profile is complete, allow access
  return <Outlet />;
};

export default ProtectedRoute;
