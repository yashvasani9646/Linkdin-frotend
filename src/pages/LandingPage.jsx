import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { jobService } from "../services/jobService";
import { getErrorMessage } from "../utils/errorHandler";
import { formatSalary } from "../utils/formatSalary";
import { timeAgo } from "../utils/dateUtils";

const CATEGORIES = [
  {
    name: "Technology",
    description: "Software, data, cloud, and IT",
    icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    name: "Healthcare",
    description: "Clinical, care, and wellness roles",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  {
    name: "Sales",
    description: "Account, growth, and revenue",
    icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    name: "Retail",
    description: "Store, service, and operations",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  },
  {
    name: "Finance",
    description: "Accounting, banking, and analysis",
    icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0-4v2m0 12v2M4 6h16v12H4V6z",
  },
  {
    name: "Education",
    description: "Teaching, training, and support",
    icon: "M12 14l9-5-9-5-9 5 9 5zm0 0v7m-5-4.5v-3m10 3v-3",
  },
  {
    name: "Hospitality",
    description: "Food, travel, and guest services",
    icon: "M4 7h16M6 7l1 13h10l1-13M10 11v5m4-5v5",
  },
  {
    name: "Logistics",
    description: "Supply chain, delivery, and transport",
    icon: "M3 7h11v10H3V7zm11 4h4l3 3v3h-7v-6zM7 20a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z",
  },
];

const POPULAR_SEARCHES = [
  { label: "Remote", params: { where: "remote" } },
  { label: "Software Engineer", params: { q: "Software Engineer" } },
  { label: "Customer Service", params: { q: "Customer Service" } },
  { label: "Registered Nurse", params: { q: "Registered Nurse" } },
  { label: "Project Manager", params: { q: "Project Manager" } },
  { label: "Data Analyst", params: { q: "Data Analyst" } },
];

const STEPS = [
  {
    title: "Search with clarity",
    description:
      "Use focused filters to find roles that match your skills, location, pay expectations, and preferred way of working.",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    title: "Keep the best in view",
    description:
      "Save promising roles, compare the details, and keep your shortlist organized without losing track of what matters.",
    icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
  },
  {
    title: "Apply with confidence",
    description:
      "Build a complete profile, apply to openings, and follow your conversations and application progress in one place.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const getJobId = (job) => job?._id || job?.id;

const getJobLocation = (job) => {
  if (typeof job?.location === "string") return job.location;
  return (
    [job?.location?.city, job?.location?.state].filter(Boolean).join(", ") ||
    [job?.city, job?.state].filter(Boolean).join(", ") ||
    "Location not specified"
  );
};

const getInitials = (company = "Company") =>
  company
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

const FeaturedJobCard = ({ job }) => {
  const title = job?.jobTitle || job?.title || "Open role";
  const company = job?.companyName || job?.company || "Company";
  const location = getJobLocation(job);
  const salary = formatSalary(job);
  const posted = timeAgo(job?.createdAt);
  const searchParams = new URLSearchParams();
  searchParams.set("q", title);
  if (job?.location?.city) searchParams.set("where", job.location.city);

  return (
    <Link
      to={`/dashboard?${searchParams.toString()}`}
      className="panel panel-hover group flex h-full flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/40 sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-sm font-bold text-brand-action"
          aria-hidden="true"
        >
          {getInitials(company)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-brand-ink transition-colors group-hover:text-brand-action sm:text-lg">
            {title}
          </h3>
          <p className="mt-1 truncate text-sm font-medium text-ink-muted">
            {company}
          </p>
        </div>
        {job?.isNew ? <span className="badge badge-success">New</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <svg
          className="h-4 w-4 shrink-0 text-ink-subtle"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="line-clamp-1">{location}</span>
        {job?.workMode ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{job.workMode}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {salary ? <span className="badge badge-neutral">{salary}</span> : null}
        {job?.employmentType ? (
          <span className="badge badge-neutral">{job.employmentType}</span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line-weak pt-4">
        <span className="text-xs text-ink-subtle">
          {posted ? `Posted ${posted}` : "Open opportunity"}
        </span>
        <span className="link-arrow">
          Explore
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14m-5-5l5 5-5 5"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
};

const JobSkeleton = () => (
  <div className="panel space-y-4 p-5 sm:p-6" aria-hidden="true">
    <div className="flex gap-3.5">
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
    <div className="skeleton h-4 w-2/3" />
    <div className="flex gap-2">
      <div className="skeleton h-6 w-28 rounded-full" />
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
    <div className="skeleton h-9 w-full" />
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(null);
  const [jobsStatus, setJobsStatus] = useState("loading");
  const [jobsError, setJobsError] = useState("");

  const runSearch = useCallback(
    ({ q = "", where = "" } = {}) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (where.trim()) params.set("where", where.trim());
      navigate(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [navigate]
  );

  const handleSearch = ({ q, where, jobQuery, location }) => {
    runSearch({ q: q || jobQuery || "", where: where || location || "" });
  };

  const loadFeaturedJobs = useCallback(async () => {
    setJobsStatus("loading");
    setJobsError("");

    try {
      const response = await jobService.getAllJobs({
        page: 1,
        limit: 6,
        sort: "date",
      });

      if (response?.success && response.data) {
        const jobs = Array.isArray(response.data.jobs)
          ? response.data.jobs
          : [];
        setFeaturedJobs(jobs);
        setTotalJobs(
          typeof response.data.total === "number" ? response.data.total : null
        );
        setJobsStatus("success");
      } else {
        throw new Error("The job board returned an unexpected response.");
      }
    } catch (error) {
      setFeaturedJobs([]);
      setTotalJobs(null);
      setJobsStatus("error");
      setJobsError(
        getErrorMessage(error, "We could not load open roles right now.")
      );
    }
  }, []);

  useEffect(() => {
    loadFeaturedJobs();
  }, [loadFeaturedJobs]);

  const latestJob = featuredJobs[0];
  const activeRolesLabel =
    jobsStatus === "loading"
      ? "Checking the live job board"
      : jobsStatus === "error"
        ? "Role count unavailable right now"
        : totalJobs === 0
          ? "No active roles right now"
          : totalJobs !== null
            ? `${totalJobs.toLocaleString()} active ${
                totalJobs === 1 ? "role" : "roles"
              } available`
            : "Live roles from real employers";

  return (
    <div>
      <section className="hero-mesh border-b border-line-weak">
        <div className="app-container grid items-center gap-12 py-16 sm:py-20 lg:py-24 xl:grid-cols-[1.08fr_0.92fr] xl:gap-16">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-action/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-action shadow-card">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              A better way to find your next role
            </div>

            <h1 className="display-title mt-6 max-w-3xl">
              Find work that fits the{" "}
              <span className="text-brand-action">life you want.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
              Explore real openings, compare what matters, and move through
              your job search with less noise and more clarity.
            </p>

            <div className="mt-8 max-w-3xl">
              <SearchBar
                onSearch={handleSearch}
                jobPlaceholder="Job title or keyword"
                locationPlaceholder="City, state, or remote"
                searchButtonText="Search jobs"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Popular
              </span>
              {POPULAR_SEARCHES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => runSearch(item.params)}
                  className="chip"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Real employers, live roles
              </span>
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save and compare roles
              </span>
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Track every application
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full min-w-0 max-w-md xl:max-w-none">
            <div
              className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-brand-tint blur-2xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-8 right-4 h-32 w-32 rounded-full bg-success-soft blur-2xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-5 shadow-panel sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-eyebrow">On the board now</p>
                  <p className="mt-1 text-sm text-ink-muted" aria-live="polite">
                    {activeRolesLabel}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  <span className="sr-only">Live job board</span>
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-line-weak bg-surface-raised/70 p-4">
                {jobsStatus === "loading" ? (
                  <div className="space-y-3" aria-hidden="true">
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-6 w-4/5" />
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton mt-4 h-10 w-full rounded-lg" />
                  </div>
                ) : latestJob ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                          Latest opportunity
                        </p>
                        <h2 className="mt-2 text-xl font-bold leading-snug text-brand-ink">
                          {latestJob.jobTitle ||
                            latestJob.title ||
                            "Open role"}
                        </h2>
                        <p className="mt-1 truncate text-sm font-medium text-ink-muted">
                          {latestJob.companyName ||
                            latestJob.company ||
                            "Company"}
                        </p>
                      </div>
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-action text-sm font-bold text-white"
                        aria-hidden="true"
                      >
                        {getInitials(
                          latestJob.companyName || latestJob.company
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {latestJob.workMode ? (
                        <span className="badge badge-brand">
                          {latestJob.workMode}
                        </span>
                      ) : null}
                      {latestJob.employmentType ? (
                        <span className="badge badge-neutral">
                          {latestJob.employmentType}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                      <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">
                        {getJobLocation(latestJob)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        runSearch({
                          q:
                            latestJob.jobTitle ||
                            latestJob.title ||
                            "",
                          where: latestJob.location?.city || "",
                        })
                      }
                      className="btn btn-primary mt-5 w-full"
                    >
                      Explore this role
                    </button>
                  </>
                ) : jobsStatus === "error" ? (
                  <>
                    <div className="icon-tile">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.2A2 2 0 003.82 21h16.36a2 2 0 001.73-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-brand-ink">
                      We could not load roles
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {jobsError}
                    </p>
                    <button
                      type="button"
                      onClick={loadFeaturedJobs}
                      className="btn btn-secondary mt-4 w-full"
                    >
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="icon-tile">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-brand-ink">
                      {totalJobs === 0
                        ? "No active roles right now"
                        : "Start with a search"}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {totalJobs === 0
                        ? "New opportunities appear as employers publish them. Check back soon or browse the job board."
                        : "Search by role, skill, company, or location to see current openings."}
                    </p>
                    <button
                      type="button"
                      onClick={() => runSearch()}
                      className="btn btn-secondary mt-4 w-full"
                    >
                      Browse jobs
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="explore" className="bg-white py-16 sm:py-20">
        <div className="app-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-eyebrow">Explore by field</p>
              <h2 className="section-title mt-2">
                Find a path that feels like yours
              </h2>
              <p className="page-subtitle">
                Browse open roles across the fields employers are hiring for
                today.
              </p>
            </div>
            <Link to="/dashboard" className="link-arrow shrink-0">
              Browse all jobs
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14m-5-5l5 5-5 5"
                />
              </svg>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.name}
                to={`/dashboard?category=${encodeURIComponent(category.name)}`}
                className="category-card group"
              >
                <div className="icon-tile transition-colors group-hover:bg-brand-action group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d={category.icon}
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h3 className="text-base font-bold text-brand-ink">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-ink-muted">
                    {category.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-action">
                    Explore roles
                    <svg
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14m-5-5l5 5-5 5"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-page py-16 sm:py-20">
        <div className="app-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-eyebrow">Fresh opportunities</p>
              <h2 className="section-title mt-2">
                Roles worth a closer look
              </h2>
              <p className="page-subtitle">
                {totalJobs !== null && totalJobs > 0 && featuredJobs.length > 0
                  ? `Showing the latest ${featuredJobs.length} of ${totalJobs.toLocaleString()} active ${
                      totalJobs === 1 ? "role" : "roles"
                    }, ordered by newest.`
                  : "Current openings from the live job board, ordered by the latest postings."}
              </p>
            </div>
            <Link to="/dashboard?sort=date" className="link-arrow shrink-0">
              View all jobs
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14m-5-5l5 5-5 5"
                />
              </svg>
            </Link>
          </div>

          <div className="mt-8">
            {jobsStatus === "loading" ? (
              <div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                role="status"
                aria-label="Loading featured jobs"
              >
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </div>
            ) : jobsStatus === "error" ? (
              <div className="alert alert-error">
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
                  <p className="font-semibold">Job listings are unavailable</p>
                  <p className="mt-1 text-sm opacity-90">{jobsError}</p>
                </div>
                <button
                  type="button"
                  onClick={loadFeaturedJobs}
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  Try again
                </button>
              </div>
            ) : featuredJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-brand-ink">
                  No open roles right now
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-ink-muted">
                  New opportunities appear as employers publish them. Check the
                  full job board again soon.
                </p>
                <Link to="/dashboard" className="btn btn-primary mt-5">
                  Browse the job board
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.map((job, index) => (
                  <FeaturedJobCard
                    key={getJobId(job) || `${job.jobTitle}-${index}`}
                    job={job}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16 sm:py-20">
        <div className="app-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">A clearer job search</p>
            <h2 className="section-title mt-2">
              Less time sorting. More time choosing.
            </h2>
            <p className="page-subtitle mx-auto">
              Everything you need to move from browsing to a confident next
              step.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-line-weak bg-surface-raised/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="icon-tile bg-white">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d={step.icon}
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-ink-subtle">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-brand-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="employers"
        className="bg-brand-ink py-14 text-white sm:py-16"
      >
        <div className="app-container flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">
              For employers
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Meet people ready for the work ahead.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
              Publish a role, review applicants, and manage your hiring process
              from one focused workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/auth/signup"
              className="btn btn-primary min-h-12 bg-white text-brand-ink hover:bg-brand-tint hover:text-brand-ink"
            >
              Create an employer account
            </Link>
            <Link
              to="/auth/signin"
              className="btn min-h-12 border border-white/25 text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
