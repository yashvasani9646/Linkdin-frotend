import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";

const AddJobTitlesModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [jobTitles, setJobTitles] = useState([""]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData && Array.isArray(initialData)) {
      setJobTitles(initialData.length > 0 ? initialData : [""]);
    } else if (isOpen) {
      setJobTitles([""]);
    }
    setError("");
  }, [isOpen, initialData]);

  // Regex to validate string (letters, spaces, hyphens, apostrophes only)
  const isValidString = (value) => /^[a-zA-Z\s\-'.,&]+$/.test(value);

  const handleChange = (index, value) => {
    const newTitles = [...jobTitles];
    newTitles[index] = value;
    setJobTitles(newTitles);
    if (error) setError("");
  };

  const handleAddMore = () => {
    if (jobTitles.length > 0 && jobTitles[jobTitles.length - 1].trim() === "") {
      return;
    }
    setJobTitles([...jobTitles, ""]);
  };

  const handleRemove = (index) => {
    const newTitles = jobTitles.filter((_, i) => i !== index);
    setJobTitles(newTitles.length > 0 ? newTitles : [""]);
  };

  const handleSave = async () => {
    const filteredTitles = jobTitles.filter((title) => title.trim() !== "");

    if (filteredTitles.length === 0) {
      setError("Please enter at least one job title.");
      return;
    }

    // Validate all titles are strings
    for (const title of filteredTitles) {
      if (!isValidString(title)) {
        setError("Job titles must contain only letters.");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave(filteredTitles);
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
          Add job titles
        </h2>

        <div className="space-y-2.5">
          <label className="field-label">
            What are your desired job titles?{" "}
            <span className="text-danger">*</span>
          </label>

          {jobTitles.map((title, index) => (
            <div key={index} className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={isSaving}
                placeholder="Enter title"
                className="w-full py-[15px] px-5 border border-line-weak rounded-[1px] text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition pr-10 disabled:bg-gray-100"
              />
              {jobTitles.length > 1 && (
                <button
                  onClick={() => handleRemove(index)}
                  disabled={isSaving}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-danger hover:text-danger cursor-pointer disabled:opacity-50"
                >
                  <img src="/red_cross.svg" alt="" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleAddMore}
            disabled={
              isSaving ||
              (jobTitles.length > 0 &&
                jobTitles[jobTitles.length - 1].trim() === "")
            }
            className={`text-brand-action font-bold leading-[100%] tracking-[0%] text-sm flex items-center gap-1 cursor-pointer ${
              isSaving ||
              (jobTitles.length > 0 &&
                jobTitles[jobTitles.length - 1].trim() === "")
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            + Add another
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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

export default AddJobTitlesModal;
