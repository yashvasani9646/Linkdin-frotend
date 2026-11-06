import React from "react";
import { Link } from "react-router-dom";

export const Logo = ({
  variant = "blue",
  size = "default",
  className = "",
  to = "/",
}) => {
  const isWhite = variant === "white";
  const textColor = isWhite ? "#FFFFFF" : "#0A66C2";
  const boxColor = isWhite ? "#FFFFFF" : "#0A66C2";
  const bugTextColor = isWhite ? "#0A66C2" : "#FFFFFF";

  const sizeClasses = {
    sm: "h-6 w-auto",
    default: "h-7 md:h-8 w-auto",
    lg: "h-9 md:h-10 w-auto",
  };

  const heightClass = sizeClasses[size] || sizeClasses.default;

  const content = (
    <svg
      viewBox="0 0 102 26"
      className={`inline-block select-none ${heightClass} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="LinkedIn"
    >
      <title>LinkedIn</title>
      {/* "Linked" wordmark */}
      <text
        x="0"
        y="21"
        fill={textColor}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontSize="24"
        fontWeight="700"
        letterSpacing="-0.035em"
      >
        Linked
      </text>
      {/* "in" official rounded bug */}
      <g transform="translate(76, 2)">
        <rect width="24" height="24" rx="4" fill={boxColor} />
        <circle cx="5.337" cy="5.368" r="2.065" fill={bugTextColor} />
        <rect x="3.555" y="9" width="3.564" height="11.452" rx="0.5" fill={bugTextColor} />
        <path
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"
          fill={bugTextColor}
        />
      </g>
    </svg>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="logo-link inline-flex items-center no-underline hover:no-underline focus:no-underline active:no-underline outline-none focus:outline-none transition-opacity hover:opacity-90"
        style={{ textDecoration: "none" }}
        aria-label="LinkedIn Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
