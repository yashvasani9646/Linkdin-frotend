import React from "react";
import { formatSalary } from "../utils/formatSalary";
import { timeAgo } from "../utils/dateUtils";
import { BookmarkSimple } from "../icons/BookmarkSimple";
import { BookmarkSimpleFill } from "../icons/BookmarkSimpleFill";

const JobDetailsPanel = ({ job, onApply, onSave, onShare, onBack }) => {
    if (!job) {
        return (
            <div className="panel flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center sm:p-10">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand-action">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-ink mb-1">Select a job to view details</h3>
                <p className="text-sm text-ink-muted max-w-sm">
                    Click any job from the search results on the left to review its complete description and apply.
                </p>
            </div>
        );
    }

    const title = job.jobTitle || job.title || "Job Position";
    const company = job.companyName || job.company || "Company";
    const city = job.location?.city || job.city || "";
    const state = job.location?.state || job.state || "";
    const locationStr = [city, state].filter(Boolean).join(", ") || (typeof job.location === "string" ? job.location : "Remote");
    const workMode = job.workMode || "On-site";
    const salaryText = formatSalary(job);
    const postedTime = timeAgo(job.createdAt) || "Recently";
    const isSaved = Boolean(job.isSaved);
    const isApplied = Boolean(job.isApplied);
    const deadline = job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : null;

    return (
        <div className="panel flex h-full flex-col overflow-hidden text-left">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-line-weak bg-white p-5 sm:p-6">
                {/* Mobile Back Button */}
                <div className="lg:hidden mb-3">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-action hover:underline"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to search results</span>
                    </button>
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-brand-ink tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-base font-semibold text-brand-action">
                        {company}
                    </p>
                    <p className="text-sm text-ink-muted">
                        {locationStr} • <span className="font-medium text-ink">{workMode}</span>
                    </p>
                    {salaryText && (
                        <p className="text-base font-bold text-ink pt-1">
                            {salaryText}
                        </p>
                    )}
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    {isApplied ? (
                        <>
                            <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                className="btn min-h-11 cursor-not-allowed border border-brand-action/40 bg-brand-tint text-brand-action"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 12 4 4L19 6" />
                                </svg>
                                Applied
                            </button>
                            <span className="text-sm text-ink-muted">
                                You&apos;ve already applied to this job.
                            </span>
                        </>
                    ) : (
                        <button
                            onClick={() => onApply?.(job._id || job.id)}
                            className="btn btn-primary min-h-11"
                        >
                            Apply now
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave?.(job._id || job.id);
                        }}
                        className={`btn-icon h-11 w-11 ${isSaved ? "border-brand-action bg-brand-tint text-brand-action" : ""}`}
                        title={isSaved ? "Saved" : "Save job"}
                        aria-label={isSaved ? "Unsave job" : "Save job"}
                        aria-pressed={isSaved}
                    >
                        {isSaved ? <BookmarkSimpleFill className="w-5 h-5" /> : <BookmarkSimple className="w-5 h-5" />}
                    </button>
                    {onShare && (
                        <button
                            onClick={() => onShare(job._id || job.id)}
                            className="btn-icon h-11 w-11"
                            title="Share job"
                            aria-label="Share job"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm leading-relaxed text-ink sm:p-6">
                {/* Job Highlights / Details Card */}
                <div className="space-y-3 rounded-xl border border-line-weak bg-surface-raised p-4">
                    <h3 className="text-base font-bold text-brand-ink">
                        Job details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {salaryText && (
                            <div>
                                <span className="text-ink-muted block text-xs font-medium uppercase tracking-wider">Pay</span>
                                <span className="font-semibold text-ink">{salaryText}</span>
                            </div>
                        )}
                        {job.employmentType && (
                            <div>
                                <span className="text-ink-muted block text-xs font-medium uppercase tracking-wider">Job type</span>
                                <span className="font-semibold text-ink">{job.employmentType}</span>
                            </div>
                        )}
                        {job.experienceLevel && (
                            <div>
                                <span className="text-ink-muted block text-xs font-medium uppercase tracking-wider">Experience level</span>
                                <span className="font-semibold text-ink">{job.experienceLevel}</span>
                            </div>
                        )}
                        {job.category && (
                            <div>
                                <span className="text-ink-muted block text-xs font-medium uppercase tracking-wider">Category</span>
                                <span className="font-semibold text-ink">{job.category}</span>
                            </div>
                        )}
                        {deadline && (
                            <div>
                                <span className="text-ink-muted block text-xs font-medium uppercase tracking-wider">Application deadline</span>
                                <span className="font-semibold text-ink">{deadline}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-ink-muted block text-xs font-medium uppercase tracking-wider">Posted</span>
                            <span className="font-semibold text-ink">{postedTime}</span>
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                {job.skills && job.skills.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-brand-ink mb-2 uppercase tracking-wider text-xs">
                            Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-brand-tint text-brand-action font-semibold text-xs rounded-[4px]"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Full Description */}
                <div>
                    <h3 className="text-lg font-bold text-brand-ink mb-3 border-b border-line-weak pb-2">
                        Full job description
                    </h3>
                    <div className="whitespace-pre-line text-ink text-sm leading-relaxed space-y-3">
                        {job.jobDescription || "No detailed description provided."}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailsPanel;
