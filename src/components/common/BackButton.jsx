import { useNavigate } from "react-router-dom";

/**
 * Consistent page back button.
 *
 * Navigation behaviour:
 * - If there is real in-app history (the router has pushed at least one
 *   entry), go back one step.
 * - Otherwise the user landed here directly (deep link / new tab), so go to
 *   the `fallback` parent route instead of a blind navigate(-1).
 */
const BackButton = ({
  fallback = "/dashboard/profile",
  label = "Go back",
  className = "",
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    const idx = window.history.state?.idx;
    const hasHistory = typeof idx === "number" && idx > 0;

    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      title={label}
      className={`btn-icon shrink-0 ${className}`}
    >
      <img src="/Right_arrow.svg" alt="" className="h-5 w-5 rotate-180" />
    </button>
  );
};

export default BackButton;
