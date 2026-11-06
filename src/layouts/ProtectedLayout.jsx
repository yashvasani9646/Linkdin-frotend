import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, setUser } from "../store/slices/authSlice";
import { authService } from "../services/authService";
import Footer from "../components/Footer";
import TopBar from "../components/protectedRoute/TopBar";
import ProtectedNavBar from "../components/protectedRoute/ProtectedNavBar";
import { ROLES } from "../constants/roles";

const ProtectedLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setIsCheckingAuth(false);
        return;
      }

      if (user) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        // Handle different response structures:
        // 1. response.data.user (Standard wrapper like login)
        // 2. response.data (Direct data return)
        let userData = null;
        if (response?.data?.user) {
          userData = response.data.user;
        } else if (response?.data) {
          // Check if it looks like a user object, or assume it is the data
          userData = response.data;
        }

        if (userData) {
          dispatch(setUser(userData));
        }
        // Note: We intentionally do NOT call clearUser() here if no userData
        // The tokens in localStorage are still valid, the API response is just not as expected
      } catch {
        // Note: We intentionally do NOT call clearUser() here on API errors
        // The tokens might still be valid, the API might just be temporarily unavailable
        // The axios interceptor in api.js will handle 401 errors and token refresh
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initAuth();
  }, [dispatch, user]);

  if (isCheckingAuth) {
    return (
      <div className="loading-state min-h-screen bg-surface-page">
        <div className="loading-spinner h-12 w-12"></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/auth/signin" replace state={{ from: location }} />;
  }

  // Redirect to signup step 3 if profile is incomplete
  // Skip this check for admin users - they have full access regardless of profile status
  if (user && !user.isProfileComplete && user.role !== ROLES.ADMIN) {
    return <Navigate to="/auth/signup?step=3" replace />;
  }

  return (
    <div className="page-shell flex flex-col">
      <TopBar />

      <ProtectedNavBar />

      <main className="grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default ProtectedLayout;
