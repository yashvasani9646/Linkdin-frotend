import { useState, useRef, useEffect, useId } from "react";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error = "",
  className = "",
  wrapperClassName = "mb-6",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);

  const generatedId = useId();
  const fieldId = name || generatedId;
  const labelId = `${fieldId}-label`;
  const listboxId = `${fieldId}-listbox`;
  const errorId = `${fieldId}-error`;

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  const hasError = Boolean(error);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  // Focus active option when keyboard navigating
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (optionValue) => {
    if (disabled) return;

    onChange?.({
      target: {
        name,
        value: optionValue,
      },
    });

    setIsOpen(false);
    setActiveIndex(-1);
    buttonRef.current?.focus();
  };

  const openDropdown = () => {
    if (disabled) return;

    const selectedIndex = options.findIndex(
      (option) => String(option.value) === String(value)
    );

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (disabled) return;

    if (isOpen) {
      setIsOpen(false);
      setActiveIndex(-1);
    } else {
      openDropdown();
    }
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ": {
        event.preventDefault();

        if (!isOpen) {
          openDropdown();
        } else if (activeIndex >= 0 && options[activeIndex]) {
          handleSelect(options[activeIndex].value);
        }
        break;
      }

      case "ArrowDown": {
        event.preventDefault();

        if (!isOpen) {
          openDropdown();
        } else if (options.length > 0) {
          setActiveIndex((previous) =>
            previous < options.length - 1 ? previous + 1 : 0
          );
        }
        break;
      }

      case "ArrowUp": {
        event.preventDefault();

        if (!isOpen) {
          openDropdown();
        } else if (options.length > 0) {
          setActiveIndex((previous) =>
            previous > 0 ? previous - 1 : options.length - 1
          );
        }
        break;
      }

      case "Home": {
        if (isOpen && options.length > 0) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      }

      case "End": {
        if (isOpen && options.length > 0) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      }

      case "Escape": {
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
        }
        break;
      }

      case "Tab": {
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      }

      default:
        break;
    }
  };

  return (
    <div
      className={`relative ${wrapperClassName}`}
      ref={dropdownRef}
    >
      {/* Label */}
      {label && (
        <label
          id={labelId}
          className="field-label mb-2 block"
        >
          {label}

          {required && (
            <span className="ml-1 text-danger">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {/* Dropdown Trigger */}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? labelId : undefined}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`
            field-input
            flex min-h-11 w-full items-center justify-between gap-3
            rounded-xl border bg-white px-4 py-2.5
            text-left text-sm
            transition-all duration-200 ease-in-out
            focus:outline-none
            ${
              hasError
                ? "field-input-error border-red-400 focus:ring-2 focus:ring-red-100"
                : isOpen
                  ? "border-brand-action ring-2 ring-brand-action/15"
                  : "border-line-weak hover:border-brand-action/50"
            }
            ${
              disabled
                ? "cursor-not-allowed bg-surface opacity-60"
                : "cursor-pointer"
            }
            ${className}
          `}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedOption && selectedOption.value !== ""
                ? "font-medium text-ink"
                : "font-normal text-ink-subtle"
            }`}
          >
            {selectedOption && selectedOption.value !== ""
              ? selectedOption.label
              : placeholder}
          </span>

          {/* Chevron */}
          <svg
            className={`
              h-4 w-4 shrink-0
              text-ink-subtle
              transition-transform duration-200
              ${isOpen ? "rotate-180 text-brand-action" : ""}
            `}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m6 9 6 6 6-6"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            className="
              absolute left-0 right-0 top-full z-[100]
              mt-2 max-h-64 overflow-y-auto
              rounded-xl border border-line-weak
              bg-white p-1.5
              shadow-dropdown
              animate-in fade-in slide-in-from-top-1
              duration-150
            "
          >
            {options.length > 0 ? (
              options.map((option, index) => {
                const isSelected =
                  String(option.value) === String(value);

                const isActive = activeIndex === index;

                return (
                  <div
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      flex min-h-10 cursor-pointer
                      items-center justify-between gap-3
                      rounded-lg px-3.5 py-2.5
                      text-sm
                      transition-colors duration-150
                      ${
                        isSelected
                          ? "bg-brand-tint font-semibold text-brand-action"
                          : isActive
                            ? "bg-surface-raised text-brand-ink"
                            : "text-ink hover:bg-surface-raised"
                      }
                    `}
                  >
                    <span className="min-w-0 flex-1 break-words">
                      {option.label}
                    </span>

                    {isSelected && (
                      <svg
                        className="h-4 w-4 shrink-0 text-brand-action"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-5 text-center text-sm text-ink-subtle">
                No options available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p
          id={errorId}
          className="field-error mt-2 flex items-start gap-1.5"
          role="alert"
        >
          <svg
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7 4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1Z"
              clipRule="evenodd"
            />
          </svg>

          <span>{error}</span>
        </p>
      )} 
    </div>
  ); 
};

export default SelectField;