import { useState } from "react";
import InputField from "../common/InputField";

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return "";
};

const ForgotPasswordStep3 = ({
  newPassword,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBack,
}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const passwordError = validatePassword(newPassword);
  const confirmError = !confirmPassword
    ? "Confirm password is required"
    : newPassword !== confirmPassword
      ? "Passwords do not match"
      : "";
  const isFormValid = !passwordError && !confirmError;

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    if (fieldName === "newPassword") {
      setErrors((prev) => ({
        ...prev,
        newPassword: validatePassword(newPassword),
      }));
    } else if (fieldName === "confirmPassword") {
      const confirmError = !confirmPassword
        ? "Confirm password is required"
        : newPassword !== confirmPassword
        ? "Passwords do not match"
        : "";
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handlePasswordChange = (e) => {
    onPasswordChange(e.target.value);
    if (touched.newPassword) {
      setTimeout(() => {
        setErrors((prev) => ({
          ...prev,
          newPassword: validatePassword(e.target.value),
        }));
      }, 0);
    }
    // Revalidate confirm password if it's been touched
    if (touched.confirmPassword && confirmPassword) {
      setTimeout(() => {
        const confirmError =
          newPassword !== confirmPassword ? "Passwords do not match" : "";
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }, 0);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    onConfirmPasswordChange(e.target.value);
    if (touched.confirmPassword) {
      setTimeout(() => {
        const confirmError = !e.target.value
          ? "Confirm password is required"
          : newPassword !== e.target.value
          ? "Passwords do not match"
          : "";
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }, 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ newPassword: true, confirmPassword: true });

    // Validate all fields
    const passwordError = validatePassword(newPassword);
    const confirmError = !confirmPassword
      ? "Confirm password is required"
      : newPassword !== confirmPassword
      ? "Passwords do not match"
      : "";

    setErrors({
      newPassword: passwordError,
      confirmPassword: confirmError,
    });

    if (passwordError || confirmError) {
      return;
    }

    onSubmit(e);
  };

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-medium leading-8 md:leading-10 -tracking-[0.2px] text-secondary">
          Reset Password
        </h1>
        <p className="text-paragraph text-base font-normal -tracking-[0.2px]">
          Enter your new password to complete the reset process.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="New Password"
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={handlePasswordChange}
          onBlur={() => handleBlur("newPassword")}
          placeholder="Enter new password"
          error={touched.newPassword ? errors.newPassword : ""}
        />

        <InputField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          onBlur={() => handleBlur("confirmPassword")}
          placeholder="Confirm new password"
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          wrapperClassName="mb-10"
        />

        <div className="flex flex-col-reverse md:flex-row gap-4">
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
            className={`px-6 py-3.5 flex-1 font-medium rounded-sm transition text-sm leading-[18px] -tracking-[0.2px] ${
              isFormValid
                ? "bg-primary text-white hover:bg-primary-700 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Reset Password
          </button>
        </div>
      </form>
    </>
  );
};

export default ForgotPasswordStep3;
