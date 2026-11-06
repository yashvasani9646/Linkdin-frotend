import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ApplyJobModel from "../components/ApplyJobModel";
import { CompanyLogo } from "../icons/CompanyLogo";
import { BookmarkSimpleFill } from "../icons/BookmarkSimpleFill";
import { BookmarkSimple } from "../icons/BookmarkSimple";
import { jobService } from "../services/jobService";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import { formatSalary } from "../utils/formatSalary";

const MySavedJobsPage = () => {
  const [searchParams] = useSearchParams();
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get("tab") === "applied" ? "applied" : "saved"
  );
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [isLoadingApplied, setIsLoadingApplied] = useState(false);

  // Fetch saved jobs from API
  const loadSavedJobs = useCallback(async () => {
    setIsLoadingSaved(true);
    try {
      const response = await jobService.getSavedJobs();
      if (response.success && response.data) {
        // Map savedJobs from API response
        const mapped = (response.data.savedJobs || []).map((job) => ({
          id: job._id || job.id,
          title: job.jobTitle || job.title || "Untitled Job",
          company: job.companyName || job.company || "-",
          location:
            [job.location?.city, job.location?.state]
              .filter(Boolean)
              .join(", ") || "-",
          distance: "-",
          rate: formatSalary(job) || "-",
          savedOn: job.savedAt
            ? new Date(job.savedAt).toLocaleDateString()
            : "",
          status: "saved",
          isSaved: true,
          jobStatus: job.status,
          isApplied: Boolean(job.isApplied),
          _original: job,
        }));
        setSavedJobs(mapped);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      toast.error(getErrorMessage(error, "Failed to load saved jobs"));
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  // Fetch applied jobs from API
  const loadAppliedJobs = useCallback(async () => {
    setIsLoadingApplied(true);
    try {
      const response = await jobService.getMyApplications({ limit: 100 });
      if (response.success && response.data) {
        // Map applications from API response
        const mapped = (response.data.applications || []).map(
          (application) => ({
            id: application._id,
            jobId: application.job?._id,
            title:
              application.job?.jobTitle ||
              application.job?.title ||
              "Untitled Job",
            company: application.job?.companyName || application.job?.company || "-",
            location:
              [
                application.job?.location?.city,
                application.job?.location?.state,
              ]
                .filter(Boolean)
                .join(", ") || "-",
            distance: "-",
            rate: formatSalary(application.job) || "-",
            appliedOn: application.appliedAt
              ? new Date(application.appliedAt).toLocaleDateString()
              : "",
            applicationStatus: application.status, // New, Shortlisted, Interviewed, Rejected, Accepted
            status: "applied",
            isApplied: true,
            employmentType: application.job?.employmentType || "-",
            tag: application.job?.tag || "-",
            _original: application,
          })
        );
        setAppliedJobs(mapped);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
      toast.error(getErrorMessage(error, "Failed to load applied jobs"));
    } finally {
      setIsLoadingApplied(false);
    }
  }, []);

  // Fetch both saved and applied jobs on page mount
  useEffect(() => {
    loadSavedJobs();
    loadAppliedJobs();
  }, [loadSavedJobs, loadAppliedJobs]);

  // Get filtered jobs based on active tab
  const filteredJobs = useMemo(() => {
    return activeTab === "saved" ? savedJobs : appliedJobs;
  }, [activeTab, savedJobs, appliedJobs]);

  // Update selected job when filtered list changes
  useEffect(() => {
    if (
      filteredJobs.length > 0 &&
      (!selectedJobId || !filteredJobs.find((j) => j.id === selectedJobId))
    ) {
      setSelectedJobId(filteredJobs[0].id);
    } else if (filteredJobs.length === 0) {
      setSelectedJobId(null);
    }
  }, [filteredJobs, selectedJobId]);

  // Job ids the user has already applied to (server-backed list)
  const appliedJobIds = useMemo(
    () => new Set(appliedJobs.map((a) => a.jobId).filter(Boolean)),
    [appliedJobs]
  );

  const tabs = [
    {
      id: "saved",
      label: "Saved",
      count: savedJobs.length,
    },
    {
      id: "applied",
      label: "Applied",
      count: appliedJobs.length,
    },
  ];

  const handleApplyNow = (job) => {
    // Never allow re-applying to the same job from this page either
    if (job?.status === "applied" || job?.isApplied || appliedJobIds.has(job?.id)) {
      toast.info("You have already applied to this job");
      return;
    }
    setJobToApply(job);
    setIsApplyModalOpen(true);
  };

  const handleCloseApplyModal = () => {
    setIsApplyModalOpen(false);
    setJobToApply(null);
  };

  const toggleSavedJob = async (jobId) => {
    try {
      const response = await jobService.toggleSaveJob(jobId);
      if (response.success) {
        // Refresh the saved jobs list
        loadSavedJobs();
        toast.success(response.message || "Job unsaved successfully");
      }
    } catch (error) {
      console.error("Error toggling save job:", error);
      toast.error(getErrorMessage(error, "Failed to update saved job"));
    }
  };

  const handleApplySubmit = () => {
    // Refresh the lists after successful application
    loadSavedJobs();
    loadAppliedJobs();
    setIsApplyModalOpen(false);
    setJobToApply(null);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const isLoading = activeTab === "saved" ? isLoadingSaved : isLoadingApplied;

  return (
    <div className="page-shell pb-16">
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">My saved jobs</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            / <span className="font-medium text-ink">My saved jobs</span>
          </p>
        </div>
      </div>

      <div className="app-container pt-6 sm:pt-8">
        <div className="no-scrollbar mb-6 inline-flex max-w-full overflow-x-auto rounded-full border border-line-weak bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-action text-white shadow-sm"
                  : "text-ink-muted hover:bg-surface-raised hover:text-brand-ink"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your jobs...</p>
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const alreadyApplied = job.status === "applied" || Boolean(job.isApplied) || appliedJobIds.has(job.id);
              return (
              <div
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`panel panel-hover flex cursor-pointer flex-col items-start justify-between gap-4 p-4 transition sm:p-5 md:flex-row md:items-center ${
                  selectedJobId === job.id ? "border-brand-action bg-brand-tint/20" : ""
                }`}
              >
                <div className="flex w-full gap-4 md:w-auto">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-lg font-semibold text-brand-action">
                    <CompanyLogo />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-brand-ink">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-ink-muted">
                      {job.company}
                    </p>
                    <p className="text-sm text-ink-muted">{job.location}</p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {job.status === "saved" ? job.savedOn : job.appliedOn}
                    </p>
                  </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                  {alreadyApplied ? (
                    <span className="badge badge-success flex-1 justify-center px-4 py-2.5 md:flex-none">
                      Applied
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyNow(job);
                      }}
                      className="btn btn-primary flex-1 md:flex-none"
                    >
                      Apply now
                    </button>
                  )}
                  {job.status === "saved" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavedJob(job.id);
                      }}
                      aria-label={job.isSaved ? "Unsave job" : "Save job"}
                      className="btn-icon h-11 w-11"
                    >
                      {job.isSaved ? (
                        <BookmarkSimpleFill className="h-5 w-5" />
                      ) : (
                        <BookmarkSimple className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              );
            })
          ) : activeTab === "applied" ? (
            <div className="empty-state">
              <img
                src="/Empty_Applied.svg"
                alt=""
                className="mb-6 w-full max-w-[260px]"
              />
              <h2 className="text-xl font-bold text-brand-ink">No applications yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
                You haven't applied to any jobs. Start exploring opportunities to get started.
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <h2 className="text-xl font-bold text-brand-ink">
                You have no jobs in this list yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
                Start saving roles to keep track of opportunities that interest you.
              </p>
            </div>
          )}
        </div>
      </div>
      <ApplyJobModel
        isOpen={isApplyModalOpen}
        onClose={handleCloseApplyModal}
        job={jobToApply}
        onSubmit={handleApplySubmit}
      />
    </div>
  );
};

export default MySavedJobsPage;
