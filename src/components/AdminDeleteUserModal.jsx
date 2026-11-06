import React, { useState } from "react";
import { ModelCross } from "../icons/ModelCross";
import api from "../services/api";
import { API_CONFIG } from "../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";

const AdminDeleteUserModal = ({
  isOpen,
  onClose,
  userId,
  userName,
  onUserDeleted,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.delete(
        `${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`
      );

      if (response?.data?.success) {
        toast.success("User deleted successfully");
        onClose();
        if (onUserDeleted) {
          onUserDeleted();
        }
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(getErrorMessage(error, "Failed to delete user"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card relative max-w-lg">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-brand-ink">Delete User</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-icon shrink-0"
            aria-label="Close modal"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm leading-6 text-ink-muted">
            Are you sure you want to delete{" "}
            {userName ? (
              <span className="font-semibold text-brand-ink">{userName}</span>
            ) : (
              "this user"
            )}
            ? This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDeleteUserModal;
