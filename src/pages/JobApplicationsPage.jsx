import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { jobService } from "../services/jobService";
import chatService from "../services/chatService";
import ApplicantProfileModal from "../components/ApplicantProfileModal";
import BackButton from "../components/common/BackButton";
import { API_CONFIG } from "../config/api.config";
import { getErrorMessage } from "../utils/errorHandler";

const JobApplicationsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(null); // Track which application is downloading
  const [isStartingChat, setIsStartingChat] = useState(null); // Track which application chat is being started
  const [updatingStatusId, setUpdatingStatusId] = useState(null); // Track which application status is updating
  const statusUpdateInFlight = useRef(false); // Hard guard against duplicate submissions
  const [applications, setApplications] = useState([]);
  const [jobInfo, setJobInfo] = useState(null);
  const [, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    limit: 10,
  });
  const menuRefs = useRef({});

  // Get job title from location state or API
  const jobTitle =
    location.state?.jobTitle ||
    jobInfo?.jobTitle ||
    jobInfo?.companyName ||
    "Job Applications";

  const openProfileModal = (applicant) => {
    setSelectedApplicant(applicant);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedApplicant(null);
  };

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

  // Fetch applicants from API
  const fetchApplicants = async () => {
    setIsLoading(true);
    try {
      const response = await jobService.getJobApplicants(jobId, {
        page: 1,
        limit: 100, // Fetch all for client-side filtering
        status: "all",
      });

      if (response?.success && response?.data) {
        const {
          job,
          applications: apiApplications,
          pagination: apiPagination,
        } = response.data;

        setJobInfo(job);
        setPagination(
          apiPagination || {
            currentPage: 1,
            totalPages: 1,
            totalApplications: apiApplications?.length || 0,
            limit: 10,
          }
        );

        // Map API response to UI structure
        const mappedApplications = (apiApplications || []).map((app) => ({
          id: app._id,
          name:
            app.applicant?.fullName ||
            `${app.applicant?.firstName || ""} ${
              app.applicant?.lastName || ""
            }`.trim() ||
            "Unknown",
          credentials: app.applicant?.qualifications || "",
          appliedDate: `Applied ${app.appliedAt || ""}`,
          status: app.status || "New",
          council: app.applicant?.registrationDetails || "",
          experience: app.applicant?.yearsOfExperience
            ? `${app.applicant.yearsOfExperience} years Experience`
            : "",
          salary: app.applicant?.expectedSalary
            ? `Expected : ${app.applicant.expectedSalary}`
            : "",
          avatar: app.applicant?.profilePhoto || "/avatar-placeholder.svg",
          email: app.applicant?.email,
          phone: app.applicant?.phoneNumber,
          coverLetter: app.coverLetter,
          resume: app.resume,
          applicantData: app.applicant, // Keep full applicant data for profile modal
        }));

        setApplications(mappedApplications);
      }
    } catch (err) {
      console.error("Error fetching applicants:", err);
      toast.error(getErrorMessage(err, "Failed to load applicants"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch applicants on mount
  useEffect(() => {
    if (jobId) {
      fetchApplicants();
    }
  }, [jobId]);

  const getCount = (status) => {
    if (status === "all") return applications.length;
    if (status === "new")
      return applications.filter((app) => app.status === "New").length;
    if (status === "shortlisted")
      return applications.filter((app) => app.status === "Shortlisted").length;
    if (status === "interviewed")
      return applications.filter((app) => app.status === "Interviewed").length;
    return 0;
  };

  const tabs = [
    { id: "all", label: "All Applications", count: getCount("all") },
    { id: "new", label: "New", count: getCount("new") },
    { id: "shortlisted", label: "Shortlisted", count: getCount("shortlisted") },
    { id: "interviewed", label: "Interviewed", count: getCount("interviewed") },
  ];

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "new") return app.status === "New";
    if (activeTab === "shortlisted") return app.status === "Shortlisted";
    if (activeTab === "interviewed") return app.status === "Interviewed";
    return true;
  });

  const handleStatusChange = async (applicationId, newStatus) => {
    // Prevent duplicate submissions while a status update is in flight
    if (statusUpdateInFlight.current) return;
    statusUpdateInFlight.current = true;
    setUpdatingStatusId(applicationId);
    try {
      const response = await jobService.updateApplicationStatus(
        applicationId,
        newStatus
      );
      if (response.success) {
        toast.success(`Application status updated to ${newStatus}`);
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error(
        getErrorMessage(error, "Failed to update status")
      );
    } finally {
      statusUpdateInFlight.current = false;
      setUpdatingStatusId(null);
      setOpenMenuId(null);
    }
  };

  // Handle download CV
  const handleDownloadCV = async (applicationId) => {
    setIsDownloading(applicationId);
    try {
      await jobService.downloadResume(applicationId);
      toast.success("Resume downloaded successfully");
    } catch (error) {
      console.error("Error downloading resume:", error);
      if (error.response?.status === 404) {
        toast.error("Resume not found for this application");
      } else if (error.response?.status === 403) {
        toast.error("You are not authorized to download this resume");
      } else {
        toast.error("Failed to download resume");
      }
    } finally {
      setIsDownloading(null);
      setOpenMenuId(null);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Handle starting a chat with an applicant
  const handleStartChat = async (application) => {
    // Get the applicant's user ID from the application
    const applicantUserId =
      application.applicantData?._id || application.applicantData?.id;

    if (!applicantUserId) {
      toast.error("Unable to start chat - applicant information not available");
      return;
    }

    setIsStartingChat(application.id);
    try {
      const response = await chatService.createOrGetChat(
        applicantUserId,
        jobId
      );

      if (response.success && response.data?.chat) {
        // Navigate to MessagePage with the chat ID
        navigate("/dashboard/message", {
          state: {
            selectedChatId: response.data.chat._id,
            fromJobApplications: true,
          },
        });
        toast.success("Chat opened successfully");
      } else {
        toast.error("Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error(getErrorMessage(error, "Failed to start chat"));
    } finally {
      setIsStartingChat(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "New":
      case "Submitted":
        return "bg-brand-tint text-brand border border-primary-100";
      case "Shortlisted":
        return "bg-warning-soft text-warning border border-warning-soft";
      case "Interviewed":
        return "bg-success-soft text-success border border-success/20";
      case "Accepted":
      case "Hired":
        return "bg-success-soft text-success border border-success/30";
      case "Rejected":
        return "bg-danger-soft text-danger border border-danger/20";
      default:
        return "bg-surface text-ink-muted border border-line";
    }
  };

  return (
    <div className="page-shell pb-16">
      {/* Header */}
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Job applications</h1>
          <p className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>
            <span>/</span>
            <button
              type="button"
              className="transition-colors hover:text-brand-action"
              onClick={() => navigate("/dashboard/my-posted-jobs")}
            >
              My posted jobs
            </button>
            <span>/</span>
            <span className="max-w-[220px] truncate">{jobTitle}</span>
            <span>/</span>
            <span className="font-medium text-ink">Applications</span>
          </p>
        </div>
      </div>

      <div className="app-container pt-6 sm:pt-8">
        {/* Header with Back Button */}
        <div className="mb-4 flex items-center gap-3">
          <BackButton
            fallback="/dashboard/my-posted-jobs"
            label="Back to my posted jobs"
            className="h-10 w-10"
          />
          <p className="text-sm text-ink-muted">
            Review applicants and update their status for this job.
          </p>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar mb-6 inline-flex max-w-full overflow-x-auto rounded-full border border-line-weak bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-action text-white shadow-sm"
                  : "text-ink-muted hover:bg-surface-raised hover:text-brand-ink"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-state py-20">
            <div className="loading-spinner"></div>
            <p>Loading applications...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredApplications.length === 0 && (
          <div className="empty-state">
            <img
              src="/Empty_Applied.svg"
              alt=""
              className="mb-6 w-full max-w-[220px]"
            />
            <h2 className="text-xl font-bold text-brand-ink">No applications yet</h2>
            <p className="mt-2 max-w-md text-center text-sm leading-6 text-ink-muted">
              {activeTab === "all"
                ? "No one has applied to this job yet."
                : `No ${activeTab} applications found.`}
            </p>
          </div>
        )}

        {/* Applications Grid */}
        {!isLoading && filteredApplications.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="panel panel-hover flex flex-col p-5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 border-b border-line-weak pb-4">
                  <div className="flex min-w-0 gap-3">
                    {/* Avatar */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-tint">
                      {application.avatar &&
                      application.avatar !== "/avatar-placeholder.svg" ? (
                        <img
                          src={
                            application.avatar.startsWith("http")
                              ? application.avatar
                              : `${API_CONFIG.BASE_URL}${application.avatar}`
                          }
                          alt={application.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/application_person.svg";
                          }}
                        />
                      ) : (
                        <img
                          src="/application_person.svg"
                          alt={application.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    {/* Name and Credentials */}
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-brand-ink">
                        {application.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-muted">
                        {application.credentials || "Applicant"}
                      </p>
                    </div>
                  </div>

                  {/* Date and Badge Column */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs font-medium text-ink-subtle">
                      {application.appliedDate}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getStatusBadgeColor(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>
                </div>

                {/* Card Body - Details */}
                <div className="mt-4 mb-5 flex-1 space-y-1.5">
                  {[application.council, application.experience, application.salary]
                    .filter(Boolean)
                    .map((detail) => (
                      <div key={detail} className="flex items-start gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-subtle"></span>
                        <span className="text-sm leading-5 text-ink-muted">{detail}</span>
                      </div>
                    ))}
                </div>

                {/* Card Footer - Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openProfileModal(application)}
                    className="btn btn-secondary flex-1"
                  >
                    View profile
                  </button>

                  <button
                    type="button"
                    aria-label={`Message ${application.name}`}
                    onClick={() => handleStartChat(application)}
                    disabled={isStartingChat === application.id}
                    className="btn-icon h-11 w-11"
                  >
                    {isStartingChat === application.id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-action border-t-transparent"></div>
                    ) : (
                      <img src="/ChatCircleDots.svg" alt="" className="h-5 w-5" />
                    )}
                  </button>

                  <div
                    className="relative"
                    ref={(el) => (menuRefs.current[application.id] = el)}
                  >
                    <button
                      type="button"
                      aria-label={`More actions for ${application.name}`}
                      onClick={() => toggleMenu(application.id)}
                      className="btn-icon h-11 w-11"
                    >
                      <img src="/DotsThreeVertical.svg" alt="" className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === application.id && (
                      <div className="absolute right-0 top-full z-20 mt-2 w-[220px] rounded-lg border border-line-weak bg-white py-1.5 shadow-dropdown">
                        {application.status === "New" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(application.id, "Shortlisted")
                            }
                            disabled={updatingStatusId !== null}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-brand-action transition-colors hover:bg-brand-tint ${
                              updatingStatusId !== null
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <img
                              src="/CaretDoubleRight.svg"
                              className="h-5 w-5"
                              alt=""
                            />
                            Move to shortlisted
                          </button>
                        )}

                        {application.status === "Shortlisted" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(application.id, "Interviewed")
                            }
                            disabled={updatingStatusId !== null}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-brand-action transition-colors hover:bg-brand-tint ${
                              updatingStatusId !== null
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <ArrowRightIcon className="h-4 w-4" />
                            Move to interview
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadCV(application.id)}
                          disabled={isDownloading === application.id}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-raised ${
                            isDownloading === application.id
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                        >
                          {isDownloading === application.id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-muted border-t-transparent"></div>
                          ) : (
                            <img
                              src="/DownloadSimple.svg"
                              className="h-5 w-5"
                              alt=""
                            />
                          )}
                          {isDownloading === application.id
                            ? "Downloading..."
                            : "Download CV"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(application.id, "Rejected")
                          }
                          disabled={updatingStatusId !== null}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-soft ${
                            updatingStatusId !== null
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                        >
                          {updatingStatusId === application.id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-danger border-t-transparent"></div>
                          ) : (
                            <img src="/XCircle.svg" className="h-5 w-5" alt="" />
                          )}
                          {updatingStatusId === application.id
                            ? "Rejecting..."
                            : "Reject application"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ApplicantProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        applicant={selectedApplicant}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

// Icons (Simplified for Dropdown)
const ArrowRightIcon = (props) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.75 13.5L11.25 9L6.75 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default JobApplicationsPage;
