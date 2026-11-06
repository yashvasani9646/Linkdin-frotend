import { useState } from 'react';

const InputField = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    required = false,
    placeholder = '',
    className = '',
    wrapperClassName = 'mb-5',
    error = '',
    onBlur,
    disabled = false,
    autoComplete,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const hasError = !!error;

    return (
        <div className={wrapperClassName}>
            {label && (
                <label htmlFor={name} className="field-label">
                    {label}
                    {required && <span className="ml-1 text-danger">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                    id={name}
                    name={name}
                    value={value ?? ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    aria-invalid={hasError || undefined}
                    aria-describedby={hasError ? `${name}-error` : undefined}
                    className={`field-input min-h-11 ${hasError ? 'field-input-error' : ''} ${disabled ? 'cursor-not-allowed bg-surface opacity-70' : ''} ${type === 'password' ? 'pr-11' : ''} ${className}`}
                    placeholder={placeholder}
                />
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-brand-tint hover:text-brand-action"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="M3 3l18 18" />
                                <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
                                <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c6.5 0 10 6 10 6a18.4 18.4 0 0 1-2.26 3.11" />
                                <path d="M6.18 6.18A18.6 18.6 0 0 0 2 10s3.5 6 10 6a9.9 9.9 0 0 0 3.12-.51" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {hasError && (
                <p id={`${name}-error`} className="field-error">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
};

export default InputField;
