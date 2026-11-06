import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import InputField from "../common/InputField";

// Validation rules
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phone) return "Phone number is required";
  if (!phoneRegex.test(phone.replace(/[- ]/g, "")))
    return "Please enter a valid phone number";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return "";
};

const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return "";
};

import { authService } from "../../services/authService";

const SignUpStep1 = ({
  formData,
  onInputChange,
  onSubmit,
  onRegistrationSuccess,
}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {
      firstName: validateRequired(formData.firstName, "First name"),
      lastName: validateRequired(formData.lastName, "Last name"),
      phoneNumber: validatePhone(formData.phoneNumber),
      email: validateEmail(formData.email),
      city: validateRequired(formData.city, "City"),
      state: validateRequired(formData.state, "State"),
      postcode: validateRequired(formData.postcode, "Postcode"),
      password: validatePassword(formData.password),
      confirmPassword: !formData.confirmPassword
        ? "Confirm password is required"
        : formData.password !== formData.confirmPassword
        ? "Passwords do not match"
        : "",
    };
    return newErrors;
  }, [formData]);

  // Check if form is valid
  useEffect(() => {
    const newErrors = validateForm();
    const hasNoErrors = Object.values(newErrors).every((error) => error === "");
    const allFieldsFilled =
      formData.firstName &&
      formData.lastName &&
      formData.phoneNumber &&
      formData.email &&
      formData.city &&
      formData.state &&
      formData.postcode &&
      formData.password &&
      formData.confirmPassword &&
      formData.agreeTerms;
    setIsFormValid(hasNoErrors && allFieldsFilled);
  }, [formData, validateForm]);

  // Handle field blur
  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const newErrors = validateForm();
    setErrors((prev) => ({ ...prev, [fieldName]: newErrors[fieldName] }));
  };

  // Handle input change with validation
  const handleChange = (e) => {
    onInputChange(e);
    const { name } = e.target;
    if (touched[name]) {
      setTimeout(() => {
        const newErrors = validateForm();
        setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
      city: true,
      state: true,
      postcode: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const newErrors = validateForm();
    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (hasErrors || !formData.agreeTerms) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        password: formData.password,
        agreedToTerms: "true",
      };

      const response = await authService.register(payload);

      // console.log("Registration response:", response);

      // Display success message from API if available
      const successMessage = response?.message || response?.data?.message;
      if (successMessage) {
        toast.success(successMessage);
      }

      // Store tempToken for OTP verification
      if (response?.data?.tempToken) {
        onRegistrationSuccess(response.data.tempToken);
      }

      onSubmit(e);
    } catch (error) {
      // console.error("Registration error:", error);

      // Handle backend validation errors
      if (error.response?.data) {
        const errorData = error.response.data;

        // Check for single error with path field (new API format)
        if (errorData.error?.path && errorData.error?.message) {
          const field = errorData.error.path;
          const message = errorData.error.message;

          // Map path to form fields and set error
          const fieldMapping = {
            email: "email",
            phoneNumber: "phoneNumber",
            phone: "phoneNumber",
            firstName: "firstName",
            lastName: "lastName",
            password: "password",
            city: "city",
            state: "state",
            postcode: "postcode",
          };

          const formField = fieldMapping[field];
          if (formField) {
            setErrors((prev) => ({ ...prev, [formField]: message }));
            setTouched((prev) => ({ ...prev, [formField]: true }));
          } else {
            // If path doesn't match known fields, show as toast
            toast.error(message);
          }
        }
        // Check if there are field-specific errors (e.g., errors array from backend)
        else if (errorData.errors && Array.isArray(errorData.errors)) {
          const newErrors = {};

          // Map backend errors to form fields
          errorData.errors.forEach((err) => {
            const field = err.field || err.param || err.path;
            const message = err.msg || err.message;

            // Map backend field names to frontend field names
            if (field === "email") {
              newErrors.email = message;
              setTouched((prev) => ({ ...prev, email: true }));
            } else if (field === "phoneNumber" || field === "phone") {
              newErrors.phoneNumber = message;
              setTouched((prev) => ({ ...prev, phoneNumber: true }));
            } else if (field === "firstName") {
              newErrors.firstName = message;
              setTouched((prev) => ({ ...prev, firstName: true }));
            } else if (field === "lastName") {
              newErrors.lastName = message;
              setTouched((prev) => ({ ...prev, lastName: true }));
            } else if (field === "password") {
              newErrors.password = message;
              setTouched((prev) => ({ ...prev, password: true }));
            } else if (field === "city") {
              newErrors.city = message;
              setTouched((prev) => ({ ...prev, city: true }));
            } else if (field === "state") {
              newErrors.state = message;
              setTouched((prev) => ({ ...prev, state: true }));
            } else if (field === "postcode") {
              newErrors.postcode = message;
              setTouched((prev) => ({ ...prev, postcode: true }));
            }
          });

          setErrors((prev) => ({ ...prev, ...newErrors }));
        } else if (errorData.message) {
          // Generic error message
          // Try to match the message to a specific field
          const message = errorData.message.toLowerCase();

          if (message.includes("email")) {
            setErrors((prev) => ({ ...prev, email: errorData.message }));
            setTouched((prev) => ({ ...prev, email: true }));
          } else if (message.includes("phone")) {
            setErrors((prev) => ({ ...prev, phoneNumber: errorData.message }));
            setTouched((prev) => ({ ...prev, phoneNumber: true }));
          } else {
            // Show as a general toast if we can't match to a field
            toast.error(errorData.message);
          }
        } else {
          const errorMessage =
            errorData.error?.message ||
            "Registration failed. Please try again.";
          toast.error(errorMessage);
        }
      } else {
        toast.error(
          "Registration failed. Please check your connection and try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">
          Start with your basic details. You can complete your profile in the
          final step.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
          <InputField
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={() => handleBlur("firstName")}
            placeholder="Enter first name"
            error={touched.firstName ? errors.firstName : ""}
            wrapperClassName="mb-6"
          />
          <InputField
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={() => handleBlur("lastName")}
            placeholder="Enter last name"
            error={touched.lastName ? errors.lastName : ""}
            wrapperClassName="mb-6"
          />
        </div>

        {/* Phone Number */}
        <InputField
          label="Phone Number"
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          onBlur={() => handleBlur("phoneNumber")}
          placeholder="Enter phone number"
          error={touched.phoneNumber ? errors.phoneNumber : ""}
        />

        {/* Email Address */}
        <InputField
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => handleBlur("email")}
          placeholder="Enter email address"
          error={touched.email ? errors.email : ""}
        />

        {/* City & State */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
          <InputField
            label="City"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            onBlur={() => handleBlur("city")}
            placeholder="Enter city"
            error={touched.city ? errors.city : ""}
            wrapperClassName="mb-6"
          />
          <InputField
            label="State"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            onBlur={() => handleBlur("state")}
            placeholder="Enter state"
            error={touched.state ? errors.state : ""}
            wrapperClassName="mb-6"
          />
        </div>

        {/* Postcode */}
        <InputField
          label="Postcode"
          type="text"
          name="postcode"
          value={formData.postcode}
          onChange={handleChange}
          onBlur={() => handleBlur("postcode")}
          placeholder="Enter postcode"
          error={touched.postcode ? errors.postcode : ""}
        />

        {/* Password */}
        <InputField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={() => handleBlur("password")}
          placeholder="Enter password"
          error={touched.password ? errors.password : ""}
        />

        {/* Confirm Password */}
        <InputField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={() => handleBlur("confirmPassword")}
          placeholder="Confirm password"
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          wrapperClassName="mb-5"
        />

        {/* Terms & Conditions */}
        <div className="mb-8 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="agreeTerms"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={onInputChange}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-line text-brand-action focus:ring-brand-action/30"
          />
          <label
            htmlFor="agreeTerms"
            className="text-sm leading-6 text-ink-muted"
          >
            I agree to the{" "}
            <Link
              to="/terms"
              className="font-semibold text-brand-action hover:text-brand-action-hover"
            >
              terms of use and privacy policy
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="btn btn-primary min-h-12 w-full"
        >
          {isLoading ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              Creating account...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </>
  );
};

export default SignUpStep1;
