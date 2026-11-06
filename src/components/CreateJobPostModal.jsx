import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSlice";
import { ROLES } from "../constants/roles";
import { ModelCross } from "../icons/ModelCross";
import { jobService } from "../services/jobService";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import SelectField from "./common/SelectField";

const CATEGORIES = [
  "Technology",
  "Healthcare",
  "Sales",
  "Retail",
  "Finance",
  "Education",
  "Hospitality",
  "Logistics",
  "Other",
].map((cat) => ({ value: cat, label: cat }));

const WORK_MODES = ["On-site", "Remote", "Hybrid"].map((mode) => ({
  value: mode,
  label: mode,
}));

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
].map((type) => ({ value: type, label: type }));

const EXPERIENCE_LEVELS = [
  { value: "Entry", label: "Entry Level" },
  { value: "Mid", label: "Mid Level" },
  { value: "Senior", label: "Senior Level" },
  { value: "Lead", label: "Lead / Executive" },
];

const SALARY_PERIODS = [
  { value: "year", label: "Per year" },
  { value: "month", label: "Per month" },
  { value: "day", label: "Per day" },
  { value: "hour", label: "Per hour" },
];

const POPULAR_SKILLS = [
  "JavaScript",
  "React",
  "Python",
  "Node.js",
  "SQL",
  "Project Management",
  "Communication",
  "Sales",
];

const INITIAL_FORM_DATA = {
  jobTitle: "",
  companyName: "",
  category: "Technology",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  workMode: "On-site",
  employmentType: "Full-time",
  experienceLevel: "Entry",
  salaryMin: "",
  salaryMax: "",
  currency: "USD",
  salaryPeriod: "year",
  skills: [],
  applicationDeadline: "",
  jobDescription: "",
};

const CreateJobPostModal = ({ isOpen, onClose, onPublish }) => {
  const user = useSelector(selectUser);
  const isRecruiterOrAdmin =
    user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN;

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setFormData({
        ...INITIAL_FORM_DATA,
        companyName: user?.companyName || user?.name || "",
      });
      setErrors({});
      setSkillInput("");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Access restriction safety check
  if (!isRecruiterOrAdmin) {
    return (
      <div className="modal-backdrop">
        <div className="modal-card max-w-md p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-brand-ink">Recruiter Access Required</h3>
          <p className="mb-6 text-sm leading-relaxed text-ink-muted">
            Posting jobs is exclusively available for recruiter and employer accounts on DocDuty. Please switch to a recruiter account to post new job openings.
          </p>
          <button type="button" onClick={onClose} className="btn btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const newErrors = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    } else if (formData.jobTitle.trim().length < 2) {
      newErrors.jobTitle = "Job title must be at least 2 characters";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (formData.salaryMin && formData.salaryMax) {
      if (Number(formData.salaryMin) > Number(formData.salaryMax)) {
        newErrors.salaryMax = "Maximum salary cannot be less than minimum salary";
      }
    }

    if (formData.applicationDeadline) {
      const selected = new Date(formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.applicationDeadline = "Deadline cannot be in the past";
      }
    }

    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = "Job description is required";
    } else if (formData.jobDescription.trim().length < 10) {
      newErrors.jobDescription = "Job description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddSkill = (skillToAdd) => {
    const skill = (skillToAdd || skillInput).trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.jobTitle.trim(),
        jobTitle: formData.jobTitle.trim(),
        companyName: formData.companyName.trim(),
        category: formData.category,
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          country: "USA",
        },
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        workMode: formData.workMode,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        salary: {
          min: formData.salaryMin ? Number(formData.salaryMin) : 0,
          max: formData.salaryMax ? Number(formData.salaryMax) : 0,
          currency: formData.currency,
          period: formData.salaryPeriod,
        },
        skills: formData.skills,
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline)
          : null,
        jobDescription: formData.jobDescription.trim(),
        status: "Active",
      };

      const response = await jobService.createJob(payload);
      toast.success("Job posted successfully!");
      if (onPublish) onPublish(response);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to post job"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-[850px]">
        <div className="modal-header shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
              <h2 className="text-xl font-bold text-brand-ink tracking-tight">Post a Job</h2>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Reach thousands of qualified job seekers on DocDuty
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Close"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-ink"
        >
          {/* Section 1: Job Basics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand mb-3">
              1. Job Basics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Job Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  placeholder="e.g. Senior Software Engineer"
                  className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150 ${
                    errors.jobTitle
                      ? "border-danger ring-1 ring-danger"
                      : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                  }`}
                />
                {errors.jobTitle && (
                  <p className="text-xs text-danger mt-1">{errors.jobTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Company Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  placeholder="e.g. TechCorp Global"
                  className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150 ${
                    errors.companyName
                      ? "border-danger ring-1 ring-danger"
                      : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-xs text-danger mt-1">{errors.companyName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Role Details (Custom Dropdowns) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand mb-3">
              2. Role Classification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <SelectField
                label="Category"
                name="category"
                value={formData.category}
                options={CATEGORIES}
                onChange={handleChange}
                wrapperClassName="mb-0"
              />
              <SelectField
                label="Work Mode"
                name="workMode"
                value={formData.workMode}
                options={WORK_MODES}
                onChange={handleChange}
                wrapperClassName="mb-0"
              />
              <SelectField
                label="Job Type"
                name="employmentType"
                value={formData.employmentType}
                options={EMPLOYMENT_TYPES}
                onChange={handleChange}
                wrapperClassName="mb-0"
              />
              <SelectField
                label="Experience Level"
                name="experienceLevel"
                value={formData.experienceLevel}
                options={EXPERIENCE_LEVELS}
                onChange={handleChange}
                wrapperClassName="mb-0"
              />
            </div>
          </div>

          {/* Section 3: Location */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand mb-3">
              3. Location
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    placeholder="e.g. San Francisco"
                    className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150 ${
                      errors.city
                        ? "border-danger ring-1 ring-danger"
                        : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                    }`}
                  />
                  {errors.city && <p className="text-xs text-danger mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    placeholder="e.g. CA"
                    className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    placeholder="e.g. 94105"
                    className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Street Address (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  placeholder="e.g. 100 Market St, Suite 400"
                  className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Compensation & Salary */}
          <div className="border border-line-weak bg-surface-raised rounded-[10px] p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Compensation & Pay
                </h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Competitive, transparent pay attracts up to 30% more applicants
                </p>
              </div>
              {(formData.salaryMin || formData.salaryMax) && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-[6px] bg-brand-tint text-brand text-xs font-bold">
                  ${Number(formData.salaryMin || 0).toLocaleString()} - ${Number(formData.salaryMax || 0).toLocaleString()} / {formData.salaryPeriod}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1.5">
                  Minimum Pay ($)
                </label>
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="e.g. 80000"
                  className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1.5">
                  Maximum Pay ($)
                </label>
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="e.g. 120000"
                  className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150 ${
                    errors.salaryMax
                      ? "border-danger ring-1 ring-danger"
                      : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                  }`}
                />
                {errors.salaryMax && (
                  <p className="text-xs text-danger mt-1">{errors.salaryMax}</p>
                )}
              </div>

              <div>
                <SelectField
                  label="Pay Frequency"
                  name="salaryPeriod"
                  value={formData.salaryPeriod}
                  options={SALARY_PERIODS}
                  onChange={handleChange}
                  wrapperClassName="mb-0"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Required Skills & Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Required Skills (Tags)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                autoComplete="off"
                data-lpignore="true"
                placeholder="Type a skill (e.g. React, Python) and press Enter"
                className="flex-1 px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2.5 bg-brand-tint text-brand-action hover:bg-brand-action hover:text-white font-bold text-xs rounded-[8px] transition cursor-pointer"
              >
                + Add Skill
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-ink-subtle font-medium mr-1">Suggestions:</span>
              {POPULAR_SKILLS.filter((s) => !formData.skills.includes(s))
                .slice(0, 5)
                .map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-line bg-surface-raised text-ink-muted hover:border-brand-action hover:text-brand-action hover:bg-white transition cursor-pointer"
                  >
                    + {skill}
                  </button>
                ))}
            </div>

            {/* Added Skills List */}
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-2.5 bg-surface-raised rounded-[8px] border border-line-weak">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-primary-200 text-brand text-xs font-semibold rounded-full shadow-2xs"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-ink-subtle hover:text-danger hover:bg-danger-soft transition cursor-pointer font-bold"
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Application Deadline */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Application Deadline (Optional)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="date"
                name="applicationDeadline"
                min={todayStr}
                value={formData.applicationDeadline}
                onChange={handleChange}
                className={`w-full sm:w-64 px-3.5 py-2.5 border rounded-[8px] bg-white text-ink text-sm outline-none transition-all duration-150 ${
                  errors.applicationDeadline
                    ? "border-danger ring-1 ring-danger"
                    : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                }`}
              />
              <span className="text-xs text-ink-subtle">
                Leave empty for ongoing/rolling applications.
              </span>
            </div>
            {errors.applicationDeadline && (
              <p className="text-xs text-danger mt-1">{errors.applicationDeadline}</p>
            )}
          </div>

          {/* Section 7: Job Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                Full Job Description <span className="text-danger">*</span>
              </label>
              <span
                className={`text-xs ${
                  formData.jobDescription.length >= 10
                    ? "text-success font-medium"
                    : "text-ink-subtle"
                }`}
              >
                {formData.jobDescription.length} characters (min 10)
              </span>
            </div>
            <textarea
              name="jobDescription"
              rows={6}
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Provide a comprehensive job overview, responsibilities, required qualifications, schedule, and team benefits..."
              className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink text-sm outline-none leading-relaxed transition-all duration-150 resize-y min-h-[140px] ${
                errors.jobDescription
                  ? "border-danger ring-1 ring-danger"
                  : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
              }`}
            />
            {errors.jobDescription && (
              <p className="text-xs text-danger mt-1">{errors.jobDescription}</p>
            )}
          </div>

          {/* Modal Footer (Sticky) */}
          <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-line-weak bg-white pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-ink-subtle">
              <span className="text-danger">*</span> Indicates required fields
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex-1 sm:flex-none"
              >
                {isSubmitting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? "Publishing..." : "Publish Job"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobPostModal;
