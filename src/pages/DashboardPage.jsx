import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import JobCard from "../components/JobCard";
import JobDetailsPanel from "../components/JobDetailsPanel";
import ApplyJobModel from "../components/ApplyJobModel";
import { isJobApplied } from "../utils/jobStorage";
import { jobService } from "../services/jobService";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";

const DATE_OPTIONS = [
  { label: "All time", value: "" },
  { label: "Last 24 hours", value: "24hours" },
  { label: "Last 3 days", value: "3days" },
  { label: "Last 7 days", value: "7days" },
  { label: "Last 14 days", value: "14days" },
];

const JOB_TYPE_OPTIONS = [
  { label: "All types", value: "" },
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
  { label: "Temporary", value: "Temporary" },
  { label: "Internship", value: "Internship" },
  { label: "Freelance", value: "Freelance" },
];

const WORK_MODE_OPTIONS = [
  { label: "All modes", value: "" },
  { label: "On-site", value: "On-site" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
];

const EXPERIENCE_OPTIONS = [
  { label: "All levels", value: "" },
  { label: "Entry Level", value: "Entry" },
  { label: "Mid Level", value: "Mid" },
  { label: "Senior Level", value: "Senior" },
  { label: "Lead", value: "Lead" },
];

const CATEGORY_OPTIONS = [
  { label: "All categories", value: "" },
  { label: "Technology", value: "Technology" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Sales", value: "Sales" },
  { label: "Retail", value: "Retail" },
  { label: "Finance", value: "Finance" },
  { label: "Education", value: "Education" },
  { label: "Hospitality", value: "Hospitality" },
  { label: "Logistics", value: "Logistics" },
  { label: "Other", value: "Other" },
];

const SALARY_OPTIONS = [
  { label: "Any pay", value: "" },
  { label: "$30,000+", value: "30000" },
  { label: "$50,000+", value: "50000" },
  { label: "$75,000+", value: "75000" },
  { label: "$100,000+", value: "100000" },
  { label: "$150,000+", value: "150000" },
];

const SEARCH_TIPS = [
  "Try broader or fewer keywords",
  'Search a nearby location or try "Remote"',
  "Check back soon for new opportunities",
];

const FilterDropdown = ({ label, value, options, onChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  const isActive = value !== undefined && value !== null && value !== "";
  const selectedOption = options.find(
    (option) => String(option.value) === String(value ?? "")
  );
  const activeLabel = selectedOption?.label || value;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeIndex, isOpen]);

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectOption = (optionValue) => {
    onChange(optionValue);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const openDropdown = () => {
    const selectedIndex = options.findIndex(
      (option) => String(option.value) === String(value ?? "")
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        closeDropdown();
      }
      return;
    }

    if (event.key === "Tab") {
      closeDropdown();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
      } else if (activeIndex >= 0 && options[activeIndex]) {
        selectOption(options[activeIndex].value);
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openDropdown();
        return;
      }

      if (options.length === 0) return;

      setActiveIndex((current) => {
        if (event.key === "ArrowDown") {
          return current < options.length - 1 ? current + 1 : 0;
        }
        return current > 0 ? current - 1 : options.length - 1;
      });
      return;
    }

    if (event.key === "Home" && isOpen && options.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === "End" && isOpen && options.length > 0) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}${isActive ? `: ${activeLabel}` : ""}`}
        className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30 focus-visible:ring-offset-2 sm:min-h-10 sm:px-4 sm:text-sm ${
          isActive
            ? "border-brand-action/40 bg-brand-tint text-brand-action"
            : "border-line bg-white text-ink hover:border-brand-action/50 hover:bg-surface-raised"
        }`}
      >
        <span className="max-w-[150px] truncate">
          {isActive ? `${label}: ${activeLabel}` : label}
        </span>

        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-action" : "text-ink-muted"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m6 9 6 6 6-6"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={`${label} options`}
          className="absolute left-0 top-full z-[100] mt-2 max-h-72 w-max min-w-[220px] max-w-[min(280px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line-weak bg-white p-1.5 shadow-dropdown"
        >
          {options.map((option, index) => {
            const isSelected =
              String(value ?? "") === String(option.value);
            const isKeyboardActive = activeIndex === index;

            return (
              <button
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option.value)}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors duration-150 ${
                  isSelected
                    ? "bg-brand-tint font-semibold text-brand-action"
                    : isKeyboardActive
                      ? "bg-surface-raised text-brand-ink"
                      : "text-ink hover:bg-surface-raised"
                }`}
              >
                <span className="min-w-0 flex-1">{option.label}</span>
                {isSelected && (
                  <svg
                    className="h-4 w-4 shrink-0 text-brand-action"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="m5 12 4 4L19 6"
                    />
                  </svg>
                )}
              </button>
            );
          })}

          {isActive && (
            <div className="mt-1 border-t border-line-weak pt-1">
              <button
                type="button"
                onClick={() => {
                  onClear();
                  closeDropdown();
                  triggerRef.current?.focus();
                }}
                className="w-full rounded-lg px-3.5 py-2 text-left text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-brand-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="panel space-y-3 p-4 sm:p-5" aria-hidden="true">
    <div className="flex justify-between items-start">
      <div className="w-2/3 space-y-2">
        <div className="skeleton h-5 w-3/4"></div>
        <div className="skeleton h-4 w-1/2"></div>
      </div>
      <div className="skeleton h-8 w-8"></div>
    </div>
    <div className="skeleton h-3 w-1/3"></div>
    <div className="flex gap-2">
      <div className="skeleton h-6 w-28"></div>
      <div className="skeleton h-6 w-20"></div>
    </div>
    <div className="space-y-1 pt-1">
      <div className="skeleton h-3 w-full"></div>
      <div className="skeleton h-3 w-4/5"></div>
    </div>
  </div>
);

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const q = searchParams.get("q") || "";
  const where = searchParams.get("where") || "";
  const employmentType = searchParams.get("employmentType") || "";
  const workMode = searchParams.get("workMode") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const category = searchParams.get("category") || "";
  const salaryMin = searchParams.get("salaryMin") || "";
  const datePosted = searchParams.get("datePosted") || "";
  const sort = searchParams.get("sort") || "date";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);

  // API related states
  const [jobsData, setJobsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const requestIdRef = useRef(0);

  // Helper to update URL params
  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "" || val === "all") {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Check if any filters are applied
  const hasActiveFilters = Boolean(
    q || where || employmentType || workMode || experienceLevel || category || salaryMin || datePosted
  );

  const handleClearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Fetch jobs from API
  const fetchAllJobs = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setFetchError("");
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sort,
      };

      if (q) params.q = q;
      if (where) params.where = where;
      if (employmentType) params.employmentType = employmentType;
      if (workMode) params.workMode = workMode;
      if (experienceLevel) params.experienceLevel = experienceLevel;
      if (category) params.category = category;
      if (salaryMin) params.salaryMin = salaryMin;
      if (datePosted) params.datePosted = datePosted;

      const response = await jobService.getAllJobs(params);

      if (requestId !== requestIdRef.current) return;

      if (response.success && response.data) {
        const fetchedJobs = (response.data.jobs || []).map((job) => ({
          ...job,
          id: job._id || job.id,
          // Server flag is authoritative; localStorage is a fallback for
          // applications recorded in this browser.
          isApplied: Boolean(job.isApplied) || isJobApplied(job._id || job.id),
        }));

        setJobsData(fetchedJobs);
        setTotalPages(response.data.totalPages || 1);
        setTotalJobs(response.data.total || 0);

        // Update selection without adding selectedJobId to the fetch dependencies
        setSelectedJobId((previousSelectedId) => {
          if (fetchedJobs.length === 0) return null;

          const stillSelected = fetchedJobs.some(
            (job) => (job._id || job.id) === previousSelectedId
          );

          return stillSelected
            ? previousSelectedId
            : fetchedJobs[0]._id || fetchedJobs[0].id;
        });
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      const message = getErrorMessage(
        error,
        "We could not load jobs right now. Please try again."
      );
      setFetchError(message);
      setJobsData([]);
      setSelectedJobId(null);
      setSelectedJobDetails(null);
      setTotalJobs(0);
      setTotalPages(1);
      toast.error(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, sort, q, where, employmentType, workMode, experienceLevel, category, salaryMin, datePosted]);

  // Fetch jobs whenever search parameters change
  useEffect(() => {
    fetchAllJobs();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchAllJobs]);

  // Fetch detailed job when selected
  const fetchJobDetails = useCallback(async (jobId) => {
    if (!jobId) return;
    try {
      const response = await jobService.getJobDetails(jobId);
      if (response.success && response.data) {
        setSelectedJobDetails({
          ...response.data,
          id: response.data._id || response.data.id,
          isApplied:
            Boolean(response.data.isApplied) ||
            isJobApplied(response.data._id || response.data.id),
        });
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setSelectedJobDetails(null);
    }
  }, []);

  const selectedJobFromList = jobsData.find((job) => (job._id || job.id) === selectedJobId);
  const selectedJob = selectedJobDetails || selectedJobFromList;
  const isEmptyState = !isLoading && !fetchError && jobsData.length === 0;

  // Handle Search from SearchBar
  const handleSearch = ({ q: searchQ, where: searchWhere, jobQuery, location }) => {
    const finalQ = searchQ !== undefined ? searchQ : jobQuery;
    const finalWhere = searchWhere !== undefined ? searchWhere : location;
    updateParams({
      q: finalQ,
      where: finalWhere,
      page: 1,
    });
  };

  const handleSaveJob = async (jobId) => {
    try {
      const response = await jobService.toggleSaveJob(jobId);
      if (response.success) {
        setJobsData((prevJobs) =>
          prevJobs.map((job) =>
            (job._id || job.id) === jobId ? { ...job, isSaved: response.data.isSaved } : job
          )
        );
        if (selectedJobDetails && (selectedJobDetails._id || selectedJobDetails.id) === jobId) {
          setSelectedJobDetails((prev) => ({ ...prev, isSaved: response.data.isSaved }));
        }
        toast.success(
          response.message ||
            (response.data.isSaved ? "Job saved successfully" : "Job unsaved successfully")
        );
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(getErrorMessage(error, "Failed to save job"));
    }
  };

  const handleApply = (jobId) => {
    const job = jobsData.find((j) => (j._id || j.id) === jobId) || selectedJob;
    // Never open the apply flow for a job the user already applied to
    if (job?.isApplied || isJobApplied(jobId)) {
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

  const handleApplySubmit = () => {
    if (!jobToApply) return;

    const appliedJobId = jobToApply._id || jobToApply.id;
    setJobsData((prevJobs) =>
      prevJobs.map((job) =>
        (job._id || job.id) === appliedJobId
          ? { ...job, isApplied: true }
          : job
      )
    );
    setSelectedJobDetails((prev) =>
      prev && (prev._id || prev.id) === appliedJobId
        ? { ...prev, isApplied: true }
        : prev
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.info("Link copied to clipboard!");
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => updateParams({ page: i })}
          className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-[6px] text-xs sm:text-sm font-bold transition cursor-pointer ${
            currentPage === i
              ? "bg-brand-action text-white"
              : "bg-white text-ink border border-line hover:bg-surface"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="page-shell">
      {/* Top Search Area */}
      <div className="border-b border-line-weak bg-white">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <SearchBar
            initialQuery={q}
            initialLocation={where}
            onSearch={handleSearch}
            jobPlaceholder="Job title, keywords, or company"
            locationPlaceholder="City, state, zip code, or 'remote'"
            searchButtonText="Find jobs"
          />

          {/* Filter Chips Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-weak pt-4">
            <FilterDropdown
              label="Date posted"
              value={datePosted}
              options={DATE_OPTIONS}
              onChange={(val) => updateParams({ datePosted: val, page: 1 })}
              onClear={() => updateParams({ datePosted: "", page: 1 })}
            />

            <FilterDropdown
              label="Job type"
              value={employmentType}
              options={JOB_TYPE_OPTIONS}
              onChange={(val) => updateParams({ employmentType: val, page: 1 })}
              onClear={() => updateParams({ employmentType: "", page: 1 })}
            />

            <FilterDropdown
              label="Work mode"
              value={workMode}
              options={WORK_MODE_OPTIONS}
              onChange={(val) => updateParams({ workMode: val, page: 1 })}
              onClear={() => updateParams({ workMode: "", page: 1 })}
            />

            <FilterDropdown
              label="Experience"
              value={experienceLevel}
              options={EXPERIENCE_OPTIONS}
              onChange={(val) => updateParams({ experienceLevel: val, page: 1 })}
              onClear={() => updateParams({ experienceLevel: "", page: 1 })}
            />

            <FilterDropdown
              label="Category"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(val) => updateParams({ category: val, page: 1 })}
              onClear={() => updateParams({ category: "", page: 1 })}
            />

            <FilterDropdown
              label="Salary"
              value={salaryMin}
              options={SALARY_OPTIONS}
              onChange={(val) => updateParams({ salaryMin: val, page: 1 })}
              onClear={() => updateParams({ salaryMin: "", page: 1 })}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-semibold text-brand-action hover:underline px-2 py-1 cursor-pointer ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Pane Container */}
      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr] gap-6">
          {/* Left Column: Job List */}
          <div className="space-y-4">
            {/* Header: Result count + Sort */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line-weak pb-3">
              <div className="min-w-0 flex-1 basis-[220px]">
                <h1 className="truncate text-base font-bold leading-snug text-brand-ink sm:text-lg">
                  {q || where ? (
                    <>
                      {q && <span>{q} jobs </span>}
                      {where && <span className="text-ink-muted font-normal">in {where}</span>}
                    </>
                  ) : (
                    "Explore jobs"
                  )}
                  <span className="ml-2 inline-block text-sm font-normal tabular-nums text-ink-muted">
                    ({totalJobs})
                  </span>
                </h1>
              </div>

              {/* Sort selector */}
              <div
                className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
                role="group"
                aria-label="Sort jobs by"
              >
                <span className="text-ink-muted font-medium hidden sm:inline">Sort by:</span>
                <div className="inline-flex h-8 shrink-0 items-center rounded-[6px] border border-line bg-white p-0.5 sm:h-9">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => updateParams({ sort: "date", page: 1 })}
                    aria-pressed={sort === "date"}
                    className={`flex h-full w-[68px] sm:w-[76px] items-center justify-center whitespace-nowrap rounded-[4px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30 focus-visible:ring-offset-1 sm:text-sm ${
                      sort === "date"
                        ? "bg-brand-action text-white"
                        : "text-ink-muted hover:text-brand-ink"
                    }`}
                  >
                    Date
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => updateParams({ sort: "relevance", page: 1 })}
                    aria-pressed={sort === "relevance"}
                    className={`flex h-full w-[78px] sm:w-[86px] items-center justify-center whitespace-nowrap rounded-[4px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30 focus-visible:ring-offset-1 sm:text-sm ${
                      sort === "relevance"
                        ? "bg-brand-action text-white"
                        : "text-ink-muted hover:text-brand-ink"
                    }`}
                  >
                    Relevance
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => updateParams({ sort: "salary", page: 1 })}
                    aria-pressed={sort === "salary"}
                    className={`flex h-full w-[68px] sm:w-[76px] items-center justify-center whitespace-nowrap rounded-[4px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30 focus-visible:ring-offset-1 sm:text-sm ${
                      sort === "salary"
                        ? "bg-brand-action text-white"
                        : "text-ink-muted hover:text-brand-ink"
                    }`}
                  >
                    Salary
                  </button>
                </div>
              </div>
            </div>

            {/* Job Cards or Loading */}
            <div
              className={`space-y-3 ${
                isLoading && jobsData.length > 0 ? "pointer-events-none opacity-60" : ""
              }`}
              aria-busy={isLoading}
            >
              {isLoading && jobsData.length === 0 ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : fetchError ? (
                <div className="alert alert-error" role="alert">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.2A2 2 0 003.82 21h16.36a2 2 0 001.73-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold">Could not load jobs</p>
                    <p className="mt-1 text-sm opacity-90">{fetchError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAllJobs}
                    className="btn btn-secondary btn-sm shrink-0"
                  >
                    Retry
                  </button>
                </div>
              ) : isEmptyState ? (
                <div
                  className="panel flex min-h-[460px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[520px] sm:px-10 sm:py-12"
                  role="status"
                  aria-live="polite"
                >
                  <div className="mx-auto flex w-full max-w-lg flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-action/20 bg-brand-tint text-brand-action shadow-xs sm:h-20 sm:w-20">
                      <svg
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    <h3 className="mt-5 text-xl font-bold leading-snug tracking-tight text-brand-ink sm:text-2xl">
                      No jobs found matching your criteria
                    </h3>
                    <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-ink-muted sm:text-base">
                      We couldn&apos;t find any open positions matching your search. Try broadening your keywords, resetting filters, or checking back soon.
                    </p>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="btn btn-primary mt-6 min-h-11 rounded-xl px-6 font-semibold shadow-sm transition-all hover:shadow-card"
                      >
                        Clear all filters
                      </button>
                    )}

                    <div className="mt-8 w-full rounded-2xl border border-line-weak bg-surface-raised p-5 text-left sm:p-6">
                      <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
                        Suggestions to find more jobs
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {SEARCH_TIPS.map((tip) => (
                          <li
                            key={tip}
                            className="flex items-start gap-2.5 text-xs sm:text-sm leading-5 text-ink-muted"
                          >
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-action">
                              <svg
                                className="h-2.5 w-2.5"
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
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                jobsData.map((job) => {
                  const jobId = job._id || job.id;
                  return (
                    <JobCard
                      key={jobId}
                      job={job}
                      isActive={selectedJobId === jobId}
                      searchQuery={q}
                      onSave={handleSaveJob}
                      onClick={() => {
                        setSelectedJobId(jobId);
                        setSelectedJobDetails(null);
                        fetchJobDetails(jobId);
                        setIsMobileDetailsOpen(true);
                      }}
                    />
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-center gap-2 pt-4 pb-6">
                <button
                  type="button"
                  onClick={() => updateParams({ page: Math.max(1, currentPage - 1) })}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>

                {renderPagination()}

                <button
                  type="button"
                  onClick={() => updateParams({ page: Math.min(totalPages, currentPage + 1) })}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Job Details Panel */}
          <div
            className={
              isEmptyState
                ? "min-w-0 lg:sticky lg:top-24 lg:mt-[3.75rem] lg:self-stretch"
                : `fixed inset-0 z-50 min-w-0 overflow-y-auto bg-surface-page lg:sticky lg:top-24 lg:z-auto lg:block lg:h-[calc(100vh-7.5rem)] lg:bg-transparent ${
                    isMobileDetailsOpen ? "block" : "hidden"
                  }`
            }
          >
            <JobDetailsPanel
              job={selectedJob}
              onApply={handleApply}
              onSave={handleSaveJob}
              onShare={handleShare}
              onBack={() => setIsMobileDetailsOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyJobModel
        isOpen={isApplyModalOpen}
        onClose={handleCloseApplyModal}
        job={jobToApply}
        onSubmit={handleApplySubmit}
      />
    </div>
  );
};

export default DashboardPage;
