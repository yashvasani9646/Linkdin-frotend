import React, { useState } from "react";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";
import { Eye } from "../icons/Eye";
import { EyeSlash } from "../icons/EyeSlash";
import api from "../services/api";
import { API_CONFIG } from "../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import { ROLES } from "../constants/roles";

const AdminCreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "",
    isActive: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal closes
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "",
      isActive: "",
    });
    setErrors({});
    setShowPassword(false);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleCreateUser = async () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email Address is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone Number is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.isActive) newErrors.isActive = "Status is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim(),
        role: formData.role,
        isActive: formData.isActive === "Active",
      };

      const response = await api.post(
        API_CONFIG.ENDPOINTS.ADMIN.USERS,
        payload
      );

      if (response?.data?.success) {
        toast.success(response.data.message || "User created successfully");
        resetForm();
        onClose();
        // Callback to refresh the users list
        if (onUserCreated) {
          onUserCreated();
        }
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(getErrorMessage(error, "Failed to create user"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card relative max-w-lg">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-brand-ink">Create user</h2>
          <button
            type="button"
            onClick={handleClose}
            className="btn-icon shrink-0"
            aria-label="Close modal"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body space-y-6">
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
                autoComplete="off"
                className={`w-full px-5 py-[15px] rounded-sm border font-medium text-sm leading-[100%] tracking[02%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action transition-colors ${
                  errors.firstName
                    ? "border-red-500 focus:border-red-500"
                    : "border-line-weak focus:border-brand-action"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
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
                autoComplete="off"
                className={`w-full px-5 py-[15px] rounded-sm border font-medium text-sm leading-[100%] tracking[02%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action transition-colors ${
                  errors.lastName
                    ? "border-red-500 focus:border-red-500"
                    : "border-line-weak focus:border-brand-action"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary mb-[5px]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              autoComplete="off"
              className={`w-full px-5 py-[15px] rounded-sm border font-medium text-sm leading-[100%] tracking[02%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action transition-colors ${
                errors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-line-weak focus:border-brand-action"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary mb-[5px]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="new-password"
                className={`w-full px-5 py-[15px] rounded-sm border font-medium text-sm leading-[100%] tracking[02%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action transition-colors ${
                  errors.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-line-weak focus:border-brand-action"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <Eye size={20} /> : <EyeSlash />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm leading-[100%] tracking[0%] font-medium text-secondary mb-[5px]">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
              autoComplete="off"
              className={`w-full px-5 py-[15px] rounded-sm border font-medium text-sm leading-[100%] tracking[02%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action transition-colors ${
                errors.phoneNumber
                  ? "border-red-500 focus:border-red-500"
                  : "border-line-weak focus:border-brand-action"
              }`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
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
                placeholder="Select"
                error={errors.role}
                wrapperClassName="mb-0"
              />
            </div>
            <div>
              <SelectField
                label="Status"
                name="isActive"
                value={formData.isActive}
                onChange={handleChange}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                placeholder="Select"
                error={errors.isActive}
                wrapperClassName="mb-0"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateUser}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateUserModal;
