import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";
import api from "../services/api";
import { API_CONFIG } from "../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";

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

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Expired", label: "Expired" },
  { value: "Closed", label: "Closed" },
  { value: "Draft", label: "Draft" },
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
  status: "Active",
};

const AdminCreateJobModal = ({
  isOpen,
  onClose,
  onPublish,
  onJobCreated,
  jobId,
  initialData = null,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (initialData) {
        setFormData({
          jobTitle: initialData.jobTitle || initialData.title || "",
          companyName: initialData.companyName || "",
          category: initialData.category || "Technology",
          address: initialData.location?.address || initialData.address || "",
          city: initialData.location?.city || initialData.city || "",
          state: initialData.location?.state || initialData.state || "",
          zipCode: initialData.location?.zipCode || initialData.zipCode || "",
          workMode: initialData.workMode || "On-site",
          employmentType: initialData.employmentType || "Full-time",
          experienceLevel: initialData.experienceLevel || "Entry",
          salaryMin: initialData.salary?.min || "",
          salaryMax: initialData.salary?.max || "",
          currency: initialData.salary?.currency || "USD",
          salaryPeriod: initialData.salary?.period || "year",
          skills: Array.isArray(initialData.skills) ? initialData.skills : [],
          applicationDeadline: initialData.applicationDeadline
            ? initialData.applicationDeadline.split("T")[0]
            : "",
          jobDescription: initialData.jobDescription || "",
          status: initialData.status || "Active",
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
      setErrors({});
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (
      formData.salaryMin &&
      formData.salaryMax &&
      Number(formData.salaryMin) > Number(formData.salaryMax)
    ) {
      newErrors.salaryMax = "Max salary cannot be less than min salary";
    }
    if (!formData.jobDescription.trim()) newErrors.jobDescription = "Job description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
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

    setIsLoading(true);
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
        status: formData.status,
      };

      let response;
      if (isEdit && jobId) {
        response = await api.put(
          API_CONFIG.ENDPOINTS.ADMIN.UPDATE_JOB(jobId),
          payload
        );
        toast.success("Job updated successfully!");
      } else {
        response = await api.post(
          API_CONFIG.ENDPOINTS.ADMIN.CREATE_JOB,
          payload
        );
        toast.success("Job created successfully!");
      }

      if (onPublish) onPublish(response.data);
      if (onJobCreated) onJobCreated(response.data);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to ${isEdit ? "update" : "create"} job`));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-[850px]">
        <div className="modal-header shrink-0">
          <div>
            <h2 className="text-xl font-bold text-brand-ink">
              {isEdit ? "Edit Job (Admin)" : "Create Job (Admin)"}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">Admin management portal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Close modal"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-ink"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Job title"
                className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink outline-none transition-all duration-150 ${
                  errors.jobTitle
                    ? "border-danger ring-1 ring-danger"
                    : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                }`}
              />
              {errors.jobTitle && <p className="text-xs text-danger mt-1">{errors.jobTitle}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Company name"
                className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink outline-none transition-all duration-150 ${
                  errors.companyName
                    ? "border-danger ring-1 ring-danger"
                    : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                }`}
              />
              {errors.companyName && <p className="text-xs text-danger mt-1">{errors.companyName}</p>}
            </div>
          </div>

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
              label="Status"
              name="status"
              value={formData.status}
              options={STATUS_OPTIONS}
              onChange={handleChange}
              wrapperClassName="mb-0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                autoComplete="off"
                placeholder="City"
                className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink outline-none transition-all duration-150 ${
                  errors.city
                    ? "border-danger ring-1 ring-danger"
                    : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
                }`}
              />
              {errors.city && <p className="text-xs text-danger mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                autoComplete="off"
                placeholder="State"
                className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink outline-none transition-all duration-150"
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
                placeholder="Zip code"
                className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink outline-none transition-all duration-150"
              />
            </div>
          </div>

          <div className="border border-line-weak bg-surface-raised rounded-[10px] p-4.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-ink">
              Compensation & Pay
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1.5">Min Pay ($)</label>
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="80000"
                  className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white outline-none transition-all duration-150"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1.5">Max Pay ($)</label>
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="120000"
                  className="w-full px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white outline-none transition-all duration-150"
                />
              </div>
              <div>
                <SelectField
                  label="Period"
                  name="salaryPeriod"
                  value={formData.salaryPeriod}
                  options={SALARY_PERIODS}
                  onChange={handleChange}
                  wrapperClassName="mb-0"
                />
              </div>
              <div>
                <SelectField
                  label="Experience"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  options={EXPERIENCE_LEVELS}
                  onChange={handleChange}
                  wrapperClassName="mb-0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Required Skills (Tags)
            </label>
            <div className="flex gap-2 mb-2">
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
                placeholder="Add skill and press Enter"
                className="flex-1 px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-brand-tint text-brand-action hover:bg-brand-action hover:text-white font-bold text-xs rounded-[8px] transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-surface-raised rounded-[8px] border border-line-weak">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-primary-200 text-brand text-xs font-semibold rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-ink-subtle hover:text-danger font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Application Deadline
            </label>
            <input
              type="date"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleChange}
              className="w-full sm:w-64 px-3.5 py-2.5 border border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-[8px] bg-white text-ink outline-none transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Full Job Description *
            </label>
            <textarea
              name="jobDescription"
              rows={6}
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Job description..."
              className={`w-full px-3.5 py-2.5 border rounded-[8px] bg-white text-ink outline-none leading-relaxed transition-all duration-150 resize-y min-h-[140px] ${
                errors.jobDescription
                  ? "border-danger ring-1 ring-danger"
                  : "border-line hover:border-ink-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action"
              }`}
            />
            {errors.jobDescription && <p className="text-xs text-danger mt-1">{errors.jobDescription}</p>}
          </div>

          <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-line-weak bg-white pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? "Saving..." : isEdit ? "Update Job" : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateJobModal;
