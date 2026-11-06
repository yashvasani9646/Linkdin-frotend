import React from "react";

/**
 * Turns a date string or timestamp into a friendly human-readable relative time:
 * e.g., "Just now", "Today", "Yesterday", "3 days ago", "2 weeks ago"
 */
export const timeAgo = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
        if (diffHours === 0) {
            if (diffMin <= 1) return "Just now";
            return `${diffMin} minutes ago`;
        }
        return "Today";
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return "1 month ago";
    return `${Math.floor(diffDays / 30)} months ago`;
};

/**
 * Wraps matched query terms in <mark> for search highlighting.
 * Uses React.createElement to keep dateUtils.js pure standard JavaScript.
 */
export const HighlightText = ({ text = "", query = "" }) => {
    if (!text) return null;
    if (!query || !query.trim()) return React.createElement("span", null, text);

    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return React.createElement(
        "span",
        null,
        parts.map((part, index) =>
            regex.test(part)
                ? React.createElement(
                      "mark",
                      {
                          key: index,
                          className: "bg-[#FAF775] text-[#2D2D2D] rounded-xs px-0.5 font-medium",
                      },
                      part
                  )
                : part
        )
    );
};

export default { timeAgo, HighlightText };
