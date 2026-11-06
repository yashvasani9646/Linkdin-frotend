import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Logo from "../components/common/Logo";
import SignUpStep1 from "../components/signup/SignUpStep1";
import SignUpStep2 from "../components/signup/SignUpStep2";
import SignUpStep3 from "../components/signup/SignUpStep3";
import { authService } from "../services/authService";

const SignUpPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from sessionStorage or defaults
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = sessionStorage.getItem("signup_step");
    const urlStep = searchParams.get("step");
    return urlStep ? parseInt(urlStep) : savedStep ? parseInt(savedStep) : 1;
  });

  const [tempToken, setTempToken] = useState(() => {
    return sessionStorage.getItem("signup_tempToken") || "";
  });

  const [formData, setFormData] = useState(() => {
    const savedData = sessionStorage.getItem("signup_formData");
    return savedData
      ? JSON.parse(savedData)
      : {
          // Step 1
          firstName: "",
          lastName: "",
          phoneNumber: "",
          email: "",
          city: "",
          state: "",
          postcode: "",
          password: "",
          confirmPassword: "",
          agreeTerms: false,
          // Step 2
          otpCode: ["", "", "", "", "", ""],
          // Step 3 – profile completion
          role: "",
          companyName: "",
          yearsOfExperience: "",
          skills: [],              // skills / interests
          uploadedFile: null,
        };
  });

  // Effect to sync step with URL and validate access
  useEffect(() => {
    // Check if user has accessToken (already authenticated after OTP)
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      // User has completed step 2 (OTP verification)
      // Force them to step 3 for profile completion
      if (currentStep !== 3) {
        queueMicrotask(() => setCurrentStep(3));
        setSearchParams({ step: "3" });
        sessionStorage.setItem("signup_step", "3");
      }
      return;
    }

    // Validate step access - prevent skipping to step 2 without tempToken
    if (currentStep === 2 && !tempToken) {
      // No tempToken, redirect to step 1
      queueMicrotask(() => setCurrentStep(1));
      setSearchParams({ step: "1" });
      sessionStorage.setItem("signup_step", "1");
      return;
    }

    // Validate step access - prevent skipping to step 3 without tokens
    if (currentStep === 3 && !accessToken) {
      // No access token, redirect to step 1
      queueMicrotask(() => setCurrentStep(1));
      setSearchParams({ step: "1" });
      sessionStorage.setItem("signup_step", "1");
      return;
    }

    // Update URL params when step changes
    setSearchParams({ step: currentStep.toString() });

    // Save step to sessionStorage
    sessionStorage.setItem("signup_step", currentStep.toString());
  }, [currentStep, tempToken, setSearchParams]);

  // Effect to save formData to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("signup_formData", JSON.stringify(formData));
  }, [formData]);

  // Effect to save tempToken to sessionStorage
  useEffect(() => {
    if (tempToken) {
      sessionStorage.setItem("signup_tempToken", tempToken);
    }
  }, [tempToken]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...formData.otpCode];
    newOtp[index] = value;
    setFormData((prev) => ({ ...prev, otpCode: newOtp }));
  };

  const handleAddSkill = (skill) => {
    const currentSkills = formData.skills || [];
    if (!currentSkills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
    }));
  };

  const handleFileChange = (file) => {
    setFormData((prev) => ({ ...prev, uploadedFile: file }));
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    const maskedLocal = localPart.slice(0, 2) + "***" + localPart.slice(-2);
    return `${maskedLocal}@${domain}`;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission - clear all signup data from sessionStorage
      // console.log("Form submitted:", formData);
      sessionStorage.removeItem("signup_step");
      sessionStorage.removeItem("signup_formData");
      sessionStorage.removeItem("signup_tempToken");

      // Redirect to dashboard or login
      // navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleResendCode = async () => {
    try {
      // Call resendOtp with both tempToken (if available) and email
      const response = await authService.resendOtp(tempToken, formData.email);

      // console.log("Resend OTP response:", response);

      // Update tempToken if a new one is returned
      if (response?.data?.tempToken) {
        setTempToken(response.data.tempToken);
        sessionStorage.setItem("signup_tempToken", response.data.tempToken);
      }

      // Display success message from API or default
      const successMessage =
        response?.message ||
        response?.data?.message ||
        "OTP has been resent to your email!";
      toast.success(successMessage);
    } catch (error) {
      // console.error("Resend OTP error:", error);

      // Handle specific error cases
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error.message;
        if (
          errorMessage.includes("expired") ||
          errorMessage.includes("invalid")
        ) {
          toast.warning(
            "Session expired. A new OTP has been sent to your email. Please check and try again."
          );
        } else {
          toast.error(errorMessage);
        }
      } else {
        const errorMessage =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to resend OTP. Please try again.";
        toast.error(errorMessage);
      }
    }
  };

  const progressPercentage =
    currentStep === 3 ? 100 : currentStep === 2 ? 66 : 33;

  const steps = ["Account details", "Verify email", "Your profile"];

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="mb-6 flex justify-center">
        <Logo to="/" />
      </div>

      <div className="mb-6 rounded-2xl border border-line-weak bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between gap-2">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isComplete = currentStep > stepNumber;
            const isCurrent = currentStep === stepNumber;

            return (
              <div
                key={label}
                className="flex min-w-0 flex-1 items-center gap-2 last:flex-none"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isComplete
                      ? "bg-success text-white"
                      : isCurrent
                        ? "bg-brand-action text-white"
                        : "bg-surface text-ink-subtle"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={`hidden truncate text-xs font-semibold sm:block ${
                    isCurrent ? "text-brand-ink" : "text-ink-subtle"
                  }`}
                >
                  {label}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    className={`ml-auto h-px flex-1 ${
                      isComplete ? "bg-success/40" : "bg-line-weak"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-brand-action transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="panel mx-auto max-w-[640px] p-6 shadow-panel sm:p-8">
        {currentStep === 1 && (
          <SignUpStep1
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleContinue}
            onRegistrationSuccess={setTempToken}
          />
        )}

        {currentStep === 2 && (
          <SignUpStep2
            formData={formData}
            onOtpChange={handleOtpChange}
            onSubmit={handleContinue}
            onBack={handleBack}
            onResendCode={handleResendCode}
            maskedEmail={maskEmail(formData.email)}
            tempToken={tempToken}
          />
        )}

        {currentStep === 3 && (
          <SignUpStep3
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleContinue}
            onBack={handleBack}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onAddSpecialization={handleAddSkill}
            onRemoveSpecialization={handleRemoveSkill}
            onFileChange={handleFileChange}
          />
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
