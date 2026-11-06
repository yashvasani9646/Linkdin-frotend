import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { jobService } from "../services/jobService";
import { userService } from "../services/userService";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/errorHandler";
import { applyToJob } from "../utils/jobStorage";
// import "./ApplyJobModel.css";
import "../index.css";
import { ModelCross } from "../icons/ModelCross";
import SelectField from "./common/SelectField";
import { Bold } from "../icons/Bold";
import { Italic } from "../icons/Italic";
import { UnderLine } from "../icons/Underline";
import { Strikethrough } from "../icons/Strikethrough";
import { PutLink } from "../icons/PutLink";
import { List } from "../icons/List";
import { NuList } from "../icons/NuList";

const ApplyJobModel = React.memo(({ isOpen, onClose, job, onSubmit }) => {
  const [selectedResume, setSelectedResume] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const editorRef = useRef(null);

  // Resume info from fetched profile data
  const resumeUrl = resumeData?.fileUrl || null;
  const resumeName = resumeData?.fileName || null;

  // Fetch resume data when modal opens
  useEffect(() => {
    const fetchResumeData = async () => {
      if (!isOpen) return;

      setIsLoadingResume(true);
      try {
        const response = await userService.getProfileDetails();
        if (response.success && response.data?.profileDetails?.resume) {
          setResumeData(response.data.profileDetails.resume);
        }
      } catch (error) {
        console.error("Error fetching resume data:", error);
      } finally {
        setIsLoadingResume(false);
      }
    };

    fetchResumeData();
  }, [isOpen]);

  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isSubmitting]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && !isSubmitting) {
        onClose();
      }
    },
    [onClose, isSubmitting]
  );

  const handleSubmit = useCallback(async () => {
    // Guard against repeated clicks while a request is already in flight
    if (isSubmitting) return;

    const content = editorRef.current?.innerHTML || "";
    const cleanContent = content.replace(/<[^>]*>/g, "").trim();
    const newErrors = {};

    if (!selectedResume) {
      newErrors.resume = "Please select a resume";
    }

    if (!cleanContent) {
      newErrors.coverLetter = "Cover letter cannot be empty";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Get job ID - handle both job.id and job._id
    const jobId = job?.id || job?._id;
    if (!jobId) {
      toast.error("Job ID not found");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare application data for API
      const applicationData = {
        resumeUrl: selectedResume,
        resumeFileName: resumeName || "resume.pdf",
        coverLetter: content,
      };

      const response = await jobService.applyForJob(jobId, applicationData);

      if (response.success) {
        toast.success(response.message || "Application submitted successfully");

        // Record the application locally so re-apply can be blocked even
        // before the next server round-trip (server flag stays authoritative)
        applyToJob({ ...job, id: jobId }, applicationData);

        // Call optional onSubmit callback
        if (onSubmit) {
          onSubmit({
            ...response.data,
            resume: selectedResume,
            coverLetter: content,
            jobId: jobId,
          });
        }

        // Reset form
        setSelectedResume("");
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        setErrors({});
        onClose();
      }
    } catch (error) {
      console.error("Error applying for job:", error);

      // Backend rejects duplicate applications with 409 / ALREADY_APPLIED.
      // Surface a clear message, mark the job as applied and close.
      const status = error?.response?.status;
      const errorCode = error?.response?.data?.error?.code;
      if (status === 409 || errorCode === "ALREADY_APPLIED") {
        toast.info(
          error?.response?.data?.error?.message ||
            "You have already applied for this job"
        );
        applyToJob({ ...job, id: jobId }, {});
        if (onSubmit) onSubmit({ jobId, alreadyApplied: true });
        onClose();
        return;
      }

      toast.error(getErrorMessage(error, "Failed to submit application"));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedResume, resumeName, job, onSubmit, onClose]);

  const handleCancel = useCallback(() => {
    // Reset form
    setSelectedResume("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setErrors({});
    onClose();
  }, [onClose]);

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current && errors.coverLetter) {
      setErrors((prev) => ({ ...prev, coverLetter: "" }));
    }
  };

  // Formatting functions
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleBold = () => execCommand("bold");
  const handleItalic = () => execCommand("italic");
  const handleUnderline = () => execCommand("underline");
  const handleStrikethrough = () => execCommand("strikeThrough");

  const handleLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const handleBulletList = () => execCommand("insertUnorderedList");
  const handleNumberedList = () => execCommand("insertOrderedList");

  if (!isOpen || !job) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card max-w-lg" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Apply for this job
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-brand-ink">
              {job.jobTitle || job.title || "Job application"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-ink-muted">
              {job.companyName || job.company || job.hospital || ""}
            </p>
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

        <div className="modal-body">
          <SelectField
            label="Choose Resume"
            name="resume"
            value={selectedResume}
            onChange={(e) => {
              setSelectedResume(e.target.value);
              if (errors.resume) {
                setErrors((prev) => ({ ...prev, resume: "" }));
              }
            }}
            error={errors.resume || ""}
            disabled={!resumeUrl}
            placeholder={
              isLoadingResume
                ? "Loading resume..."
                : resumeUrl
                  ? "Select resume"
                  : "No resume uploaded - Please upload in Profile"
            }
            wrapperClassName="mb-0"
            options={
              resumeUrl
                ? [{ value: resumeUrl, label: resumeName || "Resume" }]
                : []
            }
          />
          {!isLoadingResume && !resumeUrl ? (
            <p className="field-help">
              Add a resume in{" "}
              <Link
                to="/dashboard/profile"
                className="font-semibold text-brand-action"
                onClick={onClose}
              >
                your profile
              </Link>{" "}
              before applying.
            </p>
          ) : null}

          {/* Cover Letter */}
          <div className="mt-6">
            <label className="field-label">Cover Letter</label>

            {/* Custom Rich Text Editor */}
            <div className="relative">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                data-placeholder="Write a short cover letter explaining why you are a good fit..."
                aria-label="Cover letter"
                className={`field-input h-[193px] overflow-y-auto pb-10 ${
                  errors.coverLetter ? "field-input-error" : ""
                }`}
              />

              {/* Custom Rich Text Toolbar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center border-t border-line-weak bg-surface-raised/80 px-2 py-1.5">
                <div className="">
                  <button
                    type="button"
                    onClick={handleBold}
                    className="h-[26px] w-[26px] rounded text-ink-muted transition-colors hover:bg-brand-tint hover:text-brand-action"
                    title="Bold"
                  >
                    {/* <Bold className="w-4 h-4 text-ink-subtle" /> */}
                    <Bold />
                  </button>
                  <button
                    type="button"
                    onClick={handleItalic}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-brand-action"
                    title="Italic"
                  >
                    {/* <Italic className="w-4 h-4 text-ink-subtle" /> */}
                    <Italic />
                  </button>
                  <button
                    type="button"
                    onClick={handleUnderline}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-brand-action"
                    title="Underline"
                  >
                    {/* <Underline className="w-4 h-4 text-ink-subtle" /> */}
                    <UnderLine />
                  </button>
                  <button
                    type="button"
                    onClick={handleStrikethrough}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-brand-action"
                    title="Strikethrough"
                  >
                    {/* <Strikethrough className="w-4 h-4 text-ink-subtle" /> */}
                    <Strikethrough />
                  </button>
                </div>
                <div className="w-px h-4 bg-line-weak mx-1" />
                <div>
                  <button
                    type="button"
                    onClick={handleLink}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-brand-action"
                    title="Insert Link"
                  >
                    {/* <LinkIcon className="w-4 h-4 text-ink-subtle" /> */}
                    <PutLink />
                  </button>
                </div>
                <div className="w-px h-4 bg-line-weak mx-1" />
                <div>
                  <button
                    type="button"
                    onClick={handleBulletList}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-brand-action"
                    title="Bullet List"
                  >
                    {/* <List className="w-4 h-4 text-ink-subtle" /> */}
                    <List />
                  </button>
                  <button
                    type="button"
                    onClick={handleNumberedList}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-brand-action"
                    title="Numbered List"
                  >
                    {/* <ListOrdered className="w-4 h-4 text-ink-subtle" /> */}
                    <NuList />
                  </button>
                </div>
              </div>
            </div>
            {errors.coverLetter && (
              <p className="field-error">{errors.coverLetter}</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="btn btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !resumeUrl}
            className="btn btn-primary w-full sm:w-auto"
          >
            {isSubmitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
            )}
            {isSubmitting ? "Submitting..." : "Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
});

ApplyJobModel.displayName = "ApplyJobModel";

export default ApplyJobModel;
