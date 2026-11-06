import React, { useState, useRef, useEffect } from "react";
// Import icons matching CreateJobPostModal
import { Bold } from "../../icons/Bold";
import { Italic } from "../../icons/Italic";
import { UnderLine } from "../../icons/Underline";
import { Strikethrough } from "../../icons/Strikethrough";
import { PutLink } from "../../icons/PutLink";
import { List } from "../../icons/List";
import { NuList } from "../../icons/NuList";
import api from "../../services/api";
import { API_CONFIG } from "../../config/api.config";
import SelectField from "../../components/common/SelectField";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../utils/errorHandler";

const AdminNotificationsPage = () => {
  const [inAppChecked, setInAppChecked] = useState(true);
  const [emailChecked, setEmailChecked] = useState(false);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch users for notification audience
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await api.get(
          API_CONFIG.ENDPOINTS.ADMIN.NOTIFICATION_USERS
        );
        if (response?.data?.success && response?.data?.data?.users) {
          setUsers(response.data.data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error(getErrorMessage(error, "Failed to load users list"));
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Helper function to get selected user IDs for notification payload
  const getSelectedUserIds = () => {
    if (selectedAudience === "all") {
      // Return all user IDs when "All Users" is selected
      return users.map((user) => user._id);
    } else if (selectedAudience) {
      // Return single user ID in array
      return [selectedAudience];
    }
    return [];
  };

  const editorRef = useRef(null);

  // Formatting functions
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleDescriptionChange = () => {
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
    }
  };

  // Handle send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!description.trim() || description === "<br>") {
      newErrors.message = "Message is required";
    }
    if (!selectedAudience) {
      newErrors.audience = "Please select an audience";
    }
    if (!inAppChecked && !emailChecked) {
      newErrors.delivery = "Please select at least one delivery method";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const userIds = getSelectedUserIds();
    if (userIds.length === 0) {
      toast.error("No users selected");
      return;
    }

    try {
      setIsSending(true);
      const payload = {
        title: title.trim(),
        message: description,
        userIds: userIds,
        deliveryMethods: {
          inApp: inAppChecked,
          email: emailChecked,
        },
      };

      const response = await api.post(
        API_CONFIG.ENDPOINTS.ADMIN.SEND_NOTIFICATION,
        payload
      );

      if (response?.data?.success) {
        const result = response.data.data || {};
        const delivered = result.totalSent ?? result.totalUsers ?? userIds.length;
        const failed = (result.totalFailed || 0) + (result.totalSkipped || 0);
        const message = `Notification delivered to ${delivered} user(s)${
          failed > 0 ? `; ${failed} delivery attempt(s) failed or were skipped` : ""
        }.`;

        if (failed > 0) {
          toast.warning(message);
        } else {
          toast.success(message);
        }

        // Reset form
        setTitle("");
        setDescription("");
        setSelectedAudience("");
        setInAppChecked(true);
        setEmailChecked(false);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast.error(
        getErrorMessage(error, "Failed to send notification")
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="page-title">Admin notifications</h1>
        <p className="page-subtitle">
          Send notifications to selected user groups.
        </p>
      </div>

      <div className="mx-auto max-w-[860px]">
        <form onSubmit={(e) => e.preventDefault()} className="panel space-y-6 p-5 sm:p-6">
          {/* Title */}
          <div>
            <label className="field-label" htmlFor="notification-title">
              Title
            </label>
            <input
              id="notification-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className={errors.title ? "field-input field-input-error mt-1.5" : "field-input mt-1.5"}
            />
            {errors.title && (
              <p className="field-error">{errors.title}</p>
            )}
          </div>

          {/* Message (Rich Text from CreateJobPostModal) */}
          <div>
            <label className="field-label">
              Message
            </label>
            <div className="relative mt-1.5 overflow-hidden rounded-lg border border-line-weak focus-within:border-brand-action focus-within:ring-2 focus-within:ring-brand-action/15">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleDescriptionChange}
                className="h-[180px] w-full overflow-y-auto bg-white px-4 py-3 text-sm leading-6 text-ink outline-none"
                data-placeholder="Enter notification message"
              />

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-t border-line-weak bg-surface-raised px-2.5 py-2">
                <button
                  onClick={() => execCommand("bold")}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <Bold />
                </button>
                <button
                  onClick={() => execCommand("italic")}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <Italic />
                </button>
                <button
                  onClick={() => execCommand("underline")}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <UnderLine />
                </button>
                <button
                  onClick={() => execCommand("strikeThrough")}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <Strikethrough />
                </button>
                <div className="w-px h-4 bg-line-weak mx-1"></div>
                <button
                  onClick={() => {
                    const url = prompt("Enter link URL");
                    if (url) execCommand("createLink", url);
                  }}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <PutLink />
                </button>
                <div className="w-px h-4 bg-line-weak mx-1"></div>
                <button
                  onClick={() => execCommand("insertUnorderedList")}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <List />
                </button>
                <button
                  onClick={() => execCommand("insertOrderedList")}
                  className=" hover:bg-gray-100 rounded text-ink-muted"
                >
                  <NuList />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Audience */}
            <SelectField
              label="Audience"
              name="audience"
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              disabled={isLoadingUsers}
              placeholder={
                isLoadingUsers ? "Loading users..." : "Select audience"
              }
              error={errors.audience || ""}
              wrapperClassName="mb-0"
              options={[
                { value: "all", label: `All Users (${users.length})` },
                ...users.map((user) => ({
                  value: user._id,
                  label: user.name,
                })),
              ]}
            />

            {/* Delivery */}
            <div>
              <label className="field-label">
                Delivery
              </label>
              <div className="mt-3 flex items-center gap-6">
                <label className="inline-flex items-center gap-2.5 ">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded cursor-pointer border-gray-300 text-brand-action focus:ring-brand-action"
                    checked={inAppChecked}
                    onChange={(e) => setInAppChecked(e.target.checked)}
                  />
                  <span className="block cursor-pointer text-sm font-medium leading-6 text-ink">
                    In app
                  </span>
                </label>
                <label className="inline-flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded cursor-pointer border-gray-300 text-brand-action focus:ring-brand-action"
                    checked={emailChecked}
                    onChange={(e) => setEmailChecked(e.target.checked)}
                  />
                  <span className="block text-sm font-medium cursor-pointer leading-6 -tracking-[2%] text-secondary ">
                    Email
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-line-weak pt-5">
            <button
              type="button"
              onClick={handleSendNotification}
              disabled={isSending}
              className="btn btn-primary"
            >
              {isSending ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
