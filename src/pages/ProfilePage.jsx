import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "../icons/LogOut";
import { API_CONFIG } from "../config/api.config";
import { userService } from "../services/userService";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import { openBlobInNewTab } from "../utils/openFile";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const resumeInputRef = useRef(null);
  const resumeMenuRef = useRef(null);

  // Fetch profile details from API
  const fetchProfileDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getProfileDetails();
      if (response.success && response.data) {
        setUserData(response.data.user);
        setProfileDetails(response.data.profileDetails);
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
      toast.error(getErrorMessage(error, "Failed to load profile"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfileDetails();
  }, [fetchProfileDetails]);

  // Derived user data for display from API response
  const displayName =
    userData?.fullName ||
    `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
    "User";
  const displayExperience = userData?.yearsOfExperience
    ? `${userData.yearsOfExperience} years experience`
    : "";
  const displayAddress =
    [userData?.city, userData?.state].filter(Boolean).join(", ") ||
    "Not provided";
  const displayEmail = userData?.email || "Not provided";
  const displayPhone = userData?.phoneNumber || "Not provided";
  const displayRole = userData?.role || "";

  // Resume info from profileDetails (new API structure)
  const resumeData = profileDetails?.resume || null;
  const resumeUrl = resumeData?.fileUrl || null;
  const resumeName = resumeData?.fileName || null;

  // Close the resume action menu on outside click or Escape
  useEffect(() => {
    if (!showResumeMenu) return;

    const handlePointerDown = (event) => {
      if (
        resumeMenuRef.current &&
        !resumeMenuRef.current.contains(event.target)
      ) {
        setShowResumeMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowResumeMenu(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResumeMenu]);

  // Profile photo URL - append base URL if it's a relative path
  const profilePhotoUrl = userData?.profilePhoto
    ? /^(https?:|data:|blob:)/.test(userData.profilePhoto)
      ? userData.profilePhoto
      : `${API_CONFIG.BASE_URL}${
          userData.profilePhoto.startsWith("/") ? "" : "/"
        }${userData.profilePhoto}`
    : "/avatar-placeholder.svg";

  // Handle resume file selection and upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const response = await userService.upload_resume(file);
      if (response.success) {
        toast.success("Resume uploaded successfully");
        // Update local state with the new resume data
        if (response.data?.resume) {
          setProfileDetails((prev) => ({
            ...prev,
            resume: response.data.resume,
          }));
        }
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error(getErrorMessage(error, "Failed to upload resume"));
    } finally {
      setIsUploading(false);
      // Reset file input
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    }
  };

  // Trigger file input click
  const triggerResumeUpload = () => {
    setShowResumeMenu(false);
    resumeInputRef.current?.click();
  };

  // Handle resume deletion
  const handleResumeDelete = async () => {
    if (!resumeUrl) return;

    setIsDeleting(true);
    setShowResumeMenu(false);
    try {
      const response = await userService.delete_resume();
      if (response.success) {
        toast.success("Resume deleted successfully");
        // Remove resume from local state
        setProfileDetails((prev) => ({
          ...prev,
          resume: null,
        }));
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast.error(getErrorMessage(error, "Failed to delete resume"));
    } finally {
      setIsDeleting(false);
    }
  };

  // View the resume: fetch as blob (direct /uploads/resumes access is
  // blocked server-side) and open it in a new tab.
  const handleResumeView = async () => {
    if (!resumeUrl || isViewing) return;

    setIsViewing(true);
    try {
      const blob = await userService.view_resume();
      openBlobInNewTab(blob);
    } catch (error) {
      console.error("Error viewing resume:", error);
      toast.error(getErrorMessage(error, "Failed to open resume"));
    } finally {
      setIsViewing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-state py-24">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="page-shell pb-16">
      {/* Hidden file input for resume upload */}
      <input
        type="file"
        ref={resumeInputRef}
        onChange={handleResumeUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      {/* Header */}
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">My profile</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            / <span className="font-medium text-ink">Profile</span>
          </p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="app-container pt-6 sm:pt-8">
        <div className="mx-auto max-w-[872px] space-y-6">
        {/* Profile Header */}
        <section className="panel flex flex-col items-center justify-between gap-6 p-6 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-surface-raised shadow-card">
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fall back once to the bundled placeholder (never loop
                  // back onto a missing asset).
                  if (e.target.dataset.fallback === "1") return;
                  e.target.dataset.fallback = "1";
                  e.target.src = "/avatar-placeholder.svg";
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-ink md:text-3xl">
                {displayName}
              </h2>
              <p className="mt-1 text-base font-medium text-ink-muted">
                {displayRole} {displayExperience && `• ${displayExperience}`}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/profile/edit"
            className="btn btn-secondary shrink-0"
          >
            <img src="/Edit.svg" alt="" className="h-4 w-4" />
            Edit profile
          </Link>
        </section>

        {/* Basic Information */}
        <section className="panel p-6">
          <h3 className="section-title mb-5">Basic information</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="field-label">Email address</p>
              <p className="mt-1 break-all text-sm font-semibold text-ink">
                {displayEmail}
              </p>
            </div>
            <div>
              <p className="field-label">Phone number</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {displayPhone}
              </p>
            </div>
            <div>
              <p className="field-label">Address</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {displayAddress}
              </p>
            </div>
          </div>

          {/* Resume Section */}
          <div className="mt-6 border-t border-line-weak pt-5">
            <p className="field-label mb-2">Resume</p>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-weak bg-surface-raised p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 items-center justify-center">
                  <img
                    src="/Document.svg"
                    alt="File"
                    className="w-[32px] h-[32px]"
                  />
                </div>
                <div className="min-w-0">
                  {resumeUrl ? (
                    <p className="truncate pb-[2px] text-sm font-semibold leading-5 -tracking-[2%] text-secondary">
                      {resumeName || "Uploaded resume"}
                    </p>
                  ) : (
                    <p className="text-sm font-normal leading-4 -tracking-[2%] text-ink-muted">
                      No resume uploaded
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {resumeUrl && (
                  <button
                    type="button"
                    onClick={handleResumeView}
                    disabled={isViewing}
                    className="btn btn-secondary btn-sm"
                    title="Open your resume in a new tab"
                  >
                    {isViewing ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                    ) : (
                      <img src="/ArrowSquareOut.svg" alt="" className="h-4 w-4" />
                    )}
                    View
                  </button>
                )}
                <div className="relative" ref={resumeMenuRef}>
                  <button
                    onClick={() => setShowResumeMenu(!showResumeMenu)}
                    disabled={isUploading}
                    aria-haspopup="menu"
                    aria-expanded={showResumeMenu}
                    aria-label="Resume options"
                    className="flex cursor-pointer items-center justify-center rounded-[6px] p-1.5 transition hover:bg-brand-tint/50 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                    ) : (
                      <img
                        src="/Horizantal_dot.svg"
                        alt=""
                        className="w-6 h-6"
                      />
                    )}
                  </button>
                  {showResumeMenu && (
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-1 w-[190px] animate-in fade-in duration-100 rounded-xl border border-line-weak bg-white py-2 shadow-dropdown"
                    >
                      <button
                        role="menuitem"
                        onClick={triggerResumeUpload}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 -tracking-[2%] text-brand-action transition hover:bg-brand-tint"
                      >
                        <img src="/Edit.svg" alt="" className="h-5 w-5" />
                        {resumeUrl ? "Update Resume" : "Upload Resume"}
                      </button>
                      {resumeUrl && (
                        <button
                          role="menuitem"
                          onClick={handleResumeDelete}
                          disabled={isDeleting}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 -tracking-[2%] text-danger transition hover:bg-danger-soft disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-danger"></div>
                          ) : (
                            <LogOut />
                          )}
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Qualifications */}
        <Link
          to="/dashboard/profile/qualifications"
          className="panel panel-hover flex items-center justify-between gap-4 p-6"
        >
          <div>
            <h3 className="section-title">Qualifications</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              We use these details to show you jobs that match your unique skills and experience.
            </p>
          </div>
          <img
            src="/Right_arrow.svg"
            alt=""
            className="h-5 w-5 shrink-0 text-ink-subtle"
          />
        </Link>

        {/* Job Preferences */}
        <Link
          to="/dashboard/profile/job-preferences"
          className="panel panel-hover flex items-center justify-between gap-4 p-6"
        >
          <div>
            <h3 className="section-title">Job preferences</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Set your preferred pay, working hours and job type for better matches.
            </p>
          </div>
          <img
            src="/Right_arrow.svg"
            alt=""
            className="h-5 w-5 shrink-0 text-ink-subtle"
          />
        </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
