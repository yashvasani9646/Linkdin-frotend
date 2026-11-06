import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ModelCross } from "../icons/ModelCross";
import { jobService } from "../services/jobService";
import SelectField from "./common/SelectField";
import { toAssetUrl } from "../utils/assetUrl";
import { openBlobInNewTab } from "../utils/openFile";
import { getErrorMessage } from "../utils/errorHandler";

const ApplicantProfileModal = ({
  isOpen,
  onClose,
  applicant,
  onStatusChange,
}) => {
  const [markStatus, setMarkStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isViewingResume, setIsViewingResume] = useState(false);

  // Set initial status when applicant changes
  useEffect(() => {
    if (applicant) {
      setMarkStatus(applicant.status || "New");
    }
  }, [applicant]);

  // Fetch the applicant's resume as a blob (direct /uploads/resumes access
  // is blocked server-side; the download endpoint enforces ownership) and
  // open it in a new tab.
  const handleViewResume = async () => {
    if (isViewingResume || !applicant?.id) return;

    setIsViewingResume(true);
    try {
      const blob = await jobService.viewApplicantResume(applicant.id);
      openBlobInNewTab(blob);
    } catch (error) {
      console.error("Error viewing resume:", error);
      toast.error(getErrorMessage(error, "Failed to open resume"));
    } finally {
      setIsViewingResume(false);
    }
  };

  if (!isOpen || !applicant) return null;

  // Extract data from applicant
  const applicantData = applicant.applicantData || {};
  const profileDetails = applicantData.profileDetails || {};
  const qualifications = profileDetails.qualifications || {};
  const resume = applicant.resume || profileDetails.resume || {};

  // Extract arrays
  const workExperiences = qualifications.workExperiences || [];
  const education = qualifications.education || [];
  const skills = qualifications.skills || [];
  const licenses = qualifications.licenses || [];
  const certifications = qualifications.certifications || [];
  const languages = qualifications.languages || [];

  // Get profile photo URL
  const profilePhotoUrl = toAssetUrl(applicantData.profilePhoto);

  // Handle status change via API
  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === markStatus || isUpdating) return;

    setIsUpdating(true);
    try {
      // Call the API to update the status
      await jobService.updateApplicationStatus(applicant.id, newStatus);
      setMarkStatus(newStatus);

      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange(applicant.id, newStatus);
      }
    } catch (error) {
      console.error("Failed to update application status:", error);
      // Optionally show an error message to the user
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle dropdown change
  const handleMarkStatusChange = (e) => {
    handleStatusUpdate(e.target.value);
  };

  // Handle Schedule Interview button click
  const handleScheduleInterview = () => {
    handleStatusUpdate("Interviewed");
  };

  // Handle Reject button click
  const handleReject = () => {
    handleStatusUpdate("Rejected");
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-[1150px]">
        <div className="modal-header flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex w-full flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={applicant.name}
                className="h-16 w-16 shrink-0 rounded-full object-cover md:h-20 md:w-20"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/application_person.svg";
                }}
              />
            ) : (
              <img
                src="/application_person.svg"
                alt={applicant.name}
                className="h-16 w-16 shrink-0 object-cover md:h-20 md:w-20"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-brand-ink">
                {applicant.name || applicantData.fullName || "Unknown"}
              </h2>
              <p className="text-sm text-ink-muted">
                {applicant.credentials || applicantData.qualifications || ""}
              </p>
              <p className="text-xs text-ink-subtle">{applicant.appliedDate}</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-start">
            <button
              type="button"
              className="btn-icon"
              aria-label="Message applicant"
            >
              <img
                src="/ChatCircleDots.svg"
                alt=""
                className="h-5 w-5 opacity-60"
              />
            </button>
            <button
              type="button"
              onClick={handleScheduleInterview}
              disabled={isUpdating || markStatus === "Interviewed"}
              className="btn btn-secondary"
            >
              {isUpdating && markStatus !== "Interviewed"
                ? "Updating..."
                : "Schedule Interview"}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isUpdating || markStatus === "Rejected"}
              className="btn btn-danger"
            >
              {isUpdating && markStatus !== "Rejected"
                ? "Updating..."
                : "Reject"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon shrink-0"
              aria-label="Close applicant details"
            >
              <ModelCross className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column - Profile Summary (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="panel p-4 md:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <h3 className="section-title">Profile Summary</h3>
                  <span
                    className={`badge ${
                      applicant.status === "New"
                        ? "badge-brand"
                        : applicant.status === "Shortlisted"
                          ? "badge-warning"
                          : "badge-success"
                    }`}
                  >
                    {applicant.status || "New"}
                  </span>
                </div>

                {/* Contact */}
                <div className="pb-5 border-b border-line-weak">
                  <h4 className="text-xs -tracking-[2%] leading-6 font-semibold text-secondary/70 mb-[5px]">
                    Contact
                  </h4>
                  <div className="space-y-[2px]">
                    <div className="flex items-center -tracking-[2%] leading-6 gap-[10px] text-sm text-secondary/70 font-medium">
                      <img
                        src="/fi_phone-call.svg"
                        alt="Phone"
                        className="w-4 h-4 text-brand-action"
                      />
                      <span>
                        {applicant.phone || applicantData.phoneNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center -tracking-[2%] leading-6 gap-[10px] text-sm text-secondary/70 font-medium ">
                      <img
                        src="/fi_mail.svg"
                        alt="Email"
                        className="w-4 h-4 text-brand-action"
                        onError={(e) => {
                          e.target.src = "/topbar_mail.svg";
                        }}
                      />
                      <span className="break-all">
                        {applicant.email || applicantData.email || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Skills */}
                <div className="pb-6 pt-4 border-b border-line-weak">
                  <h4 className="text-xs -tracking-[2%] leading-6 font-semibold text-secondary/70 mb-[5px]">
                    Core Skills
                  </h4>
                  <div className="flex flex-wrap gap-[5px]">
                    {skills.length > 0 ? (
                      skills.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-surface-raised px-2.5 py-1.5 text-sm text-ink-muted"
                        >
                          {item.skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-ink-subtle">
                        No skills listed
                      </span>
                    )}
                  </div>
                </div>

                {/* Languages */}
                {languages.length > 0 && (
                  <div className="pb-6 pt-4 border-b border-line-weak">
                    <h4 className="text-xs -tracking-[2%] leading-6 font-semibold text-secondary/70 mb-[5px]">
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-[5px]">
                      {languages.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-surface-raised px-2.5 py-1.5 text-sm text-ink-muted"
                        >
                          {item.language} ({item.proficiency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mark Status */}
                <div>
                  <h4 className="text-sm uppercase tracking-[0%] leading-[100%] font-medium text-secondary pt-6 pb-[5px]">
                    Mark Status
                  </h4>
                  <SelectField
                    name="markStatus"
                    value={markStatus}
                    onChange={handleMarkStatusChange}
                    disabled={isUpdating}
                    placeholder="Select status"
                    wrapperClassName="mb-0"
                    options={[
                      { value: "New", label: "New" },
                      { value: "Shortlisted", label: "Shortlisted" },
                      { value: "Interviewed", label: "Interviewed" },
                      { value: "Accepted", label: "Accepted" },
                      { value: "Rejected", label: "Rejected" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Cover Letter */}
              {applicant.coverLetter && (
                <>
                  <div>
                    <h3 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary pb-[3px] ">
                      Cover Letter
                    </h3>
                    <p className="text-base font-normal leading-6 -tracking-[2%] text-secondary/70">
                      {applicant.coverLetter}
                    </p>
                  </div>
                  <div className="h-px bg-line-weak"></div>
                </>
              )}

              {/* Work Experience */}
              <div>
                <h3 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary pb-[13px] ">
                  Work Experience
                </h3>
                {workExperiences.length > 0 ? (
                  <div className="space-y-0 relative ml-2">
                    {workExperiences.map((exp, idx) => (
                      <div
                        key={idx}
                        className={`pl-6 relative ${
                          idx < workExperiences.length - 1
                            ? "pb-4 after:content-[''] after:absolute after:left-0 after:top-[10px] after:h-full after:w-[1px] after:bg-line-weak"
                            : ""
                        }`}
                      >
                        <div className="absolute z-1 -left-[5px] top-1.5 w-3 h-3 bg-white border-[3px] border-brand-action rounded-full"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                          <h4 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary/70">
                            {exp.jobTitle}
                          </h4>
                        </div>
                        <p className="text-xs font-normal leading-[18px] -tracking-[2%] text-secondary/70">
                          {exp.companyName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-subtle">
                    No work experience listed
                  </p>
                )}
              </div>

              <div className="h-px bg-line-weak"></div>

              {/* Education */}
              <div>
                <h3 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary pb-[13px] ">
                  Education
                </h3>
                {education.length > 0 ? (
                  <div className="space-y-0 relative ml-2">
                    {education.map((edu, idx) => (
                      <div
                        key={idx}
                        className={`pl-6 relative ${
                          idx < education.length - 1
                            ? "pb-4 after:content-[''] after:absolute after:left-0 after:top-[10px] after:h-full after:w-[1px] after:bg-line-weak"
                            : ""
                        }`}
                      >
                        <div className="absolute z-1 -left-[5px] top-1.5 w-3 h-3 bg-white border-[3px] border-brand-action rounded-full"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                          <h4 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary/70">
                            {edu.levelOfEducation}
                          </h4>
                        </div>
                        <p className="text-xs font-normal leading-[18px] -tracking-[2%] text-secondary/70">
                          {edu.fieldOfStudy}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-subtle">No education listed</p>
                )}
              </div>

              <div className="h-px bg-line-weak"></div>

              {/* Resume / CV */}
              <div className="pb-6 border-b border-line-weak">
                <h3 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary pb-[10px]">
                  Resume / CV
                </h3>
                {resume.fileUrl ? (
                  <button
                    type="button"
                    onClick={handleViewResume}
                    disabled={isViewingResume}
                    className="block w-full rounded-lg border border-line-weak bg-surface-raised p-5 text-left transition-colors hover:border-brand-action disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center text-brand-action">
                        <img
                          src="/Document.svg"
                          alt="Document"
                          className="w-6 h-6"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-5 -tracking-[2%] text-secondary">
                          {resume.fileName || "Resume"}
                        </p>
                        <p className="text-sm font-normal leading-5 -tracking-[2%] text-ink-muted ">
                          PDF
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md p-1 text-brand-action">
                      {isViewingResume ? (
                        <span className="block h-5 w-5 animate-spin rounded-full border-b-2 border-current"></span>
                      ) : (
                        <img
                          src="/DownloadSimple.svg"
                          alt=""
                          className="h-5 w-5"
                        />
                      )}
                    </span>
                  </button>
                ) : (
                  <p className="text-sm text-ink-subtle">No resume uploaded</p>
                )}
              </div>

              {/* License & Certifications */}
              <div>
                <h3 className="text-base font-semibold leading-6 -tracking-[2%] text-secondary pb-[10px]">
                  Licenses & Certifications
                </h3>
                <div className="">
                  {/* Licenses */}
                  {licenses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-secondary/70 mb-2">
                        Licenses
                      </h4>
                      {licenses.map((lic, idx) => (
                        <div
                          key={idx}
                          className="mb-2 rounded-lg border border-line-weak bg-surface-raised p-4"
                        >
                          <p className="text-sm font-medium text-secondary">
                            License: {lic.licenseNumber}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {lic.doesNotExpire
                              ? "Does not expire"
                              : `Expires: ${new Date(
                                  lic.expirationDate
                                ).toLocaleDateString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-secondary/70 mb-2">
                        Certifications
                      </h4>
                      {certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="mb-2 rounded-lg border border-line-weak bg-surface-raised p-4"
                        >
                          <p className="text-sm font-medium text-secondary">
                            {cert.certificationName}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {cert.doesNotExpire
                              ? "Does not expire"
                              : `Expires: ${new Date(
                                  cert.expirationDate
                                ).toLocaleDateString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {licenses.length === 0 && certifications.length === 0 && (
                    <p className="text-sm text-ink-subtle">
                      No licenses or certifications listed
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfileModal;
