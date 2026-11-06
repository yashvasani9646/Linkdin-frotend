import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/landingPage/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { selectUser, setUser } from "../store/slices/authSlice";
import { authService } from "../services/authService";
import { ROLES } from "../constants/roles";

const PublicLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
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
        <p>Loading...</p>
      </div>
    );
  }

  const accessToken = localStorage.getItem("accessToken");
  const isLegalPage = ["/privacy", "/terms", "/accessibility"].some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  // Legal pages remain available to authenticated users
  if (!isLegalPage) {
    // If admin user is authenticated, redirect to admin dashboard
    if (accessToken && user && user.role === ROLES.ADMIN) {
      return <Navigate to="/admin" replace />;
    }

    // If authenticated but profile is incomplete, redirect to signup step 3
    // Skip this check for admin users (handled above)
    if (accessToken && user && !user.isProfileComplete) {
      return <Navigate to="/auth/signup?step=3" replace />;
    }

    if (accessToken && user && user.isProfileComplete) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="page-shell flex flex-col">
      <Navbar />
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
