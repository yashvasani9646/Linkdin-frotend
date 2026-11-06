import { useState } from "react";
import InputField from "../common/InputField";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

const ForgotPasswordStep1 = ({ email, onEmailChange, onSubmit, onBack }) => {
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const isFormValid = !validateEmail(email) && email.trim() !== "";

  const handleBlur = () => {
    setTouched(true);
    const emailError = validateEmail(email);
    setError(emailError);
  };

  const handleChange = (e) => {
    onEmailChange(e.target.value);
    if (touched) {
      const emailError = validateEmail(e.target.value);
      setError(emailError);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const emailError = validateEmail(email);
    setError(emailError);

    if (emailError) {
      return;
    }

    onSubmit(e);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">
          Forgot password?
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your email address"
          error={touched ? error : ""}
          wrapperClassName="mb-10"
        />

        <div className="flex flex-col-reverse md:flex-row gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn btn-secondary flex-1"
            >
              Back to sign in
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid}
            className="btn btn-primary flex-1"
          >
            Send OTP
          </button>
        </div>
      </form>
    </>
  );
};

export default ForgotPasswordStep1;
