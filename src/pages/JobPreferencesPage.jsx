import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/common/BackButton";
import AddJobTitlesModal from "../components/AddJobTitlesModal";
import AddJobTypesModal from "../components/AddJobTypesModal";
import AddWorkScheduleModal from "../components/AddWorkScheduleModal";
import AddPayModal from "../components/AddPayModal";
import { userService } from "../services/userService";
import { toast } from "react-toastify";

const JobPreferencesPage = () => {
  const [isJobTitleModalOpen, setIsJobTitleModalOpen] = useState(false);
  const [isJobTypeModalOpen, setIsJobTypeModalOpen] = useState(false);
  const [isWorkScheduleModalOpen, setIsWorkScheduleModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Job preferences state
  const [jobTitles, setJobTitles] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [payPreference, setPayPreference] = useState({
    minimumSalary: "",
    frequency: "Per hour",
  });

  // Fetch job preferences from API
  const fetchJobPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getProfileDetails();
      if (response.success && response.data?.profileDetails?.jobPreferences) {
        const prefs = response.data.profileDetails.jobPreferences;

        // Map job titles
        setJobTitles(
          (prefs.preferredJobTitles || []).map((item) => item.jobTitle)
        );

        // Map job types
        setJobTypes(
          (prefs.preferredJobTypes || []).map((item) => item.jobType)
        );

        // Map work schedules - store as array of objects with schedule and days
        setWorkSchedules(prefs.preferredWorkSchedules || []);

        // Map pay preference
        if (prefs.payPreference) {
          setPayPreference({
            minimumSalary: prefs.payPreference.minimumSalary || "",
            frequency: prefs.payPreference.frequency || "Per hour",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching job preferences:", error);
      toast.error("Failed to load job preferences");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchJobPreferences();
  }, [fetchJobPreferences]);

  // Save job preferences to API - returns { success, error } for modal handling
  const saveJobPreferences = useCallback(
    async (updatedData) => {
      setIsSaving(true);
      try {
        // Build the payload matching API format
        const payload = {
          preferredJobTitles: (updatedData.preferredJobTitles || jobTitles).map(
            (title) => (typeof title === "string" ? { jobTitle: title } : title)
          ),
          preferredJobTypes: (updatedData.preferredJobTypes || jobTypes).map(
            (type) => (typeof type === "string" ? { jobType: type } : type)
          ),
          preferredWorkSchedules:
            updatedData.preferredWorkSchedules || workSchedules,
          payPreference: updatedData.payPreference || {
            minimumSalary: parseFloat(payPreference.minimumSalary) || 0,
            frequency: payPreference.frequency,
          },
        };

        const response = await userService.updateJobPreferences(payload);
        if (response.success) {
          toast.success("Job preferences updated successfully");
          // Refresh data from server
          fetchJobPreferences();
          return { success: true };
        }
        return { success: false, error: response };
      } catch (error) {
        console.error("Error saving job preferences:", error);
        const errorObj = error.response?.data?.error || error.response?.data;
        const errorMessage =
          errorObj?.errors?.[0]?.message ||
          errorObj?.message ||
          "Failed to save job preferences";
        toast.error(errorMessage);
        return { success: false, error: errorObj };
      } finally {
        setIsSaving(false);
      }
    },
    [jobTitles, jobTypes, workSchedules, payPreference, fetchJobPreferences]
  );

  // Async save handlers that return result for modals
  const handleSaveJobTitles = async (data) => {
    const result = await saveJobPreferences({ preferredJobTitles: data });
    if (result.success) {
      setJobTitles(data);
    }
    return result;
  };

  const handleSaveJobTypes = async (data) => {
    const result = await saveJobPreferences({ preferredJobTypes: data });
    if (result.success) {
      setJobTypes(data);
    }
    return result;
  };

  const handleSaveWorkSchedule = async (data) => {
    // Convert { shifts, days } to API format: array of { schedule, Days }
    const workSchedulePayload = data.shifts.map((shift, index) => ({
      schedule: shift,
      Days: data.days[index] || data.days[0] || "",
    }));
    const result = await saveJobPreferences({
      preferredWorkSchedules: workSchedulePayload,
    });
    if (result.success) {
      setWorkSchedules(workSchedulePayload);
    }
    return result;
  };

  const handleSavePay = async (data) => {
    const payPayload = {
      minimumSalary: parseFloat(data.basePay) || 0,
      frequency: data.payPeriod,
    };
    const result = await saveJobPreferences({ payPreference: payPayload });
    if (result.success) {
      setPayPreference(payPayload);
    }
    return result;
  };

  const handleDeleteJobTitles = async () => {
    const result = await saveJobPreferences({ preferredJobTitles: [] });
    if (result.success) {
      setJobTitles([]);
      setIsJobTitleModalOpen(false);
    }
  };

  const handleDeleteJobTypes = async () => {
    const result = await saveJobPreferences({ preferredJobTypes: [] });
    if (result.success) {
      setJobTypes([]);
      setIsJobTypeModalOpen(false);
    }
  };

  const handleDeleteWorkSchedule = async () => {
    const result = await saveJobPreferences({ preferredWorkSchedules: [] });
    if (result.success) {
      setWorkSchedules([]);
      setIsWorkScheduleModalOpen(false);
    }
  };

  const handleDeletePay = async () => {
    const result = await saveJobPreferences({
      payPreference: { minimumSalary: 0, frequency: "Per hour" },
    });
    if (result.success) {
      setPayPreference({ minimumSalary: "", frequency: "Per hour" });
      setIsPayModalOpen(false);
    }
  };

  const preferenceSections = [
    {
      icon: "/UserCircle.svg",
      title: "Add job titles",
      filledTitle: "Job Titles",
      description:
        "Select the roles or positions you're interested in applying for.",
      items: jobTitles,
      onAdd: () => setIsJobTitleModalOpen(true),
    },
    {
      icon: "/Suitcase.svg",
      title: "Add job types",
      filledTitle: "Job Types",
      description:
        "Choose whether you prefer full-time, part-time, temporary, or contract work.",
      items: jobTypes,
      onAdd: () => setIsJobTypeModalOpen(true),
    },
    {
      icon: "/Clock.svg",
      title: "Add work schedule",
      filledTitle: "Work Schedule",
      description:
        "Specify your preferred shift timings and weekly working hours.",
      items: workSchedules,
      onAdd: () => setIsWorkScheduleModalOpen(true),
    },
    {
      icon: "/CreditCard.svg",
      title: "Add pay",
      filledTitle: "Pay Preference",
      description:
        "Enter your expected salary range to receive matched job recommendations.",
      items: payPreference.minimumSalary ? [payPreference] : [],
      onAdd: () => setIsPayModalOpen(true),
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-state py-24">
        <div className="loading-spinner"></div>
        <p>Loading job preferences...</p>
      </div>
    );
  }

  return (
    <div className="page-shell pb-16">
      {/* Saving overlay — z-[60] keeps it above the z-50 sticky navbar */}
      {isSaving && (
        <div className="modal-backdrop z-[60]">
          <div className="modal-card max-w-xs items-center p-6">
            <div className="loading-spinner"></div>
            <span className="text-sm font-medium text-ink-muted">Saving...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Job preferences</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            /{" "}
            <Link to="/dashboard/profile" className="transition-colors hover:text-brand-action">
              Profile
            </Link>{" "}
            / <span className="font-medium text-ink">Job preferences</span>
          </p>
        </div>
      </div>

      {/* Job Preferences Content */}
      <div className="app-container pt-6 sm:pt-8">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-start gap-3">
          <BackButton
            fallback="/dashboard/profile"
            label="Back to profile"
            className="mt-0.5 h-10 w-10"
          />
          <div>
            <h2 className="page-title">Job preferences</h2>
            <p className="page-subtitle">
              Setting your preferences helps us match you with suitable hospitals and roles.
            </p>
          </div>
        </div>

        {/* Preference Sections */}
        <div className="mx-auto max-w-[872px] space-y-2">
          {preferenceSections.map((section, index) => (
            <div
              key={index}
              onClick={section.onAdd}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  section.onAdd();
                }
              }}
              className="panel panel-hover flex cursor-pointer items-center justify-between gap-4 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint">
                  <img
                    src={section.icon}
                    alt=""
                    className="h-5 w-5"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-brand-ink">
                    {section.items.length > 0
                      ? section.filledTitle
                      : section.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    {section.items.length > 0
                      ? `${section.items.length} item${
                          section.items.length > 1 ? "s" : ""
                        } saved`
                      : section.description}
                  </p>
                </div>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink-muted">
                <img
                  src={section.items.length > 0 ? "/Edit.svg" : "/plus.svg"}
                  alt=""
                  className="h-[18px] w-[18px]"
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddJobTitlesModal
        isOpen={isJobTitleModalOpen}
        onClose={() => setIsJobTitleModalOpen(false)}
        onSave={handleSaveJobTitles}
        onDelete={handleDeleteJobTitles}
        initialData={jobTitles}
      />

      <AddJobTypesModal
        isOpen={isJobTypeModalOpen}
        onClose={() => setIsJobTypeModalOpen(false)}
        onSave={handleSaveJobTypes}
        onDelete={handleDeleteJobTypes}
        initialData={jobTypes}
      />

      <AddWorkScheduleModal
        isOpen={isWorkScheduleModalOpen}
        onClose={() => setIsWorkScheduleModalOpen(false)}
        onSave={handleSaveWorkSchedule}
        onDelete={handleDeleteWorkSchedule}
        initialData={{
          shifts: workSchedules.map((ws) => ws.schedule),
          days: workSchedules.map((ws) => ws.Days),
        }}
      />

      <AddPayModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSave={handleSavePay}
        onDelete={handleDeletePay}
        initialData={{
          basePay: payPreference.minimumSalary?.toString() || "",
          payPeriod: payPreference.frequency || "Per hour",
        }}
      />
    </div>
  );
};

export default JobPreferencesPage;
