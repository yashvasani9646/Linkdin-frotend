import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BackButton from "../components/common/BackButton";
import { useProfile } from "../hooks/useProfile";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser } from "../store/slices/authSlice";
import { userService } from "../services/userService";
import { API_CONFIG } from "../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import { openBlobInNewTab } from "../utils/openFile";

/**
 * Map a saved user record (API response or Redux state) onto the edit form.
 * Every field walks API -> profile context -> empty string, so the form opens
 * pre-filled with the values already stored for the user.
 */
const buildFormValues = (savedUser = {}, profile = {}) => {
  let firstName = savedUser.firstName || "";
  let lastName = savedUser.lastName || "";

  // Some payloads only carry a single fullName
  if ((!firstName || !lastName) && savedUser.fullName) {
    const parts = savedUser.fullName.trim().split(/\s+/);
    firstName = firstName || parts[0] || "";
    lastName = lastName || parts.slice(1).join(" ") || "";
  }

  return {
    firstName: firstName || profile.firstName || "",
    lastName: lastName || profile.lastName || "",
    phoneNumber:
      savedUser.phoneNumber || savedUser.phone || profile.phoneNumber || "",
    email: savedUser.email || profile.email || "",
    streetAddress:
      savedUser.streetAddress ||
      savedUser.address?.street ||
      profile.streetAddress ||
      "",
    city: savedUser.city || savedUser.address?.city || profile.city || "",
    area:
      savedUser.state ||
      savedUser.area ||
      savedUser.address?.state ||
      profile.area ||
      "",
    pincode:
      savedUser.postcode ||
      savedUser.pincode ||
      savedUser.zipCode ||
      savedUser.address?.zipCode ||
      profile.pincode ||
      "",
    country:
      savedUser.country || savedUser.address?.country || profile.country || "",
    avatar: savedUser.profilePhoto || savedUser.avatar || profile.avatar || "",
  };
};

/** Resolve a stored profile photo path into a URL the <img> tag can render. */
const resolvePhotoUrl = (savedUser = {}, profile = {}) => {
  const src =
    savedUser.profilePhoto || savedUser.avatar || profile.avatar || "";
  if (!src) return "";
  return /^(https?:|data:|blob:)/.test(src)
    ? src
    : `${API_CONFIG.BASE_URL}${src}`;
};

const EditProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userProfile, updateProfile } = useProfile();
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const user = useSelector(selectUser);
  const [profileDetails, setProfileDetails] = useState(null);
  const [isViewingResume, setIsViewingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");

  // Seed the form from whatever is already known (Redux/profile context) so
  // the inputs are never blank while the saved profile is being fetched
  const [formData, setFormData] = useState(() =>
    buildFormValues(user, userProfile),
  );
  const [previewImage, setPreviewImage] = useState(() =>
    resolvePhotoUrl(user, userProfile),
  );

  // Fetch the previously saved profile and populate the input fields
  useEffect(() => {
    let isActive = true;

    const loadSavedProfile = async () => {
      setLoadError("");
      try {
        const response = await userService.getProfileDetails();
        if (!isActive) return;

        const savedUser = response?.data?.user;
        const savedDetails = response?.data?.profileDetails;
        if (savedDetails) setProfileDetails(savedDetails);
        if (savedUser) {
          setFormData(buildFormValues(savedUser, userProfile));
          setPreviewImage(resolvePhotoUrl(savedUser, userProfile));
          // Keep the Redux store in sync so the Profile page reflects it too
          dispatch(
            updateUser({
              ...savedUser,
              fullName:
                savedUser.fullName ||
                `${savedUser.firstName || ""} ${savedUser.lastName || ""}`.trim(),
            })
          );
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            getErrorMessage(
              error,
              "We couldn't load your saved profile details.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadSavedProfile();

    return () => {
      isActive = false;
    };
  }, [reloadKey, userProfile, dispatch]);

  const handleRetry = () => {
    setIsLoadingProfile(true);
    setReloadKey((key) => key + 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }

      // Store the file for later upload
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setFormData((prev) => ({
        ...prev,
        avatar: imageUrl,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    // First Name Validation (mirrors backend: 2-50 characters)
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First Name must be at least 2 characters";
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = "First Name must be at most 50 characters";
    }

    // Last Name Validation (mirrors backend: 2-50 characters)
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last Name must be at least 2 characters";
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = "Last Name must be at most 50 characters";
    }

    // Phone Number Validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
    } else if (
      !phoneRegex.test(formData.phoneNumber.trim().replace(/\s/g, ""))
    ) {
      newErrors.phoneNumber = "Phone Number must be a valid number";
    }

    // Email Validation
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Invalid Email Address";
    }

    // Pincode Validation (backend accepts up to 20 characters)
    if (
      formData.pincode &&
      !/^[0-9A-Za-z\s-]{1,20}$/.test(formData.pincode.trim())
    ) {
      newErrors.pincode =
        "Pincode must be up to 20 characters (letters, numbers, spaces or dashes)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");

    // Validate form before saving
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      let uploadedPhotoUrl = null;

      // Step 1: Upload photo if a new file was selected
      if (selectedFile) {
        try {
          const photoResponse = await userService.uploadProfilePhoto(
            selectedFile
          );

          if (photoResponse?.data?.url) {
            uploadedPhotoUrl = photoResponse.data.url;
          }
        } catch (photoError) {
          const photoMsg = getErrorMessage(photoError, "Failed to upload photo. Please try again.");
          setSaveError(photoMsg);
          toast.error(photoMsg);
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Save profile data (include profilePhoto if uploaded)
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.area,
        postcode: formData.pincode,
        country: formData.country,
        // Include the new profile photo URL so it gets saved on the backend
        ...(uploadedPhotoUrl && { profilePhoto: uploadedPhotoUrl }),
      };

      await userService.editProfile(payload);

      // Step 3: Update Redux store with new user data using updateUser (merges instead of replacing)
      const updatedUserData = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phoneNumber,
        phone: formData.phoneNumber,
        email: formData.email,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.area,
        zipCode: formData.pincode,
        country: formData.country,
        // Update profile photo if a new one was uploaded
        ...(uploadedPhotoUrl && { profilePhoto: uploadedPhotoUrl }),
      };

      dispatch(updateUser(updatedUserData));

      // Also update context for consistency
      updateProfile({
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`,
        ...(uploadedPhotoUrl && { avatar: uploadedPhotoUrl }),
      });

      toast.success("Profile updated successfully!");
      // Navigate to profile page on success
      navigate("/dashboard/profile");
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to update profile. Please try again.");
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/profile");
  };

  // Open the uploaded resume in a new tab through the secure owner-only
  // view endpoint (direct /uploads/resumes URLs are blocked server-side).
  const resumeData = profileDetails?.resume || null;
  const handleResumeView = async () => {
    if (!resumeData?.fileUrl || isViewingResume) return;

    setIsViewingResume(true);
    setResumeError("");
    try {
      const blob = await userService.view_resume();
      openBlobInNewTab(blob);
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to open resume");
      setResumeError(msg);
      toast.error(msg);
    } finally {
      setIsViewingResume(false);
    }
  };

  // Wait for the saved profile to arrive before rendering the form, so an
  // existing profile never shows up with empty inputs
  if (isLoadingProfile) {
    return (
      <div className="page-shell pb-16">
        <div className="border-b border-line-weak bg-white">
          <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-brand-ink">Edit profile</h1>
            <p className="text-sm text-ink-muted">
              <Link
                to="/dashboard"
                className="transition-colors hover:text-brand-action"
              >
                Home
              </Link>{" "}
              /{" "}
              <Link
                to="/dashboard/profile"
                className="transition-colors hover:text-brand-action"
              >
                Profile
              </Link>{" "}
              / <span className="font-medium text-ink">Edit</span>
            </p>
          </div>
        </div>
        <div className="loading-state py-24">
          <div className="loading-spinner"></div>
          <p>Loading your saved profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pb-16">
      {/* Header */}
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Edit profile</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            /{" "}
            <Link to="/dashboard/profile" className="transition-colors hover:text-brand-action">
              Profile
            </Link>{" "}
            / <span className="font-medium text-ink">Edit</span>
          </p>
        </div>
      </div>

      {/* Edit Profile Content */}
      <div className="app-container pt-6 sm:pt-8">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-start gap-3">
          <BackButton
            fallback="/dashboard/profile"
            label="Back to profile"
            className="mt-0.5 h-10 w-10"
          />
          <div>
            <h2 className="page-title">Edit profile</h2>
            <p className="page-subtitle">
              Update your personal and professional details anytime.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="panel mx-auto max-w-[872px] space-y-6 p-5 sm:p-6">
          {/* Load failure: keep any data we do have and offer a retry */}
          {loadError && (
            <div
              className="alert alert-error flex-wrap justify-between gap-3"
              role="alert"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={handleRetry}
                className="btn btn-secondary shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Row 1: Upload Photo, First Name, Last Name */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Upload Photo */}
            <div className="mx-auto md:mx-0">
              <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                Upload Photo
              </label>
              <div
                className="w-[200px] h-[143px] relative border-2 border-dashed border-line hover:border-brand-action rounded-[8px] flex flex-col items-center justify-center bg-surface-raised hover:bg-brand-tint/30 cursor-pointer transition overflow-hidden group"
                onClick={() =>
                  document.getElementById("profile-upload").click()
                }
              >
                <input
                  type="file"
                  id="profile-upload"
                  className="hidden"
                  accept=".jpg,.jprg,.png"
                  onChange={handleImageUpload}
                />
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      src="/Upload.svg"
                      alt="Upload"
                      className="w-10 h-10 mb-2"
                    />
                    <div className="px-4 text-center">
                      <p className="text-[12px] font-normal leading-5 -tracking-[2%] text-secondary">
                        Browse photo or drop here
                      </p>
                      <p className="text-[10px] font-normal leading-3.5 -tracking-[2%] text-ink-muted mt-1">
                        Max photo size 5 MB.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* First Name */}
            <div className="flex-1 ">
              <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border ${
                  errors.firstName ? "border-danger ring-1 ring-danger" : "border-line hover:border-ink-subtle"
                } rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition mb-2`}
              />
              {errors.firstName && (
                <p className="field-error mb-4">{errors.firstName}</p>
              )}

              <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border ${
                  errors.phoneNumber ? "border-danger ring-1 ring-danger" : "border-line hover:border-ink-subtle"
                } rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition`}
              />
              {errors.phoneNumber && (
                <p className="field-error mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="flex-1">
              <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border ${
                  errors.lastName ? "border-danger ring-1 ring-danger" : "border-line hover:border-ink-subtle"
                } rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition mb-2`}
              />
              {errors.lastName && (
                <p className="field-error mb-4">{errors.lastName}</p>
              )}

              <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                readOnly
                aria-readonly="true"
                title="Your registered email cannot be changed here"
                className="w-full cursor-not-allowed rounded-[8px] border border-line bg-surface px-4 py-3 text-sm text-ink-muted outline-none transition placeholder:text-ink-subtle"
              />
              <p className="field-help">
                Your registered email address cannot be changed from here.
              </p>
              {errors.email && (
                <p className="field-error mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Location Section */}
          <div className="gap-6">
            <h3 className="text-[20px] font-semibold leading-[100%] -tracking-[2%] text-secondary mb-5">
              Location
            </h3>

            {/* Street Address */}
            <div className="mb-5">
              <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                Street Address
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="Address"
                className="w-full px-4 py-3 bg-white border border-line hover:border-ink-subtle rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition"
              />
            </div>

            {/* City, Area, Pincode, Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:flex gap-5">
              <div className="flex-1">
                <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                  City, State
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-line hover:border-ink-subtle rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                  Area
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-line hover:border-ink-subtle rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border ${
                    errors.pincode ? "border-danger ring-1 ring-danger" : "border-line hover:border-ink-subtle"
                  } rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition`}
                />
                {errors.pincode && (
                  <p className="text-danger text-xs mt-1">
                    {errors.pincode}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium leading-[100%] tracking-[0%] text-secondary mb-[5px]">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-line hover:border-ink-subtle rounded-[8px] text-sm text-ink placeholder:text-ink-subtle outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Resume Section: preview the uploaded document securely */}
          <div className="border-t border-line-weak pt-5">
            <h3 className="text-[20px] font-semibold leading-[100%] -tracking-[2%] text-secondary mb-5">
              Resume
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-weak bg-surface-raised p-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/Document.svg"
                  alt=""
                  className="h-8 w-8 shrink-0"
                />
                <div className="min-w-0">
                  {resumeData?.fileUrl ? (
                    <button
                      type="button"
                      onClick={handleResumeView}
                      disabled={isViewingResume}
                      title="Open your resume in a new tab"
                      className="max-w-full truncate text-left text-sm font-semibold leading-5 text-brand-action transition hover:underline disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {resumeData.fileName || "Uploaded resume"}
                    </button>
                  ) : (
                    <p className="text-sm font-normal leading-4 text-ink-muted">
                      No resume uploaded
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {resumeData?.fileUrl
                      ? "PDF / document preview opens in a new tab"
                      : "Upload a resume from your profile page"}
                  </p>
                </div>
              </div>
              {resumeData?.fileUrl && (
                <button
                  type="button"
                  onClick={handleResumeView}
                  disabled={isViewingResume}
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  {isViewingResume ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                  ) : (
                    <img src="/ArrowSquareOut.svg" alt="" className="h-4 w-4" />
                  )}
                  View
                </button>
              )}
            </div>
            {resumeError && (
              <p className="field-error mt-2">{resumeError}</p>
            )}
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="alert alert-error" role="alert">
              {saveError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-line-weak pt-5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="btn btn-primary gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
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

export default EditProfilePage;
