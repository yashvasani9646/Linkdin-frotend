import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Logo from "../components/common/Logo";
import ForgotPasswordStep1 from "../components/forgotPassword/ForgotPasswordStep1";
import ForgotPasswordStep2 from "../components/forgotPassword/ForgotPasswordStep2";
import ForgotPasswordStep3 from "../components/forgotPassword/ForgotPasswordStep3";
import { authService } from "../services/authService";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempToken, setTempToken] = useState("");

  const maskEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    const maskedLocal = localPart.slice(0, 2) + "***" + localPart.slice(-2);
    return `${maskedLocal}@${domain}`;
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();

    try {
      const response = await authService.forgotPassword(email);
      // console.log("Forgot password response:", response);

      // Store tempToken
      if (response?.data?.tempToken) {
        setTempToken(response.data.tempToken);
      }

      // Display success message from API
      const successMessage =
        response?.message ||
        response?.data?.message ||
        "OTP sent to your email!";
      toast.success(successMessage);

      // Move to step 2
      setCurrentStep(2);
    } catch (error) {
      // console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    try {
      const response = await authService.verifyResetOtp(otpCode, tempToken);
      // console.log("Verify reset OTP response:", response);

      // Update tempToken with new one for password reset
      if (response?.data?.tempToken) {
        setTempToken(response.data.tempToken);
      }

      // Display success message from API
      const successMessage =
        response?.message || response?.data?.message || "OTP verified!";
      toast.success(successMessage);

      // Move to step 3
      setCurrentStep(3);
    } catch (error) {
      // console.error("OTP verification error:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Invalid OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await authService.resetPassword(newPassword, tempToken);
      // console.log("Reset password response:", response);

      // Display success message from API
      const successMessage =
        response?.message ||
        response?.data?.message ||
        "Password reset successfully!";
      toast.success(successMessage);

      // Redirect to sign in page after a brief delay
      setTimeout(() => {
        navigate("/auth/signin");
      }, 1500);
    } catch (error) {
      // console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Resend OTP - Uses forgot password endpoint for resending
  const handleResendOtp = async () => {
    try {
      // For forgot password flow, resend OTP using the same forgot-password endpoint
      const response = await authService.forgotPassword(email);

      // Update tempToken if returned
      if (response?.data?.tempToken) {
        setTempToken(response.data.tempToken);
      }

      const successMessage =
        response?.message ||
        response?.data?.message ||
        "OTP resent successfully!";
      toast.success(successMessage);
    } catch (error) {
      // console.error("Resend OTP error:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to resend OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/auth/signin");
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-6 flex justify-center">
        <Logo to="/" />
      </div>

      <div className="panel p-6 sm:p-10">
        {currentStep === 1 && (
          <ForgotPasswordStep1
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSendOtp}
            onBack={() => navigate("/auth/signin")}
          />
        )}

        {currentStep === 2 && (
          <ForgotPasswordStep2
            otp={otp}
            onOtpChange={handleOtpChange}
            onSubmit={handleVerifyOtp}
            onBack={handleBack}
            onResendCode={handleResendOtp}
            maskedEmail={maskEmail(email)}
          />
        )}

        {currentStep === 3 && (
          <ForgotPasswordStep3
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleResetPassword}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
