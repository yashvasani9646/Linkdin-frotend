import { useRef, useState } from "react";

const ForgotPasswordStep2 = ({
  otp,
  onOtpChange,
  onSubmit,
  onBack,
  onResendCode,
  maskedEmail,
}) => {
  const otpRefs = useRef([]);
  const [error, setError] = useState("");
  const isFormValid = otp.every((digit) => digit !== "");

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
    if (e.key === "Backspace" && !otp[index] && index > 0) {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const isComplete = otp.every((digit) => digit !== "");
    if (!isComplete) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    onSubmit(e);
  };

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-medium leading-8 md:leading-10 -tracking-[0.2px] text-secondary">
          Verify Code
        </h1>
        <p className="text-paragraph text-base font-normal -tracking-[0.2px]">
          We Sent A Code To{" "}
          <span className="font-semibold text-secondary">{maskedEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* OTP Input */}
        <div className="flex justify-center gap-2 md:gap-3 mb-2">
          {otp.map((digit, index) => (
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
              className={`w-9 h-10 md:w-12 md:h-12 text-center text-base md:text-lg font-medium border rounded-sm focus:ring-2 outline-none transition ${
                error
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-line-weak focus:ring-primary-500 focus:border-primary-500"
              }`}
            />
          ))}
        </div>
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        {!error && <div className="mb-5" />}

        {/* Resend Link */}
        <p className="text-base font-normal -tracking-[0.2px] text-paragraph mb-10">
          Didn't Receive The Email?{" "}
          <button
            type="button"
            onClick={onResendCode}
            className="text-primary hover:text-primary-700 cursor-pointer"
          >
            Click To Resend
          </button>
        </p>

        {/* Buttons */}
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3.5 bg-surface text-secondary font-medium rounded-sm hover:bg-gray-200 transition cursor-pointer text-sm leading-[18px] -tracking-[0.2px]"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-6 py-3.5 flex-1 md:w-[350px] font-medium rounded-sm transition text-sm leading-[18px] -tracking-[0.2px] ${
              isFormValid
                ? "bg-primary text-white hover:bg-primary-700 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Verify OTP
          </button>
        </div>
      </form>
    </>
  );
};

export default ForgotPasswordStep2;
