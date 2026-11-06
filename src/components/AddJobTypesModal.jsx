import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";

const JOB_TYPES = [
  "Full-time",
  "Permanent",
  "Fresher",
  "Part-time",
  "Internship",
  "Contractual / Temporary",
  "Freelance",
  "Volunteer",
];

const AddJobTypesModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData && Array.isArray(initialData)) {
        setSelectedTypes(initialData);
      } else {
        setSelectedTypes([]);
      }
      setError("");
    }
  }, [isOpen, initialData]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    if (error) setError("");
  };

  const handleSave = async () => {
    if (selectedTypes.length === 0) {
      setError("Please select at least one job type.");
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave(selectedTypes);
        if (result?.success) {
          onClose();
        } else if (result?.error) {
          const errorMessage =
            result.error?.errors?.[0]?.message ||
            result.error?.message ||
            "Failed to save";
          setError(errorMessage);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setError("");
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
          Add job types
        </h2>

        <div>
          <label className="field-label">
            What are your desired job types?{" "}
            <span className="text-danger">*</span>
          </label>
          <div className="space-y-2.5">
            {JOB_TYPES.map((type) => (
              <label
                key={type}
                className={`flex items-center gap-3 cursor-pointer group ${
                  isSaving ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    disabled={isSaving}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-primary-200 checked:border-brand-action checked:bg-brand-action transition-all disabled:cursor-not-allowed"
                  />
                  <svg
                    className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity"
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
                <span className="text-sm font-normal text-secondary/80 group-hover:text-secondary transition">
                  {type}
                </span>
              </label>
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        <div className="flex justify-end items-center mt-6 md:mt-[50px]">
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onDelete}
              disabled={isSaving}
              className="btn btn-danger order-2 sm:order-none"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="btn btn-secondary order-1 sm:order-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary order-3 col-span-2 sm:order-none"
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
    </div>
  );
};

export default AddJobTypesModal;
