import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";

const AddSkillModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    skill: "",
    yearsOfExperience: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        skill: initialData.skill ?? "",
        yearsOfExperience: initialData.yearsOfExperience ?? "",
      });
    } else if (isOpen) {
      setFormData({ skill: "", yearsOfExperience: "" });
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

  // Allow common skill names such as C++, C#, .NET, Node.js and UI/UX.
  const isValidString = (value) => /^[a-zA-Z0-9\s+#./&'()-]+$/.test(value);

  const validate = () => {
    const newErrors = {};
    const skill = formData.skill.trim();

    if (!skill) {
      newErrors.skill = "Skill is required";
    } else if (!isValidString(skill)) {
      newErrors.skill = "Skill contains unsupported characters";
    }

    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = "Years of experience is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Map backend field paths, including nested paths, to the form fields.
  const handleBackendErrors = (errorData) => {
    if (!Array.isArray(errorData?.errors)) return;

    const newErrors = {};

    errorData.errors.forEach((err) => {
      const fieldMatch = err.field?.match(/(\w+)$/);

      if (fieldMatch) {
        newErrors[fieldMatch[1]] = err.message;
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
  };

  const resetForm = () => {
    setFormData({
      skill: "",
      yearsOfExperience: "",
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
          Add skill
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="skill" className="field-label">
              Skill <span className="text-danger">*</span>
            </label>
            <input
              id="skill"
              type="text"
              name="skill"
              value={formData.skill}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Enter skill"
              aria-invalid={Boolean(errors.skill)}
              className={`w-full px-5 py-[15px] border ${
                errors.skill ? "border-danger" : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {errors.skill && (
              <p className="text-danger text-xs mt-1">{errors.skill}</p>
            )}
          </div>

          <div>
            <label className="field-label">
              Years of experience <span className="text-danger">*</span>
            </label>
            <SelectField
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              placeholder="Select"
              options={[
                { value: "0-1", label: "0-1 years" },
                { value: "1-3", label: "1-3 years" },
                { value: "3-5", label: "3-5 years" },
                { value: "5-10", label: "5-10 years" },
                { value: "10+", label: "10+ years" },
              ]}
              disabled={isSaving}
              error={errors.yearsOfExperience}
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

export default AddSkillModal;
