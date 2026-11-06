import React from "react";
import { formatSalary } from "../utils/formatSalary";
import { timeAgo, HighlightText } from "../utils/dateUtils";
import { BookmarkSimple } from "../icons/BookmarkSimple";
import { BookmarkSimpleFill } from "../icons/BookmarkSimpleFill";

const getInitials = (company = "Company") =>
  company
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

const JobCard = ({ job, isActive, onClick, onSave, searchQuery = "" }) => {
  if (!job) return null;

  const title = job.jobTitle || job.title || "Job Position";
  const company = job.companyName || job.company || "Company";
  const city = job.location?.city || job.city || "";
  const state = job.location?.state || job.state || "";
  const locationStr =
    [city, state].filter(Boolean).join(", ") ||
    (typeof job.location === "string" ? job.location : "Remote");
  const workMode = job.workMode;
  const salaryText = formatSalary(job);
  const postedTime =
    timeAgo(job.createdAt) ||
    (job.daysAgo !== undefined
      ? job.daysAgo === 0
        ? "Today"
        : `${job.daysAgo} days ago`
      : "Recently");
  const descriptionSnippet = job.jobDescription || "";
  const isSaved = Boolean(job.isSaved);

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`panel panel-hover group relative cursor-pointer p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/40 sm:p-5 ${
        isActive ? "border-brand-action bg-brand-tint/25 shadow-card-hover" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-xs font-bold text-ink-muted transition-colors group-hover:bg-brand-tint group-hover:text-brand-action"
          aria-hidden="true"
        >
          {getInitials(company)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {job.isApplied ? (
              <span className="badge badge-brand">Applied</span>
            ) : null}
            {job.isNew ? <span className="badge badge-success">New</span> : null}
            {job.category ? (
              <span className="badge badge-neutral">{job.category}</span>
            ) : null}
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-brand-ink transition-colors group-hover:text-brand-action sm:text-lg">
            <HighlightText text={title} query={searchQuery} />
          </h3>
          <p className="mt-1 truncate text-sm font-medium text-ink-muted">
            <HighlightText text={company} query={searchQuery} />
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave?.(job._id || job.id);
          }}
          title={isSaved ? "Saved" : "Save job"}
          className={`btn-icon -mr-1 -mt-1 shrink-0 border-transparent bg-transparent ${
            isSaved ? "text-brand-action" : ""
          }`}
          aria-label={isSaved ? "Unsave job" : "Save job"}
          aria-pressed={isSaved}
        >
          {isSaved ? (
            <BookmarkSimpleFill className="h-5 w-5" />
          ) : (
            <BookmarkSimple className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
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
        <span>{locationStr}</span>
        {workMode ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-ink">{workMode}</span>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {salaryText ? (
          <span className="badge badge-neutral font-semibold text-ink">
            {salaryText}
          </span>
        ) : null}
        {job.employmentType ? (
          <span className="badge badge-neutral">{job.employmentType}</span>
        ) : null}
        {job.experienceLevel ? (
          <span className="badge badge-neutral">{job.experienceLevel}</span>
        ) : null}
      </div>

      {descriptionSnippet ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          <HighlightText text={descriptionSnippet} query={searchQuery} />
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-weak pt-3 text-xs text-ink-subtle">
        <span>Posted {postedTime}</span>
        {job.applicationCount > 0 ? (
          <span>
            {job.applicationCount} applicant
            {job.applicationCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-semibold text-brand-action">
            View details
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
        )}
      </div>
    </article>
  );
};

export default JobCard;
