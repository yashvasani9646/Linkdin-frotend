import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";

const AddEducationModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    levelOfEducation: "",
    fieldOfStudy: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({ levelOfEducation: "", fieldOfStudy: "" });
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

  const validate = () => {
    const newErrors = {};
    if (!formData.levelOfEducation.trim())
      newErrors.levelOfEducation = "Level of education is required";
    if (!formData.fieldOfStudy.trim())
      newErrors.fieldOfStudy = "Field of study is required";
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

  const handleSaveAndAddAnother = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave(formData);
        if (result?.success) {
          setFormData({
            levelOfEducation: "",
            fieldOfStudy: "",
          });
          setErrors({});
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
      levelOfEducation: "",
      fieldOfStudy: "",
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
          Add education
        </h2>

        {/* Form */}
        <div className="space-y-6">
          {/* Level of Education */}
          <div>
            <label className="field-label">
              Level of education <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="levelOfEducation"
              value={formData.levelOfEducation}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter education"
              className={`w-full px-5 py-[15px] border ${
                errors.levelOfEducation
                  ? "border-danger"
                  : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.levelOfEducation && (
              <p className="text-danger text-xs mt-1">
                {errors.levelOfEducation}
              </p>
            )}
          </div>

          {/* Field of Study */}
          <div>
            <label className="field-label">
              Field of Study <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter study"
              className={`w-full px-5 py-[15px] border ${
                errors.fieldOfStudy ? "border-danger" : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.fieldOfStudy && (
              <p className="text-danger text-xs mt-1">
                {errors.fieldOfStudy}
              </p>
            )}
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

export default AddEducationModal;
