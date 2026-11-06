import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import PrivateRoute from "../components/PrivateRoute";
import AdminRoute from "../components/AdminRoute";

const PublicLayout = lazy(() => import("../layouts/PublicLayout"));
const AuthLayout = lazy(() => import("../layouts/AuthLayout"));
const ProtectedLayout = lazy(() => import("../layouts/ProtectedLayout"));
const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));

const LandingPage = lazy(() => import("../pages/LandingPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const SignInPage = lazy(() => import("../pages/SignInPage"));
const SignUpPage = lazy(() => import("../pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const MySavedJobsPage = lazy(() => import("../pages/MySavedJobsPage"));
const MyPostedJobsPage = lazy(() => import("../pages/MyPostedJobsPage"));
const JobApplicationsPage = lazy(() => import("../pages/JobApplicationsPage"));
const MessagePage = lazy(() => import("../pages/MessagePage"));
const NotificationPage = lazy(() => import("../pages/NotificationPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const EditProfilePage = lazy(() => import("../pages/EditProfilePage"));
const QualificationsPage = lazy(() => import("../pages/QualificationsPage"));
const JobPreferencesPage = lazy(() => import("../pages/JobPreferencesPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));
const TermsOfUsePage = lazy(() => import("../pages/TermsOfUsePage"));
const AccessibilityPage = lazy(() => import("../pages/AccessibilityPage"));

const AdminOverviewPage = lazy(() => import("../pages/admin/AdminOverviewPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminJobsPage = lazy(() => import("../pages/admin/AdminJobsPage"));
const AdminNotificationsPage = lazy(
  () => import("../pages/admin/AdminNotificationsPage")
);
const AdminBrandingPage = lazy(() => import("../pages/admin/AdminBrandingPage"));
const AdminProfilePage = lazy(() => import("../pages/admin/AdminProfilePage"));

const routeLoadingFallback = (
  <div className="loading-state min-h-[50vh] py-24" role="status">
    <div className="loading-spinner"></div>
    <p>Loading page...</p>
  </div>
);

const withSuspense = (element) => (
  <Suspense fallback={routeLoadingFallback}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<PublicLayout />),
    children: [
      {
        index: true,
        element: withSuspense(<LandingPage />),
      },
      {
        path: "privacy",
        element: withSuspense(<PrivacyPolicyPage />),
      },
      {
        path: "terms",
        element: withSuspense(<TermsOfUsePage />),
      },
      {
        path: "accessibility",
        element: withSuspense(<AccessibilityPage />),
      },
    ],
  },
  {
    path: "/auth",
    element: <PrivateRoute />,
    children: [
      {
        element: withSuspense(<AuthLayout />),
        children: [
          {
            path: "signin",
            element: withSuspense(<SignInPage />),
          },
          {
            path: "signup",
            element: withSuspense(<SignUpPage />),
          },
          {
            path: "forgot-password",
            element: withSuspense(<ForgotPasswordPage />),
          },
        ],
      },
    ],
  },
  {
    path: "/signin",
    element: <Navigate to="/auth/signin" replace />,
  },
  {
    path: "/signup",
    element: <Navigate to="/auth/signup" replace />,
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: withSuspense(<AdminDashboardPage />),
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: withSuspense(<AdminOverviewPage />),
          },
          {
            path: "users",
            element: withSuspense(<AdminUsersPage />),
          },
          {
            path: "jobs",
            element: withSuspense(<AdminJobsPage />),
          },
          {
            path: "notifications",
            element: withSuspense(<AdminNotificationsPage />),
          },
          {
            path: "branding",
            element: withSuspense(<AdminBrandingPage />),
          },
          {
            path: "profile",
            element: withSuspense(<AdminProfilePage />),
          },
        ],
      },
    ],
  },
  {
    path: "/dashboard",
    element: withSuspense(<ProtectedLayout />),
    children: [
      {
        index: true,
        element: withSuspense(<DashboardPage />),
      },
      {
        path: "my-saved-job",
        element: withSuspense(<MySavedJobsPage />),
      },
      {
        path: "my-posted-jobs",
        element: withSuspense(<MyPostedJobsPage />),
      },
      {
        path: "my-posted-jobs/:jobId/applications",
        element: withSuspense(<JobApplicationsPage />),
      },
      {
        path: "message",
        element: withSuspense(<MessagePage />),
      },
      {
        path: "notification",
        element: withSuspense(<NotificationPage />),
      },
      {
        path: "profile",
        element: withSuspense(<ProfilePage />),
      },
      {
        path: "profile/edit",
        element: withSuspense(<EditProfilePage />),
      },
      {
        path: "profile/qualifications",
        element: withSuspense(<QualificationsPage />),
      },
      {
        path: "profile/job-preferences",
        element: withSuspense(<JobPreferencesPage />),
      },
      {
        path: "settings",
        element: withSuspense(<SettingsPage />),
      },
    ],
  },
  {
    path: "/jobs",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/applications",
    element: <Navigate to="/dashboard/my-saved-job?tab=applied" replace />,
  },
  {
    path: "/profile",
    element: <Navigate to="/dashboard/profile" replace />,
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />),
  },
]);
