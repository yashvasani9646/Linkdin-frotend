import React, { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import api from "../services/api";
import { API_CONFIG } from "../config/api.config";
import { getErrorMessage } from "../utils/errorHandler";

const AdminUserDetailsModal = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user details when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setUser(null);
      setError(null);
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`
      );
      if (response?.data?.success && response.data.data?.user) {
        setUser(response.data.data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError(getErrorMessage(err, "Failed to fetch user details"));
    } finally {
      setIsLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-lg">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-brand-ink">User Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Close modal"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500">Loading user details...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-red-500">{error}</p>
            </div>
          ) : user ? (
            <>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Full Name :
                </span>
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Email Address :
                </span>
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  {user.email || "-"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Phone :
                </span>
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  {user.phoneNumber || "-"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Role :
                </span>
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  {user.role || "-"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Status :
                </span>
                <span
                  className={`block text-sm leading-[100%] tracking[0%] font-medium ${
                    user.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Verified :
                </span>
                <span
                  className={`block text-sm leading-[100%] tracking[0%] font-medium ${
                    user.isVerified ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {user.isVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Profile :
                </span>
                <span
                  className={`block text-sm leading-[100%] tracking[0%] font-medium ${
                    user.isProfileComplete
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {user.isProfileComplete ? "Complete" : "Incomplete"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  Created on :
                </span>
                <span className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary ">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500">No user data available</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailsModal;
