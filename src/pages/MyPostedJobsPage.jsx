import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { jobService } from "../services/jobService";
import { getErrorMessage } from "../utils/errorHandler";
import { XCircleGray } from "../icons/XCircleGray";
import { Eye } from "../icons/Eye";
import { Draft } from "../icons/Draft";
import JobDetailsPanel from "../components/JobDetailsPanel";
import { ModelCross } from "../icons/ModelCross";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSlice";
import { ROLES } from "../constants/roles";
import { formatSalary } from "../utils/formatSalary";

const MyPostedJobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user && user.role !== ROLES.RECRUITER && user.role !== ROLES.ADMIN) {
      toast.info("Only recruiters can manage posted jobs");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    limit: 10,
  });

  // Calculate days ago from date
  const calculateDaysAgo = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const [activeTab, setActiveTab] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    active: 0,
    closed: 0,
    drafts: 0,
  });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);

  const menuRefs = useRef({});

  // Format date from API response
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Map API status to UI status
  const mapStatusToTab = (tab) => {
    switch (tab) {
      case "active":
        return "Active";
      case "closed":
        return "Expired";
      case "drafts":
        return "Draft";
      default:
        return "all";
    }
  };

  // Fetch jobs from API
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const status = mapStatusToTab(activeTab);
      const response = await jobService.getMyJobs({
        page: currentPage,
        limit: 10,
        status: status === "all" ? "all" : status,
      });

      if (response?.success && response?.data) {
        const apiJobs = response.data.jobs || [];
        // Map API response to UI structure
        const mappedJobs = apiJobs.map((job) => ({
          id: job._id,
          title: job.jobTitle || job.title || job.companyName || "Untitled Job",
          type: job.employmentType || "Full Time",
          date: formatDate(job.applicationDeadline || job.createdAt),
          status: job.status === "Expired" ? "Expire" : job.status,
          applications: job.applicationCount || 0,
        }));

        setJobs(mappedJobs);
        setPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalJobs: mappedJobs.length,
            limit: 10,
          }
        );

        // Update tab count for the current tab from this response
        const totalForTab =
          response.data.pagination?.totalJobs || mappedJobs.length;
        setTabCounts((prev) => ({
          ...prev,
          [activeTab]: totalForTab,
        }));
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      const msg = getErrorMessage(err, "Failed to load jobs");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all tab counts on mount
  const fetchTabCounts = async () => {
    try {
      const [allRes, activeRes, closedRes, draftsRes] = await Promise.all([
        jobService.getMyJobs({ page: 1, limit: 1, status: "all" }),
        jobService.getMyJobs({ page: 1, limit: 1, status: "Active" }),
        jobService.getMyJobs({ page: 1, limit: 1, status: "Expired" }),
        jobService.getMyJobs({ page: 1, limit: 1, status: "Draft" }),
      ]);

      setTabCounts({
        all: allRes?.data?.pagination?.totalJobs || 0,
        active: activeRes?.data?.pagination?.totalJobs || 0,
        closed: closedRes?.data?.pagination?.totalJobs || 0,
        drafts: draftsRes?.data?.pagination?.totalJobs || 0,
      });
    } catch (err) {
      console.error("Error fetching tab counts:", err);
    }
  };

  const handleViewDetails = async (jobId) => {
    setOpenMenuId(null);
    try {
      const response = await jobService.getJobDetails(jobId);
      if (response && response.success) {
        const job = response.data;
        // Map API response to JobDetailsPanel structure
        const mappedJobDetails = {
          id: job._id || job.id || "-",
          title: job.jobTitle || "-",
          company: job.companyName || job.company || "-",
          location:
            [job.location?.city, job.location?.state]
              .filter(Boolean)
              .join(", ") || "-",
          distance: "-", // Or set a default
          rate: formatSalary(job) || "-",
          daysAgo: job.createdAt ? calculateDaysAgo(job.createdAt) : 0,
          isNew: job.createdAt ? calculateDaysAgo(job.createdAt) <= 3 : false,
          isSaved: job.isSaved || false,
          isApplied: false, // Not applicable for employer view
          jobType: job.employmentType || "Full Time",
          hospital: job.companyName || job.company || "-",
          hospitalUrl: "#",
          fullLocation:
            [
              job.location?.address,
              job.location?.city,
              job.location?.state,
              job.location?.zipCode,
            ]
              .filter(Boolean)
              .join(", ") || "-",
          workMode: job.workMode || "On-site",
          benefits: Array.isArray(job.benefits) ? job.benefits : [],
          fillInDate: job.applicationDeadline || "",
          applicationCount: job.applicationCount || 0,
          category: job.category || "General",
          experienceLevel: job.experienceLevel || "All Levels",
          fullDescription: {
            jobTitle: job.jobTitle || job.title || "-",
            location:
              [job.location?.city, job.location?.state]
                .filter(Boolean)
                .join(", ") || "-",
            workMode: job.workMode || "On-site",
            salary: formatSalary(job) || "-",
            incentives: job.incentives || "",
            roleOverview: job.jobDescription || job.description || "",
            responsibilities: job.jobDescription || "",
          },
          _original: job,
        };
        setSelectedJobDetails(mappedJobDetails);
        setIsDetailsModalOpen(true);
      } else {
        toast.error("Failed to fetch job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.error(getErrorMessage(error, "An error occurred while fetching job details"));
    }
  };

  // Fetch tab counts on mount
  useEffect(() => {
    fetchTabCounts();
  }, []);

  // Fetch jobs when page or tab changes, or when navigating back to this page
  useEffect(() => {
    fetchJobs();
  }, [currentPage, activeTab, location.key]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutside = Object.keys(menuRefs.current).every(
        (key) =>
          menuRefs.current[key] && !menuRefs.current[key].contains(event.target)
      );

      if (clickedOutside) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleMakeExpire = (id) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === id ? { ...job, status: "Expire" } : job
      )
    );
    setOpenMenuId(null);
  };

  const totalPages = pagination.totalPages || 1;

  const tabs = [
    { id: "all", label: "All Posts", count: tabCounts.all },
    { id: "active", label: "Active", count: tabCounts.active },
    { id: "closed", label: "Closed", count: tabCounts.closed },
    { id: "drafts", label: "Drafts", count: tabCounts.drafts },
  ];

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-sm font-bold transition-colors ${
            currentPage === i
              ? "bg-brand-action text-white shadow-sm"
              : "border border-line-weak bg-white text-ink-muted hover:bg-surface-raised hover:text-brand-ink"
          }`}
        >
          {i.toString().padStart(2, "0")}
        </button>
      );
    }
    return pages;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page-shell pb-16">
        {/* Header */}
        <div className="border-b border-line-weak bg-white">
          <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-brand-ink">My posted jobs</h1>
            <p className="text-sm text-ink-muted">
              <Link to="/dashboard" className="transition-colors hover:text-brand-action">
                Home
              </Link>{" "}
              / <span className="font-medium text-ink">My posted jobs</span>
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="loading-state py-24">
          <div className="loading-spinner"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  // Empty state is now handled inside the main return (after tabs)
  // so tabs are always visible even when there's no data

  return (
    <div className="page-shell pb-16">
      {/* Header */}
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">My posted jobs</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            / <span className="font-medium text-ink">My posted jobs</span>
          </p>
        </div>
      </div>

      <div className="app-container pt-6 sm:pt-8">
        {/* Tabs */}
        <div className="no-scrollbar mb-6 inline-flex max-w-full overflow-x-auto rounded-full border border-line-weak bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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

        {/* Table */}
        <div className="table-shell">
          {jobs.length > 0 ? (
            <table className="data-table min-w-[1000px]">
              <thead>
                <tr>
                  <th className="px-5 py-2.5 rounded-bl-lg text-left text-xs font-normal leading-[18px]  -tracking-[1%] text-ink-muted uppercase">
                    JOBS
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-normal leading-[18px]  -tracking-[1%] text-ink-muted uppercase">
                    STATUS
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-normal leading-[18px]  -tracking-[1%] text-ink-muted uppercase">
                    APPLICATIONS
                  </th>
                  <th className="px-5 py-2.5 lg:w-[265px] rounded-br-lg rounded-tr-lg text-left text-xs font-normal leading-[18px] -tracking-[1%] text-ink-muted uppercase">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white rounded-lg">
                {jobs.map((job, index) => {

                  return (
                    <tr
                      key={job.id}
                      className="group transition-colors hover:bg-brand-tint/20"
                    >
                      {/* Title */}
                      <td className="p-0">
                        <div className="p-3 md:p-5 rounded-l-lg ">
                          <div className="flex flex-col">
                            <div className="text-base font-medium leading-6 -tracking-[2%] text-secondary">
                              {job.title}
                            </div>
                            <div className="flex items-center font-normal text-sm leading-5 -tracking-[2%] text-ink-subtle mt-[5px] gap-2.5">
                              <span>{job.type}</span>
                              <span className="w-1 h-1 bg-ink-subtle rounded-full"></span>
                              <span>{job.date}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-0">
                        <div className="p-3 md:p-5 ">
                          <div
                            className={`flex items-center text-sm font-medium gap-1 leading-[20px] -tracking-[1%] ${
                              job.status === "Active"
                                ? "text-success"
                                : job.status === "Draft"
                                ? "text-warning"
                                : "text-danger"
                            }`}
                          >
                            {job.status === "Active" ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : job.status === "Draft" ? (
                              <WarningCircleIcon className="w-5 h-5" />
                            ) : (
                              // <XCircleIcon className="w-5 h-5" />
                              <img src="/XCircle.svg" alt="" />
                            )}
                            {job.status}
                          </div>
                        </div>
                      </td>

                      {/* Applications */}
                      <td className="p-0">
                        <div className="p-3 md:p-5 ">
                          <div className="flex items-center font-normal text-sm leading-[20px] -tracking-[1%] text-ink-muted gap-2">
                            <img src="/Users.svg" alt="" />
                            <span>
                              {job.applications.toString().padStart(2, "0")}{" "}
                              Applications
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-0 w-[200px] md:w-auto">
                        <div className="p-3 md:p-5 rounded-r-lg ">
                          <div className="flex items-center gap-2 justify-between ">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/dashboard/my-posted-jobs/${job.id}/applications`,
                                  { state: { jobTitle: job.title } }
                                );
                              }}
                              className="bg-brand-tint text-brand-action px-3 py-2 md:px-6 md:py-3 rounded text-xs md:text-sm leading-6 -tracking-[2%] font-medium cursor-pointer hover:bg-primary-100 transition-colors whitespace-nowrap"
                            >
                              View Applications
                            </button>

                            <div
                              className="relative"
                              ref={(el) => (menuRefs.current[job.id] = el)}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(job.id);
                                }}
                                className=" cursor-pointer align-middle rounded text-ink-subtle transition-colors"
                              >
                                <img
                                  src="/DotsThreeVertical.svg"
                                  alt="More options"
                                  className="w-6 h-6 opacity-70 "
                                />
                              </button>

                              {openMenuId === job.id && (
                                <div
                                  className={`absolute right-0 w-[216px] bg-white rounded-lg shadow-lg z-20 border border-line-weak py-3 ${
                                    index >= jobs.length - 2
                                      ? "bottom-12"
                                      : "mt-2"
                                  }`}
                                >
                                  <button
                                    onClick={() => handleViewDetails(job.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-raised cursor-pointer hover:text-brand-action flex items-center gap-3 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-brand-action" />
                                    View Detail
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMakeExpire(job.id);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-raised cursor-pointer hover:text-brand-action flex items-center gap-3 transition-colors"
                                  >
                                    <XCircleGray className="w-4 h-4 text-brand-action" />
                                    Make it Expire
                                  </button>
                                  <button
                                    onClick={() => {
                                      // handleMakeExpire(job.id);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-raised cursor-pointer hover:text-brand-action flex items-center gap-3 transition-colors"
                                  >
                                    <Draft
                                      width={19}
                                      height={19}
                                      className=" text-brand-action"
                                    />
                                    Draft
                                  </button>
                                  <button
                                    onClick={() => {
                                      // handleMakeExpire(job.id);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-raised cursor-pointer hover:text-brand-action flex items-center gap-3 transition-colors"
                                  >
                                    <XCircleGray className="w-4 h-4 text-brand-action" />
                                    Closed
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <img
                src="/Empty_Applied.svg"
                alt=""
                className="mb-6 w-full max-w-[260px]"
              />
              <h2 className="text-xl font-bold text-brand-ink">No job posts yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
                Create and publish your first job to start receiving applications.
              </p>
            </div>
          )}
        </div>

        {/* Pagination - with user requested styling for active item */}

        {jobs.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2 py-4">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line-weak bg-white transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
            >
              {/* <ChevronLeft className="w-5 h-5" /> */}
              <img
                src="/arrow-right.svg"
                alt="Chevron Left"
                className="w-5 h-5 rotate-180"
              />
            </button>

            {renderPagination()}

            <button
              type="button"
              aria-label="Next page"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line-weak bg-white transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
            >
              {/* <ChevronRight className="w-5 h-5" /> */}
              <img
                src="/arrow-right.svg"
                alt="Chevron Right"
                className="w-5 h-5"
              />
            </button>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {isDetailsModalOpen && (
        <div className="modal-backdrop z-[100]">
          <div className="modal-card max-w-[800px]">
            <button
              type="button"
              aria-label="Close job details"
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-muted transition-colors hover:bg-surface-raised hover:text-brand-ink"
            >
              <ModelCross />
            </button>
            <div className="custom-scrollbar flex-1 overflow-y-auto">
              <JobDetailsPanel
                job={selectedJobDetails}
                onApply={() => {}}
                onSave={() => {}}
                onShare={() => {}}
                onBack={() => setIsDetailsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icon Components
const CheckCircleIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.75 12L10.58 14.83L16.25 9.17004"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WarningCircleIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8V12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 16H12.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default MyPostedJobsPage;
