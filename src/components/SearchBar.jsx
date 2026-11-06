import { useState, forwardRef, useImperativeHandle } from "react";
import { SearchIcon } from "../icons/SearchIon";
import { Cross } from "../icons/Cross";

const SearchBar = forwardRef(
  (
    {
      onSearch,
      jobPlaceholder = "Job title, keywords, or company",
      locationPlaceholder = "City, state, zip code, or 'remote'",
      searchButtonText = "Find jobs",
      containerClassName = "w-full max-w-[1024px] mx-auto",
      initialQuery = "",
      initialLocation = "",
    },
    ref
  ) => {
    const [jobQuery, setJobQuery] = useState(initialQuery);
    const [location, setLocation] = useState(initialLocation);
    const [isWhatFocused, setIsWhatFocused] = useState(false);
    const [isWhereFocused, setIsWhereFocused] = useState(false);

    useImperativeHandle(ref, () => ({
      getSearchQuery: () => ({
        q: jobQuery,
        where: location,
        jobQuery,
        location,
      }),
      setJobQuery,
      setLocation,
    }));

    const handleSearch = (e) => {
      e?.preventDefault();

      if (onSearch) {
        onSearch({
          q: jobQuery.trim(),
          where: location.trim(),
          jobQuery: jobQuery.trim(),
          location: location.trim(),
        });
      }
    };

    return (
      <div className={containerClassName}>
        <form onSubmit={handleSearch} role="search" aria-label="Job search">
          <div className="rounded-2xl border border-line-weak bg-white p-1.5 shadow-card transition-shadow focus-within:shadow-card-hover sm:p-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
              <div
                className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-colors md:min-h-12 ${
                  isWhatFocused
                    ? "border-brand-action bg-white"
                    : "border-transparent hover:bg-surface-raised/70"
                }`}
              >
                <div className="shrink-0 text-ink-muted">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder={jobPlaceholder}
                  value={jobQuery}
                  onChange={(e) => setJobQuery(e.target.value)}
                  onFocus={() => setIsWhatFocused(true)}
                  onBlur={() => setIsWhatFocused(false)}
                  aria-label="Job title, keyword, or company"
                  className="min-w-0 w-full border-0 bg-transparent text-sm font-normal text-ink shadow-none outline-none ring-0 placeholder:text-ink-subtle focus:outline-none xl:text-base"
                />
                {jobQuery && (
                  <button
                    type="button"
                    onClick={() => setJobQuery("")}
                    className="shrink-0 cursor-pointer rounded-md p-1.5 text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30"
                    aria-label="Clear job query"
                  >
                    <Cross className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div
                className={`hidden w-px shrink-0 self-stretch bg-line md:block ${
                  isWhatFocused || isWhereFocused ? "opacity-0" : "opacity-100"
                }`}
                aria-hidden="true"
              />

              <div
                className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-colors md:min-h-12 ${
                  isWhereFocused
                    ? "border-brand-action bg-white"
                    : "border-transparent hover:bg-surface-raised/70"
                }`}
              >
                <div className="shrink-0 text-ink-muted">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={locationPlaceholder}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setIsWhereFocused(true)}
                  onBlur={() => setIsWhereFocused(false)}
                  aria-label="City, state, or remote"
                  className="min-w-0 w-full border-0 bg-transparent text-sm font-normal text-ink shadow-none outline-none ring-0 placeholder:text-ink-subtle focus:outline-none xl:text-base"
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => setLocation("")}
                    className="shrink-0 cursor-pointer rounded-md p-1.5 text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action/30"
                    aria-label="Clear location query"
                  >
                    <Cross className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary min-h-12 w-full shrink-0 px-6 text-sm md:w-auto xl:text-base"
              >
                {searchButtonText}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
