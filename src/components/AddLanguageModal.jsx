import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";

const AddLanguageModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    language: "",
    proficiency: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        language: initialData.language ?? "",
        proficiency: initialData.proficiency ?? "",
      });
    } else if (isOpen) {
      setFormData({ language: "", proficiency: "" });
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

  // Allow letters, spaces, hyphens, apostrophes, periods, commas and ampersands.
  const isValidString = (value) => /^[a-zA-Z\s'.,&-]+$/.test(value);

  const validate = () => {
    const newErrors = {};

    if (!formData.language.trim()) {
      newErrors.language = "Language is required";
    } else if (!isValidString(formData.language.trim())) {
      newErrors.language = "Language must contain only letters";
    }

    if (!formData.proficiency) {
      newErrors.proficiency = "Proficiency is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Map backend field paths such as "languages[0].proficiency" to form fields.
  const handleBackendErrors = (errorData) => {
    if (Array.isArray(errorData?.errors)) {
      const newErrors = {};

      errorData.errors.forEach((err) => {
        const fieldMatch = err.field?.match(/(\w+)$/);

        if (fieldMatch) {
          newErrors[fieldMatch[1]] = err.message;
        }
      });

      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  };

  const resetForm = () => {
    setFormData({
      language: "",
      proficiency: "",
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
          Add language
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="language" className="field-label">
              Language <span className="text-danger">*</span>
            </label>
            <input
              id="language"
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter language"
              aria-invalid={Boolean(errors.language)}
              className={`w-full px-5 py-[15px] border ${
                errors.language ? "border-danger" : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.language && (
              <p className="text-danger text-xs mt-1">{errors.language}</p>
            )}
          </div>

          <div>
            <label className="field-label">
              Proficiency <span className="text-danger">*</span>
            </label>
            <SelectField
              name="proficiency"
              value={formData.proficiency}
              onChange={handleChange}
              placeholder="Select"
              options={[
                { value: "Native", label: "Native" },
                { value: "Fluent", label: "Fluent" },
                { value: "Basic", label: "Basic" },
              ]}
              disabled={isSaving}
              error={errors.proficiency}
              wrapperClassName="mb-0"
            />
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
            Save &amp; add another
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary order-2 w-full sm:order-none sm:w-auto"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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

export default AddLanguageModal;
