import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  clearUser,
  selectUser,
  updateUser,
} from "../store/slices/authSlice";
import { userService } from "../services/userService";
import { getErrorMessage } from "../utils/errorHandler";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const displayEmail = user?.email || "Not available";
  const displayPhone = user?.phoneNumber || user?.phone || "";

  const handleOpenPhoneEditor = () => {
    setPhoneDraft(String(displayPhone).replace(/\D/g, "").slice(0, 10));
    setPhoneError("");
    setIsEditingPhone(true);
  };

  const handleCancelPhoneEdit = () => {
    setPhoneDraft("");
    setPhoneError("");
    setIsEditingPhone(false);
  };

  const handlePhoneSave = async (event) => {
    event.preventDefault();

    const normalizedPhone = phoneDraft.replace(/\D/g, "");
    if (normalizedPhone.length !== 10) {
      setPhoneError("Enter a 10-digit phone number.");
      return;
    }

    setPhoneError("");
    setIsSavingPhone(true);

    try {
      const response = await userService.editProfile({
        phoneNumber: normalizedPhone,
      });
      const updatedPhone =
        response?.data?.user?.phoneNumber || normalizedPhone;

      dispatch(updateUser({ phoneNumber: updatedPhone, phone: updatedPhone }));
      setIsEditingPhone(false);
      toast.success("Phone number updated.");
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to update your phone number. Please try again."
      );
      setPhoneError(message);
      toast.error(message);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSignOut = () => {
    dispatch(clearUser());
    navigate("/auth/signin", { replace: true });
  };

  const handleContinueToPasswordReset = () => {
    dispatch(clearUser());
    navigate("/auth/forgot-password", { replace: true });
  };

  return (
    <div className="page-shell pb-16">
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Settings</h1>
          <p className="text-sm text-ink-muted">
            <Link
              to="/dashboard"
              className="transition-colors hover:text-brand-action"
            >
              Home
            </Link>{" "}
            / <span className="font-medium text-ink">Settings</span>
          </p>
        </div>
      </div>

      <div className="app-container pt-6 sm:pt-8">
        <div className="mx-auto max-w-[872px] space-y-6">
          <div>
            <h2 className="page-title">Account settings</h2>
            <p className="page-subtitle">
              Manage your contact details, sign-in security, and current session.
            </p>
          </div>

          <section className="panel" aria-labelledby="contact-settings-heading">
            <div className="border-b border-line-weak p-5 sm:p-6">
              <h2 id="contact-settings-heading" className="section-title">
                Contact information
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                These details are used for account access and recruiter contact.
              </p>
            </div>

            <div className="divide-y divide-line-weak">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">Email</h3>
                    <span className="badge badge-neutral">View only</span>
                  </div>
                  <p className="mt-1 break-all text-sm text-ink-muted">
                    {displayEmail}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-subtle">
                    Email changes are not available in this version because a
                    verified email-change flow is not implemented on the server.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">
                      Phone number
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {displayPhone || "Not provided"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-subtle">
                      Used by employers when discussing an application.
                    </p>
                  </div>

                  {!isEditingPhone && (
                    <button
                      type="button"
                      onClick={handleOpenPhoneEditor}
                      disabled={!user}
                      className="btn btn-secondary shrink-0"
                    >
                      Change phone number
                    </button>
                  )}
                </div>

                {isEditingPhone && (
                  <form
                    onSubmit={handlePhoneSave}
                    className="mt-4 rounded-lg border border-line-weak bg-surface-raised p-4"
                    noValidate
                  >
                    <label htmlFor="settings-phone" className="field-label">
                      New phone number
                    </label>
                    <input
                      id="settings-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phoneDraft}
                      onChange={(event) => {
                        setPhoneDraft(
                          event.target.value.replace(/\D/g, "").slice(0, 10)
                        );
                        if (phoneError) setPhoneError("");
                      }}
                      aria-invalid={Boolean(phoneError)}
                      aria-describedby={
                        phoneError ? "settings-phone-error" : undefined
                      }
                      className={`field-input max-w-sm ${
                        phoneError ? "field-input-error" : ""
                      }`}
                      disabled={isSavingPhone}
                    />
                    <p className="field-help">Enter exactly 10 digits.</p>
                    {phoneError && (
                      <p id="settings-phone-error" className="field-error">
                        {phoneError}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={isSavingPhone}
                        className="btn btn-primary"
                      >
                        {isSavingPhone ? "Saving..." : "Save phone number"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPhoneEdit}
                        disabled={isSavingPhone}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="security-settings-heading">
            <div className="border-b border-line-weak p-5 sm:p-6">
              <h2 id="security-settings-heading" className="section-title">
                Sign-in and security
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Review the sign-in methods available for your account.
              </p>
            </div>

            <div className="divide-y divide-line-weak">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Password</h3>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">
                      Reset your password with a one-time code sent to your
                      account email. You will be signed out before continuing.
                    </p>
                  </div>
                  {!showPasswordReset && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(true)}
                      className="btn btn-secondary shrink-0"
                    >
                      Reset password
                    </button>
                  )}
                </div>

                {showPasswordReset && (
                  <div className="alert alert-warning mt-4" role="alert">
                    <div>
                      <p className="font-semibold">
                        Continue only if you can access your email.
                      </p>
                      <p className="mt-1">
                        You will be signed out, then you can request a reset code
                        from the sign-in flow.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleContinueToPasswordReset}
                          className="btn btn-primary"
                        >
                          Sign out and continue
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordReset(false)}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">Passkey</h3>
                    <span className="badge badge-neutral">Not available</span>
                  </div>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">
                    Passkey sign-in is not implemented in this version. Use your
                    email and password to sign in.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="session-settings-heading">
            <div className="border-b border-line-weak p-5 sm:p-6">
              <h2 id="session-settings-heading" className="section-title">
                Session
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Sign out of this browser. You can sign in again at any time.
              </p>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink">Signed in as</h3>
                <p className="mt-1 break-all text-sm text-ink-muted">
                  {displayEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-secondary shrink-0"
              >
                Sign out
              </button>
            </div>
          </section>

          <section
            className="panel border-danger/20 p-5 sm:p-6"
            aria-labelledby="account-closure-heading"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="account-closure-heading" className="section-title">
                Close account
              </h2>
              <span className="badge badge-neutral">Not available</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
              Account closure is not available in-app because there is no
              self-service account deletion endpoint. An administrator must
              deactivate the account.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
