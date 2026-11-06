import React from "react";
import { Link } from "react-router-dom";

export const Logo = ({
  variant = "blue",
  size = "default",
  className = "",
  to = "/",
}) => {
  const isWhite = variant === "white";
  const textColor = isWhite ? "#FFFFFF" : "#003A9B";
  const boxColor = isWhite ? "#FFFFFF" : "#003A9B";
  const bugTextColor = isWhite ? "#003A9B" : "#FFFFFF";

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
      aria-label="Indeed"
    >
      <title>Indeed</title>
      {/* "Indeed" wordmark */}
      <text
        x="0"
        y="21"
        fill={textColor}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontSize="24"
        fontWeight="700"
        letterSpacing="-0.035em"
      >
        Indeed
      </text>
      {/* "i" official rounded bug */}
      <g transform="translate(76, 2)">
        <rect width="24" height="24" rx="4" fill={boxColor} />
        <path
          transform="translate(1.8, 1.8) scale(0.85)"
          d="M11.566 21.5633v-8.762c.2553.0231.5009.0346.758.0346 1.2225 0 2.3739-.3206 3.3506-.8928v9.6182c0 .8219-.1957 1.4287-.5757 1.8338-.378.4033-.8808.6049-1.491.6049-.6007 0-1.0766-.2016-1.468-.6183-.3781-.4032-.5739-1.01-.5739-1.8184zM11.589.5659c2.5447-.8929 5.4424-.8449 7.6186.987.405.3687.8673.8334 1.0515 1.3806.2207.6913-.7695-.073-.9057-.167-.71-.4532-1.4182-.8334-2.2127-1.0946C12.8614.3873 8.8122 2.709 6.2945 6.315c-1.0516 1.5939-1.7367 3.2721-2.299 5.1174-.0614.2017-.1094.4647-.2207.6413-.1113.2036-.048-.5453-.048-.5702.0845-.7623.2438-1.4997.4414-2.237C5.3292 5.3375 7.897 2.0655 11.5891.5658zm4.9281 7.0587c0 1.6686-1.353 3.0224-3.0205 3.0224-1.6677 0-3.0186-1.3538-3.0186-3.0224 0-1.6687 1.351-3.0224 3.0186-3.0224 1.6676 0 3.0205 1.3518 3.0205 3.0224Z"
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
        aria-label="Indeed Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
