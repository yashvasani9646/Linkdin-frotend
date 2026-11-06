import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye } from "../../icons/Eye";
import { Pencil } from "../../icons/Pencil";
import { XCircleGray } from "../../icons/XCircleGray";
import AdminCreateJobModal from "../../components/AdminCreateJobModal";
import AdminCreateUserModal from "../../components/AdminCreateUserModal";
import AdminEditUserModal from "../../components/AdminEditUserModal";
import AdminDeleteUserModal from "../../components/AdminDeleteUserModal";
import AdminUserDetailsModal from "../../components/AdminUserDetailsModal";
import api from "../../services/api";
import { API_CONFIG } from "../../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../utils/errorHandler";

const AdminOverviewPage = () => {
  const [activeRowId, setActiveRowId] = React.useState(null);
  const [isJobModalOpen, setIsJobModalOpen] = React.useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [stats, setStats] = React.useState({
    users: { total: 0, jobSeekers: 0, recruiters: 0 },
    jobs: { total: 0, active: 0 },
    applications: { total: 0, pending: 0 },
  });
  const [isLoadingStats, setIsLoadingStats] = React.useState(true);
  const [modalType, setModalType] = React.useState(null);
  const [selectedUserForModal, setSelectedUserForModal] = React.useState(null);
  const navigate = useNavigate();

  // Fetch dashboard stats (shared so create/edit/delete can refresh them)
  const fetchDashboardStats = React.useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await api.get(
        API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD_STATS
      );
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error(getErrorMessage(error, "Failed to load dashboard statistics"));
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch dashboard stats on mount
  React.useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-dropdown-container")) {
        setActiveRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch latest 5 users
  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);

  const fetchLatestUsers = React.useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const response = await api.get(API_CONFIG.ENDPOINTS.ADMIN.USERS, {
        params: { page: 1, limit: 5 },
      });
      if (response?.data?.data?.users) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(getErrorMessage(error, "Failed to load recent users"));
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLatestUsers();
  }, [fetchLatestUsers]);

  // Refresh both lists after a user is created, edited, or deleted
  const refreshUsersAndStats = () => {
    fetchLatestUsers();
    fetchDashboardStats();
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleToggleAction = (id) => {
    setActiveRowId(activeRowId === id ? null : id);
  };

  // Row action handlers (same modal flow as AdminUsersPage — no duplicate logic)
  const openViewModal = (user) => {
    setSelectedUserForModal(user);
    setModalType("view");
    setActiveRowId(null);
  };
  const openEditModal = (user) => {
    setSelectedUserForModal(user);
    setModalType("edit");
    setActiveRowId(null);
  };
  const openDeleteModal = (user) => {
    setSelectedUserForModal(user);
    setModalType("delete");
    setActiveRowId(null);
  };
  const closeModal = () => {
    setModalType(null);
    setSelectedUserForModal(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Admin dashboard</h1>
        <p className="page-subtitle">
          Overview of users, job activity, and performance statistics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Stat Card 1 */}
        <div className="panel flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-3xl font-bold text-brand-ink">
              {isLoadingStats ? "..." : stats.users.total.toLocaleString()}
            </div>
            <div className="mt-1 text-sm font-medium text-ink-muted">Total users</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-tint">
            <img src="/UserCircleBlue.svg" className="h-6 w-6" alt="" />
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="panel flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-3xl font-bold text-brand-ink">
              {isLoadingStats ? "..." : stats.jobs.total.toLocaleString()}
            </div>
            <div className="mt-1 text-sm font-medium text-ink-muted">Total jobs posted</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-soft">
            <img src="/briefcase-duotoneOrange.svg" className="h-6 w-6" alt="" />
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="panel flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-3xl font-bold text-brand-ink">
              {isLoadingStats ? "..." : stats.jobs.active.toLocaleString()}
            </div>
            <div className="mt-1 text-sm font-medium text-ink-muted">Active jobs</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-soft">
            <img src="/CheckCircle.svg" className="h-6 w-6" alt="" />
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="panel flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-3xl font-bold text-brand-ink">
              {isLoadingStats
                ? "..."
                : stats.applications.pending.toLocaleString()}
            </div>
            <div className="mt-1 text-sm font-medium text-ink-muted">New applications</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger-soft">
            <img src="/Note.svg" className="h-6 w-6" alt="" />
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Recent users</h2>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 text-sm font-semibold text-brand-action transition-colors hover:text-brand-ink"
          >
            View all <img src="/fi_arrow-right.svg" alt="" />
          </Link>
        </div>

        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                  >
                    Joined On
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%] text-right"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {isLoadingUsers ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-8 text-center text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-8 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id || user._id}
                      className="transition-colors hover:bg-brand-tint/20"
                    >
                      <td className="px-5 py-[18px] text-base leading-6 -tracking-[2%] font-medium text-secondary whitespace-nowrap">
                        {user.fullName || `${user.firstName} ${user.lastName}`}
                      </td>
                      <td className="px-5 py-[18px] text-base leading-6 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                        {user.role || "Job Seeker"}
                      </td>
                      <td className="px-5 py-[18px] text-sm leading-6 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                        {user.isActive ? (
                          <span className="badge badge-success">
                            <img src="/CheckCircleStatus.svg" alt="" />
                            Active
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            <img src="/XCircle.svg" className="h-4 w-4" alt="" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-[18px] text-sm leading-6 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-[18px] leading-6 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap text-right relative group action-dropdown-container">
                        <button
                          className={`hover:text-brand-ink cursor-pointer ${
                            activeRowId === (user.id || user._id)
                              ? "text-brand-action"
                              : "text-ink-muted"
                          }`}
                          onClick={() =>
                            handleToggleAction(user.id || user._id)
                          }
                        >
                          <img
                            src="/DotsThreeVertical.svg"
                            className="w-6 h-6 opacity-60"
                            alt=""
                          />
                        </button>
                        {activeRowId === (user.id || user._id) && (
                          <div className="absolute right-5 top-2 mt-8 py-3 w-[216px] bg-white rounded-lg shadow-dropdown border border-line-weak z-20 text-left">
                            <button
                              onClick={() => openViewModal(user)}
                              className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint cursor-pointer flex items-center gap-2"
                            >
                              <Eye />
                              View User
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint cursor-pointer flex items-center gap-2"
                            >
                              <Pencil />
                              Edit User
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint cursor-pointer flex items-center gap-2"
                            >
                              <XCircleGray />
                              Delete User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg  border border-line-weak">
        <h2 className="text-[20px] font-medium text-secondary leading-6 -tracking-[2%] mb-[25px]">
          Quick Actions
        </h2>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="px-5 py-[14px] cursor-pointer bg-brand-action hover:bg-brand-action-hover text-white text-sm font-medium rounded-sm leading-[18px] tracking-[0%] transition"
          >
            + Create Job
          </button>
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="px-5 py-[14px] cursor-pointer bg-brand-action hover:bg-brand-action-hover text-white text-sm font-medium rounded-sm leading-[18px] tracking-[0%] transition"
          >
            + Add User
          </button>
          <button
            onClick={() => navigate("/admin/notifications")}
            className="px-5 py-[14px] cursor-pointer bg-brand-action hover:bg-brand-action-hover text-white text-sm font-medium rounded-sm leading-[18px] tracking-[0%] transition"
          >
            Send Notification
          </button>
        </div>
      </div>

      {/* Modals */}
      <AdminCreateJobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        // onPublish={(data) => console.log("Published Job:", data)}
        // onSaveDraft={(data) => console.log("Saved Draft:", data)}
      />

      <AdminCreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onUserCreated={refreshUsersAndStats}
      />

      {/* User row actions — reuses the same modals as AdminUsersPage */}
      <AdminUserDetailsModal
        isOpen={modalType === "view"}
        onClose={closeModal}
        userId={selectedUserForModal?.id || selectedUserForModal?._id}
      />
      <AdminEditUserModal
        isOpen={modalType === "edit"}
        onClose={closeModal}
        userId={selectedUserForModal?.id || selectedUserForModal?._id}
        onUserUpdated={refreshUsersAndStats}
      />
      <AdminDeleteUserModal
        isOpen={modalType === "delete"}
        onClose={closeModal}
        userId={selectedUserForModal?.id || selectedUserForModal?._id}
        userName={selectedUserForModal?.fullName || selectedUserForModal?.name}
        onUserDeleted={refreshUsersAndStats}
      />
    </div>
  );
};

export default AdminOverviewPage;
