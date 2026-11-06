import React, { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";
import { Eye } from "../icons/Eye";
import { EyeSlash } from "../icons/EyeSlash";
import api from "../services/api";
import { API_CONFIG } from "../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import { ROLES } from "../constants/roles";

const AdminEditUserModal = ({ isOpen, onClose, userId, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "",
    status: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch user details when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
    // Reset form when modal closes
    if (!isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "",
        status: "",
      });
      setErrors({});
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    try {
      setIsFetching(true);
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`
      );
      if (response?.data?.success && response.data.data?.user) {
        const user = response.data.data.user;
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          password: "", // Don't populate password
          role: user.role || ROLES.JOB_SEEKER,
          status: user.isActive ? "Active" : "Inactive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast.error(getErrorMessage(error, "Failed to fetch user details"));
    } finally {
      setIsFetching(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.role) newErrors.role = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);

      // Build payload - only include password if provided
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        role: formData.role,
        isActive: formData.status === "Active",
      };

      // Only include password if user entered a new one
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const response = await api.put(
        `${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`,
        payload
      );

      if (response?.data?.success) {
        toast.success("User updated successfully");
        onClose();
        if (onUserUpdated) {
          onUserUpdated();
        }
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(getErrorMessage(error, "Failed to update user"));
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (name) =>
    `field-input ${errors[name] ? "field-input-error" : ""}`;

  return (
    <div className="modal-backdrop">
      <div className="modal-card relative max-w-lg">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-brand-ink">Edit user</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Close modal"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body space-y-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500">Loading user details...</p>
            </div>
          ) : (
            <>
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="field-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={getInputClass("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="field-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={getInputClass("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="field-label">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={getInputClass("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="field-label">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={getInputClass("phoneNumber")}
                />
              </div>

              {/* Password */}
              <div>
                <label className="field-label">
                  Password{" "}
                  <span className="text-gray-400 font-normal">
                    (leave blank to keep current)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className={getInputClass("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeSlash />}
                  </button>
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={[
                    { value: ROLES.ADMIN, label: "Admin" },
                    { value: ROLES.JOB_SEEKER, label: "Job Seeker" },
                    { value: ROLES.RECRUITER, label: "Recruiter" },
                  ]}
                  error={errors.role}
                  wrapperClassName="mb-0"
                />
                <SelectField
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                  error={errors.status}
                  wrapperClassName="mb-0"
                />
              </div>
            </>
          )}
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
            onClick={handleSubmit}
            disabled={isLoading || isFetching}
            className="btn btn-primary"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEditUserModal;
