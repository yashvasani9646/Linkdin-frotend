import { useState, useRef, useEffect } from "react";
import { Cross } from "../../icons/Cross";
import InputField from "../common/InputField";
import SelectField from "../common/SelectField";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { userService } from "../../services/userService";
import { API_CONFIG } from "../../config/api.config";
import { setUser } from "../../store/slices/authSlice";
import { ROLES } from "../../constants/roles";

// ── Role options (generic job-board) ─────────────────────────────────────────
const roleOptions = [
  { value: "", label: "Select your role" },
  { value: ROLES.JOB_SEEKER, label: "Job Seeker" },
  { value: ROLES.RECRUITER, label: "Recruiter" },
];

const experienceOptions = [
  { value: "", label: "Select experience" },
  { value: "0-1", label: "0-1 years" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10+", label: "10+ years" },
];

// ── Validation helpers ────────────────────────────────────────────────────────
const validateRequired = (value, fieldName) => {
  if (!value || !value.toString().trim()) return `${fieldName} is required`;
  return "";
};

// ── SignUpStep3 ───────────────────────────────────────────────────────────────
const SignUpStep3 = ({
  formData,
  onInputChange,
  onAddSkill,
  onRemoveSkill,
  onAddSpecialization,
  onRemoveSpecialization,
  onFileChange,
}) => {
  const addSkillFn = onAddSkill || onAddSpecialization;
  const removeSkillFn = onRemoveSkill || onRemoveSpecialization;
  const activeSkills = formData.skills || [];
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState("");
  const [uploadedResumeFileName, setUploadedResumeFileName] = useState("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isEmployer = formData.role === ROLES.RECRUITER;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {
      role: validateRequired(formData.role, "Role"),
      // Company name only required for Employer
      companyName: isEmployer
        ? validateRequired(formData.companyName, "Company name")
        : "",
      yearsOfExperience: validateRequired(
        formData.yearsOfExperience,
        "Years of experience"
      ),
    };
    return newErrors;
  };

  useEffect(() => {
    const newErrors = validateForm();
    const hasNoErrors = Object.values(newErrors).every((e) => e === "");
    const filled =
      formData.role &&
      (!isEmployer || formData.companyName) &&
      formData.yearsOfExperience;
    setIsFormValid(hasNoErrors && !!filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const newErrors = validateForm();
    setErrors((prev) => ({ ...prev, [fieldName]: newErrors[fieldName] }));
  };

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

  // ── Skills ───────────────────────────────────────────────────────────────
  const handleAddSkill = (e) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (addSkillFn) addSkillFn(newSkill.trim());
      setNewSkill("");
    }
  };

  // ── Photo upload ────────────────────────────────────────────────────────────
  const uploadPhoto = async (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, JPG, or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5 MB. Please upload a smaller image.");
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const response = await userService.uploadProfilePhoto(file);
      if (response?.data?.url) {
        setUploadedPhotoUrl(response.data.url);
        onFileChange(file);
        toast.success(
          response?.data?.message || "Photo uploaded successfully!"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to upload photo. Please try again."
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadPhoto(file);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadPhoto(file);
  };

  // ── Resume upload ───────────────────────────────────────────────────────────
  const uploadResume = async (file) => {
    if (file.type !== "application/pdf") {
      toast.error("Invalid file type. Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB. Please upload a smaller file.");
      return;
    }
    setIsUploadingResume(true);
    try {
      const response = await userService.upload_resume(file);
      if (response?.data?.url) {
        setUploadedResumeUrl(response.data.url);
        setUploadedResumeFileName(response.data.resumeFileName || file.name);
        setResumeFile(file);
        toast.success(
          response?.data?.message || "Resume uploaded successfully!"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to upload resume. Please try again."
      );
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleResumeFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadResume(file);
  };
  const handleResumeFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadResume(file);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ role: true, companyName: true, yearsOfExperience: true });

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== "")) return;
    if (isUploadingPhoto) {
      toast.warning("Please wait for the photo upload to complete.");
      return;
    }
    if (isUploadingResume) {
      toast.warning("Please wait for the resume upload to complete.");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = uploadedPhotoUrl;

      if (formData.uploadedFile && !uploadedPhotoUrl) {
        try {
          const uploadResponse = await userService.uploadProfilePhoto(
            formData.uploadedFile
          );
          if (uploadResponse?.data?.url) {
            photoUrl = uploadResponse.data.url;
            setUploadedPhotoUrl(photoUrl);
          }
        } catch {
          toast.warning("Failed to upload photo. Continuing without it.");
        }
      }

      // Build the profile payload (generic)
      const profileData = {
        role: formData.role,
        yearsOfExperience:
          parseInt(formData.yearsOfExperience.split("-")[0]) ||
          formData.yearsOfExperience,
        skills: activeSkills,
        headline: activeSkills.join(", "),
      };

      // Employer-only: company name
      if (isEmployer && formData.companyName) {
        profileData.companyName = formData.companyName;
      }

      if (photoUrl) profileData.profilePhoto = photoUrl;

      if (uploadedResumeUrl) {
        profileData.resume = uploadedResumeUrl;
        profileData.resumeFileName = uploadedResumeFileName;
      }

      const response = await userService.updateProfile(profileData);

      if (response?.data?.user) {
        dispatch(setUser(response.data.user));
      }

      // Clear signup session data
      sessionStorage.removeItem("signup_step");
      sessionStorage.removeItem("signup_formData");
      sessionStorage.removeItem("signup_tempToken");

      toast.success(
        response?.data?.message || "Registration completed successfully!"
      );
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to complete registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[648px] mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">
          Complete your profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">
          Tell us a bit about yourself to improve your job matches.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Role Dropdown */}
        <SelectField
          label="I am a…"
          name="role"
          value={formData.role}
          onChange={handleChange}
          options={roleOptions}
          error={touched.role && errors.role ? errors.role : ""}
          wrapperClassName="mb-5"
        />

        {/* Company name (Employer only) & Years of Experience */}
        <div
          className={`grid grid-cols-1 ${
            isEmployer ? "md:grid-cols-2" : ""
          } gap-4 mb-5`}
        >
          {isEmployer && (
            <InputField
              label="Company Name"
              type="text"
              name="companyName"
              value={formData.companyName || ""}
              onChange={handleChange}
              onBlur={() => handleBlur("companyName")}
              placeholder="Enter company name"
              error={touched.companyName ? errors.companyName : ""}
              wrapperClassName=""
            />
          )}

          <SelectField
            label="Years of Experience"
            name="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            options={experienceOptions}
            error={
              touched.yearsOfExperience && errors.yearsOfExperience
                ? errors.yearsOfExperience
                : ""
            }
            wrapperClassName=""
          />
        </div>

        {/* Skills / Interests */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-ink mb-1.5">
            Skills / Interests{" "}
            <span className="text-ink-subtle font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white border border-line hover:border-ink-subtle rounded-[8px] focus-within:border-brand-action focus-within:ring-1 focus-within:ring-brand-action transition-all min-h-[48px]">
            {activeSkills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-tint text-brand text-xs font-semibold rounded-full border border-primary-100"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkillFn && removeSkillFn(skill)}
                  className="hover:text-brand-action-active hover:bg-primary-100 rounded-full p-0.5 cursor-pointer flex items-center justify-center transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <Cross className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder={
                activeSkills.length === 0
                  ? "Type a skill and press Enter"
                  : "Add another skill..."
              }
              className="flex-1 min-w-[160px] py-1 bg-transparent outline-none focus:outline-none border-none ring-0 shadow-none text-sm text-ink placeholder:text-ink-subtle"
            />
          </div>
          <p className="text-xs text-ink-subtle mt-1.5">
            Press Enter or comma to add each skill
          </p>
        </div>

        {/* Upload Profile Photo */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-ink mb-1.5">
            Upload Profile Photo{" "}
            <span className="text-ink-subtle font-normal">(optional)</span>
          </label>
          <div
            className="border-2 border-dashed border-line hover:border-brand-action bg-surface-raised hover:bg-brand-tint/30 rounded-[8px] p-6 text-center cursor-pointer transition-all duration-150 group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
          >
            <div className="max-w-[340px] mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploadingPhoto}
              />
              {uploadedPhotoUrl && formData.uploadedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <img
                      src={`${API_CONFIG.BASE_URL}${uploadedPhotoUrl}`}
                      alt="Profile Preview"
                      className="w-24 h-24 object-cover rounded-full border-2 border-brand-action shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-success text-white rounded-full p-1 shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-ink font-semibold truncate max-w-[280px]">
                      {formData.uploadedFile.name}
                    </p>
                    <p className="text-xs text-brand-action font-medium mt-1 hover:underline">
                      Click or drop a different photo to replace
                    </p>
                  </div>
                </div>
              ) : isUploadingPhoto ? (
                <div className="py-2 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-brand-action border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-ink font-medium">
                    Uploading photo…
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs mx-auto flex items-center justify-center text-brand-action mb-3 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-ink font-medium">
                    <span className="text-brand-action font-bold hover:underline">Browse photo</span> or drag & drop here
                  </p>
                  <p className="text-xs text-ink-subtle mt-1.5">
                    JPEG, PNG or WebP. Optimal 400×400px (max 5 MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Resume */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-ink mb-1.5">
            Upload Resume{" "}
            <span className="text-ink-subtle font-normal">(optional)</span>
          </label>
          <div
            className="border-2 border-dashed border-line hover:border-brand-action bg-surface-raised hover:bg-brand-tint/30 rounded-[8px] p-6 text-center cursor-pointer transition-all duration-150 group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleResumeFileDrop}
            onClick={() =>
              !isUploadingResume && resumeInputRef.current?.click()
            }
          >
            <div className="max-w-[340px] mx-auto">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeFileSelect}
                className="hidden"
                disabled={isUploadingResume}
              />
              {uploadedResumeUrl && resumeFile ? (
                <div className="bg-white border border-line rounded-[8px] p-4 flex items-center gap-3 text-left shadow-xs">
                  <div className="w-10 h-10 rounded-[6px] bg-brand-tint text-brand flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {uploadedResumeFileName}
                    </p>
                    <p className="text-xs text-success font-medium flex items-center gap-1 mt-0.5">
                      <span>✓ Ready to submit</span>
                    </p>
                  </div>
                  <span className="text-xs text-brand-action font-semibold hover:underline shrink-0">
                    Change
                  </span>
                </div>
              ) : isUploadingResume ? (
                <div className="py-2 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-brand-action border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-ink font-medium">
                    Uploading resume…
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs mx-auto flex items-center justify-center text-brand-action mb-3 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-ink font-medium">
                    <span className="text-brand-action font-bold hover:underline">Upload your resume</span> or drag & drop here
                  </p>
                  <p className="text-xs text-ink-subtle mt-1.5">
                    PDF, DOC, DOCX up to 10 MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse md:flex-row justify-end gap-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="btn btn-primary min-h-12"
          >
            {isSubmitting ? "Completing Registration…" : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpStep3;
