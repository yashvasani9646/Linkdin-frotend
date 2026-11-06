import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";

const AddWorkExperienceModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({ jobTitle: "", companyName: "" });
    }
    setErrors({});
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Regex to validate string (letters, spaces, hyphens, apostrophes only)
  const isValidString = (value) => /^[a-zA-Z\s\-'.,&]+$/.test(value);

  const validate = () => {
    const newErrors = {};
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    } else if (!isValidString(formData.jobTitle)) {
      newErrors.jobTitle = "Job title must contain only letters";
    }
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Parse backend errors and set them to the appropriate fields
  const handleBackendErrors = (errorData) => {
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      const newErrors = {};
      errorData.errors.forEach((err) => {
        // Extract field name from paths like "workExperiences[0].jobTitle"
        const fieldMatch = err.field.match(/\.(\w+)$/);
        if (fieldMatch) {
          newErrors[fieldMatch[1]] = err.message;
        }
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave(formData);
        if (result?.success) {
          onClose();
        } else if (result?.error) {
          handleBackendErrors(result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      jobTitle: "",
      companyName: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-lg overflow-y-auto p-5 sm:p-6">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="btn-icon absolute right-4 top-4"
          aria-label="Close modal"
        >
          <ModelCross className="h-5 w-5" />
        </button>

        <h2 className="mb-8 pr-12 text-lg font-bold text-brand-ink">
          Add most recent work experience
        </h2>

        {/* Form */}
        <div className="space-y-6">
          {/* Job Title */}
          <div>
            <label className="field-label">
              Job title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter title"
              className={`w-full h-12 px-5 border ${
                errors.jobTitle ? "border-danger" : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.jobTitle && (
              <p className="text-danger text-xs mt-1">{errors.jobTitle}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="field-label">
              Company Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter company name"
              className={`w-full h-12 px-5 border ${
                errors.companyName ? "border-danger" : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.companyName && (
              <p className="text-danger text-xs mt-1">
                {errors.companyName}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWorkExperienceModal;
