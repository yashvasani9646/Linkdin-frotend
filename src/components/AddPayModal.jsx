import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";

const PAY_PERIODS = [
  "Per hour",
  "Per annum",
  "Per month",
  "Per week",
  "Per day",
];

const AddPayModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [basePay, setBasePay] = useState("");
  const [payPeriod, setPayPeriod] = useState("Per hour");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setBasePay(initialData.basePay || "");
        setPayPeriod(initialData.payPeriod || "Per hour");
      } else {
        setBasePay("");
        setPayPeriod("Per hour");
      }
      setError("");
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!basePay || parseFloat(basePay) === 0) {
      setError("Please enter a valid base pay amount.");
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        const result = await onSave({ basePay, payPeriod });
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
          Add pay
        </h2>

        <div className="space-y-6">
          {/* Minimum base pay */}
          <div>
            <label className="field-label">
              Minimum base pay <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={basePay}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setBasePay(value);
                  if (error) setError("");
                }
              }}
              disabled={isSaving}
              placeholder="Enter Minimum base pay"
              className={`w-full py-[15px] px-5 border ${
                error ? "border-danger" : "border-line-weak"
              } rounded-sm text-sm font-medium leading-[100%] tracking-[0%] text-secondary placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand-action focus:border-brand-action transition disabled:bg-gray-100`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          {/* Pay period */}
          <div>
            <label className="field-label">
              Pay period <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PAY_PERIODS.map((period) => (
                <button
                  key={period}
                  onClick={() => setPayPeriod(period)}
                  disabled={isSaving}
                  className={`px-[10px] py-[6px] rounded-full text-sm font-normal leading-3.5 cursor-pointer tracking-[0%] transition whitespace-nowrap disabled:opacity-50 ${
                    payPeriod === period
                      ? "bg-brand-tint text-brand-action border border-brand-action"
                      : "bg-surface text-ink-muted border border-transparent hover:bg-line-weak"
                  }`}
                >
                  {period}
                </button>
              ))}
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

export default AddPayModal;
