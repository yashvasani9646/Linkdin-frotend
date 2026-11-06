import React, { useState, useEffect } from "react";
import { Eye } from "../../icons/Eye";
import { Pencil } from "../../icons/Pencil";
import { XCircleGray } from "../../icons/XCircleGray";
import AdminCreateUserModal from "../../components/AdminCreateUserModal";
import AdminEditUserModal from "../../components/AdminEditUserModal";
import AdminDeleteUserModal from "../../components/AdminDeleteUserModal";
import AdminUserDetailsModal from "../../components/AdminUserDetailsModal";
import api from "../../services/api";
import { API_CONFIG } from "../../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../utils/errorHandler";

const AdminUsersPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeRowId, setActiveRowId] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setPagination] = useState({
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Fetch users from API
  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await api.get(API_CONFIG.ENDPOINTS.ADMIN.USERS, {
        params: { page, limit: 10 },
      });
      if (response?.data?.data) {
        setUsers(response.data.data.users || []);
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.totalPages || 1);
          setPagination(response.data.data.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(getErrorMessage(error, "Failed to load users"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openCreateModal = () => setModalType("create");
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
  const openViewModal = (user) => {
    setSelectedUserForModal(user);
    setModalType("view");
    setActiveRowId(null);
  };
  const closeModal = () => {
    setModalType(null);
    setSelectedUserForModal(null);
  };

  // Toggle user status (Active/Inactive)
  const handleToggleUserStatus = async (user) => {
    const userId = user.id || user._id;
    const newStatus = !user.isActive;

    try {
      const response = await api.patch(
        `${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}/status`,
        { isActive: newStatus }
      );

      if (response?.data?.success) {
        toast.success(`User marked as ${newStatus ? "Active" : "Inactive"}`);
        // Refresh the users list
        fetchUsers(currentPage);
        setActiveRowId(null);
      }
    } catch (error) {
      console.error("Failed to change user status:", error);
      toast.error(getErrorMessage(error, "Failed to change user status"));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-dropdown-container")) {
        setActiveRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleAction = (id) => {
    setActiveRowId(activeRowId === id ? null : id);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((u) => u.id || u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-10 h-10 cursor-pointer flex items-center justify-center rounded-full text-sm font-medium transition ${
            currentPage === i
              ? "bg-brand-action text-white"
              : "bg-white text-ink-muted hover:bg-gray-50"
          }`}
        >
          {i.toString().padStart(2, "0")}
        </button>
      );
    }
    return pages;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Users management</h1>
          <p className="page-subtitle">
            Add, view, edit, and delete users registered on the platform.
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-3 md:w-auto">
          <button className="btn btn-secondary">
            Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            + Add user
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[1000px]">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%] w-[20px]"
                >
                  <input
                    type="checkbox"
                    className="w-4 align-middle h-4 cursor-pointer rounded border border-brand-action text-brand-action focus:ring-brand-action"
                    onChange={handleSelectAll}
                    checked={
                      users.length > 0 && selectedUsers.length === users.length
                    }
                  />
                </th>
                <th
                  scope="col"
                  className="pr-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Email
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id || user._id}
                    className="transition-colors hover:bg-brand-tint/20"
                  >
                    <td className="px-5 py-[18px]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 align-middle cursor-pointer rounded border border-brand-action text-brand-action focus:ring-brand-action"
                        checked={selectedUsers.includes(user.id || user._id)}
                        onChange={() => handleSelectUser(user.id || user._id)}
                      />
                    </td>
                    <td className="pr-5 py-[18px] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-base leading-6 -tracking-[2%] font-medium text-secondary">
                          {user.fullName ||
                            `${user.firstName} ${user.lastName}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {user.role || "Job Seeker"}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[1%] font-medium text-ink-muted whitespace-nowrap">
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
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-[18px] leading-6 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap text-right relative group action-dropdown-container">
                      <button
                        className={`hover:text-gray-600 cursor-pointer ${
                          activeRowId === (user.id || user._id)
                            ? "text-gray-600"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleToggleAction(user.id || user._id)}
                      >
                        <img
                          src="/DotsThreeVertical.svg"
                          className="w-6 h-6 opacity-60"
                          alt=""
                        />
                      </button>
                      {activeRowId === (user.id || user._id) && (
                        <div
                          className={`absolute right-5 w-[216px] bg-white rounded-lg shadow-xl border border-gray-100 z-20 text-left py-3 ${
                            index >= users.length - 2
                              ? "bottom-12"
                              : "top-2 mt-8"
                          }`}
                        >
                          <button
                            onClick={() => openViewModal(user)}
                            className="w-full text-left px-4 cursor-pointer py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint flex items-center gap-2"
                          >
                            <Eye />
                            View User
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-full text-left px-4 cursor-pointer py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint flex items-center gap-2"
                          >
                            <Pencil />
                            Edit User
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`w-full text-left px-4 cursor-pointer py-2.5 text-xs leading-5 font-normal -tracking-[2%] flex items-center gap-2 ${
                              user.isActive
                                ? " hover:text-danger hover:bg-red-50"
                                : " hover:text-success hover:bg-green-50"
                            }`}
                          >
                            <Pencil />
                            {user.isActive
                              ? "Deactivate User"
                              : "Activate User"}
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="w-full text-left px-4 cursor-pointer py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-danger hover:bg-brand-tint flex items-center gap-2"
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

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-10">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-brand-tint transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <img
            src="/arrow-right.svg"
            className="rotate-180"
            alt="Previous"
          />
        </button>
        {renderPagination()}
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-brand-tint cursor-pointer transition disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <img src="/arrow-right.svg" alt="Next" />
        </button>
      </div>

      {/* Modals */}
      <AdminCreateUserModal
        isOpen={modalType === "create"}
        onClose={closeModal}
        onUserCreated={() => fetchUsers(currentPage)}
      />
      <AdminEditUserModal
        isOpen={modalType === "edit"}
        onClose={closeModal}
        userId={selectedUserForModal?.id || selectedUserForModal?._id}
        onUserUpdated={() => fetchUsers(currentPage)}
      />
      <AdminDeleteUserModal
        isOpen={modalType === "delete"}
        onClose={closeModal}
        userId={selectedUserForModal?.id || selectedUserForModal?._id}
        userName={selectedUserForModal?.fullName || selectedUserForModal?.name}
        onUserDeleted={() => fetchUsers(currentPage)}
      />
      <AdminUserDetailsModal
        isOpen={modalType === "view"}
        onClose={closeModal}
        userId={selectedUserForModal?.id || selectedUserForModal?._id}
      />
    </div>
  );
};

export default AdminUsersPage;
