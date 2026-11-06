import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";

const SHIFTS = [
  "Day shift",
  "Morning shift",
  "Rotational shift",
  "Night shift",
  "Evening shift",
  "Fixed shift",
  "US shift",
  "UK shift",
];

const DAYS = ["Monday to Friday", "Weekend availability", "Weekend only"];

const AddWorkScheduleModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedShifts(initialData.shifts || []);
        setSelectedDays(initialData.days || []);
      } else {
        setSelectedShifts([]);
        setSelectedDays([]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const toggleShift = (shift) => {
    setSelectedShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
    if (errors.shifts) setErrors((prev) => ({ ...prev, shifts: "" }));
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    if (errors.days) setErrors((prev) => ({ ...prev, days: "" }));
  };

  const handleSave = async () => {
    const newErrors = {};

    if (selectedShifts.length === 0) {
      newErrors.shifts = "Please select at least one shift.";
    }

    if (selectedDays.length === 0) {
      newErrors.days = "Please select at least one day.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave({
          shifts: selectedShifts,
          days: selectedDays,
        });
        if (result?.success) {
          onClose();
        } else if (result?.error) {
          const errorMessage =
            result.error?.errors?.[0]?.message ||
            result.error?.message ||
            "Failed to save";
          setErrors({ general: errorMessage });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-2xl overflow-y-auto p-5 sm:p-6">
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
          Add work schedule
        </h2>

        <div>
          <label className="field-label">
            What are your desired schedules?{" "}
            <span className="text-danger">*</span>
          </label>

          {errors.general && (
            <p className="text-red-500 text-sm mb-4">{errors.general}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
            {/* Shifts Column */}
            <div>
              <h3 className="text-sm font-medium text-secondary mb-4">
                Shifts
              </h3>
              <div className="space-y-2.5">
                {SHIFTS.map((shift) => (
                  <label
                    key={shift}
                    className={`flex items-center gap-3 cursor-pointer group ${
                      isSaving ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(shift)}
                        onChange={() => toggleShift(shift)}
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
                      {shift}
                    </span>
                  </label>
                ))}
              </div>
              {errors.shifts && (
                <p className="text-red-500 text-sm mt-2">{errors.shifts}</p>
              )}
            </div>

            {/* Days Column */}
            <div>
              <h3 className="text-sm font-medium text-secondary mb-4">Days</h3>
              <div className="space-y-2.5">
                {DAYS.map((day) => (
                  <label
                    key={day}
                    className={`flex items-center gap-3 cursor-pointer group ${
                      isSaving ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() => toggleDay(day)}
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
                      {day}
                    </span>
                  </label>
                ))}
              </div>
              {errors.days && (
                <p className="text-red-500 text-sm mt-2">{errors.days}</p>
              )}
            </div>
          </div>
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

export default AddWorkScheduleModal;
