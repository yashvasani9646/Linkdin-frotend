import { useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../utils/errorHandler";

const SignUpStep2 = ({
  formData,
  onOtpChange,
  onSubmit,
  onBack,
  onResendCode,
  maskedEmail,
  tempToken,
}) => {
  const otpRefs = useRef([]);
  const [error, setError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if OTP is complete
  useEffect(() => {
    const isComplete = formData.otpCode.every((digit) => digit !== "");
    setIsFormValid(isComplete);
    if (isComplete) {
      setError("");
    }
  }, [formData.otpCode]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    if (value.length > 1) return;
    onOtpChange(index, value);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !formData.otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        onOtpChange(index, char);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isComplete = formData.otpCode.every((digit) => digit !== "");
    if (!isComplete) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    // Check if tempToken exists
    if (!tempToken) {
      setError("Session expired. Please register again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const otp = formData.otpCode.join("");

      // console.log("=== OTP Verification Debug ===");
      // console.log("OTP Code:", otp);
      // console.log("Temp Token:", tempToken);

      const response = await authService.verifyOtp(otp, tempToken);

      // console.log("OTP verification response:", response);

      // Display success message from API if available
      const successMessage = response?.message || response?.data?.message;
      if (successMessage) {
        toast.success(successMessage);
      }

      // After OTP verification, always proceed to step 3 for profile completion
      // The tokens are already stored by authService.verifyOtp()
      // Note: Step 2 response doesn't include isProfileComplete,
      // user must complete step 3 to set their profile
      onSubmit(e);
    } catch (error) {
      const msg = getErrorMessage(error, "Invalid OTP. Please try again.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">
          Verify your email
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">
          We sent a 6-digit verification code to{" "}
          <span className="font-semibold text-brand-ink">{maskedEmail}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* OTP Input                */}
        <div className="flex justify-center gap-2 md:gap-3 mb-2">
          {formData.otpCode.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (otpRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={index === 0 ? handleOtpPaste : undefined}
              className={`h-12 w-10 rounded-lg border text-center text-lg font-semibold outline-none transition focus:ring-2 md:w-12 ${
                error
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : "border-line focus:border-brand-action focus:ring-brand-action/20"
              }`}
            />
          ))}
        </div>
        {error ? (
          <p className="mb-3 text-center text-xs font-medium text-danger">
            {error}
          </p>
        ) : (
          <div className="mb-5" />
        )}

        <p className="mb-10 text-center text-sm text-ink-muted">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={onResendCode}
            className="font-semibold text-brand-action transition-colors hover:text-brand-action-hover"
          >
            Resend code
          </button>
        </p>

        {/* Buttons */}
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary flex-1"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="btn btn-primary flex-1 md:w-[350px]"
          >
            {isLoading ? "Verifying..." : "Continue"}
          </button>
        </div>
      </form>
    </>
  );
};

export default SignUpStep2;
