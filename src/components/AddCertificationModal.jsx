import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";

const AddCertificationModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    certificationName: "",
    expiryMonth: "",
    expiryYear: "",
    doesNotExpire: false,
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({
        certificationName: "",
        expiryMonth: "",
        expiryYear: "",
        doesNotExpire: false,
      });
    }
    setErrors({});
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Regex to validate string (letters, spaces, hyphens, apostrophes only)
  const isValidString = (value) => /^[a-zA-Z\s\-'.,&]+$/.test(value);

  const validate = () => {
    const newErrors = {};
    if (!formData.certificationName.trim()) {
      newErrors.certificationName = "Certification name is required";
    } else if (!isValidString(formData.certificationName)) {
      newErrors.certificationName =
        "Certification name must contain only letters";
    }
    if (!formData.doesNotExpire) {
      if (!formData.expiryMonth)
        newErrors.expiryMonth = "Expiry month is required";
      if (!formData.expiryYear)
        newErrors.expiryYear = "Expiry year is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Parse backend errors and set them to the appropriate fields
  const handleBackendErrors = (errorData) => {
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      const newErrors = {};
      errorData.errors.forEach((err) => {
        const fieldMatch = err.field.match(/\.(\w+)$/);
        if (fieldMatch) {
          newErrors[fieldMatch[1]] = err.message;
        }
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  };

  const resetForm = () => {
    setFormData({
      certificationName: "",
      expiryMonth: "",
      expiryYear: "",
      doesNotExpire: false,
    });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave(formData);
        if (result?.success) {
          resetForm();
          onClose();
        } else if (result?.error) {
          handleBackendErrors(result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave(formData);
        if (result?.success) {
          resetForm();
        } else if (result?.error) {
          handleBackendErrors(result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
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
          Add certification
        </h2>

        {/* Form */}
        <div className="space-y-6">
          {/* Certification Name */}
          <div>
            <label className="field-label">
              Certification Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="certificationName"
              value={formData.certificationName}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter certification name"
              className={`w-full px-5 py-[15px] border ${
                errors.certificationName
                  ? "border-danger"
                  : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.certificationName && (
              <p className="text-danger text-xs mt-1">
                {errors.certificationName}
              </p>
            )}
          </div>

          {/* Expiration date */}
          <div className="mb-5">
            <label className="field-label">
              Expiration date{" "}
              {!formData.doesNotExpire && (
                <span className="text-danger">*</span>
              )}
            </label>
            <div className="flex gap-3 md:gap-6">
              {/* Month Select */}
              <div className="flex-1 min-w-0">
                <SelectField
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleChange}
                  placeholder="Month"
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1),
                    label: new Date(0, i).toLocaleString("default", {
                      month: "long",
                    }),
                  }))}
                  disabled={formData.doesNotExpire || isSaving}
                  error={errors.expiryMonth}
                  wrapperClassName="mb-0"
                />
              </div>

              {/* Year Select */}
              <div className="flex-1 min-w-0">
                <SelectField
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleChange}
                  placeholder="Year"
                  options={Array.from({ length: 20 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return { value: String(year), label: String(year) };
                  })}
                  disabled={formData.doesNotExpire || isSaving}
                  error={errors.expiryYear}
                  wrapperClassName="mb-0"
                />
              </div>
            </div>
          </div>

          {/* Does not expire Checkbox */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                name="doesNotExpire"
                checked={formData.doesNotExpire}
                onChange={handleChange}
                disabled={isSaving}
                id="doesNotExpireCert"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-line-weak checked:border-brand-action checked:bg-brand-action transition-all disabled:opacity-50"
              />
              <svg
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 3.5L4.5 7L11 0.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <label
              htmlFor="doesNotExpireCert"
              className="text-sm font-medium leading-[14px] tracking-[0%] text-secondary/80 cursor-pointer select-none"
            >
              Does not expire
            </label>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="btn btn-secondary order-1 w-full sm:order-none sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndAddAnother}
            disabled={isSaving}
            className="btn btn-secondary order-3 col-span-2 w-full sm:order-none sm:w-auto"
          >
            Save & add another
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary order-2 w-full sm:order-none sm:w-auto"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
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

export default AddCertificationModal;
