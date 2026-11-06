import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import notificationService from "../services/notificationService";
import { getErrorMessage } from "../utils/errorHandler";

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasMore: false,
  });

  const [tabCounts, setTabCounts] = useState({
    all: 0,
    job_alert: 0,
    system_update: 0,
  });

  const tabs = [
    { id: "all", label: "All", count: tabCounts.all },
    { id: "job_alert", label: "Job Alerts", count: tabCounts.job_alert },
    {
      id: "system_update",
      label: "System Updates",
      count: tabCounts.system_update,
    },
  ];

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const params = {
          page: 1,
          limit: 20,
        };

        // Add type filter if not "all"
        if (activeTab !== "all") {
          params.type = activeTab;
        }

        const response = await notificationService.getNotifications(params);

        if (response.success && response.data) {
          setNotifications(response.data.notifications || []);
          const newPagination = response.data.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
          };
          setPagination(newPagination);

          // Update the specific tab count
          setTabCounts((prev) => ({
            ...prev,
            [activeTab]: newPagination.total,
          }));

          // If we are on a specific tab, also fetch 'all' count if it's 0 or needs refresh
          if (activeTab !== "all") {
            const allResponse = await notificationService.getNotifications({
              page: 1,
              limit: 1,
            });
            if (allResponse.success && allResponse.data) {
              setTabCounts((prev) => ({
                ...prev,
                all: allResponse.data.pagination?.total || 0,
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error(getErrorMessage(error, "Failed to load notifications"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [activeTab]);

  // Format time display
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just Now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  // Get badge text based on notification type
  const getBadgeText = (notification) => {
    if (notification.type === "job_alert") return "Job Alert";
    if (notification.type === "system_update") return "Update";
    return "New";
  };

  // Handle notification click - mark as read
  const handleNotificationClick = async (notification) => {
    try {
      const response = await notificationService.markAsRead(notification._id);
      if (response.success) {
        // Update local state to mark as read
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation(); // Prevent triggering the click handler

    try {
      const response = await notificationService.deleteNotification(
        notificationId
      );
      if (response.success) {
        // Remove from local state
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
        // Decrement respective counts
        setTabCounts((prev) => ({
          ...prev,
          all: Math.max(0, prev.all - 1),
          [activeTab]: Math.max(0, prev[activeTab] - 1),
        }));
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(getErrorMessage(error, "Failed to delete notification"));
    }
  };

  return (
    <div className="page-shell pb-16">
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Notifications</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            / <span className="font-medium text-ink">Notifications</span>
          </p>
        </div>
      </div>

      <div className="app-container pt-6 sm:pt-8">
          {/* Filter Tabs */}
          <div className="no-scrollbar mb-6 inline-flex max-w-full overflow-x-auto rounded-full border border-line-weak bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand-action text-white shadow-sm"
                    : "text-ink-muted hover:bg-surface-raised hover:text-brand-ink"
                }`}
              >
                {tab.label}
                {tab.count > 0 && ` (${tab.count})`}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-state py-20">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : (
            /* Notifications List */
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`panel panel-hover group relative cursor-pointer p-4 md:p-5 ${
                      !notification.isRead ? "border-brand-action/30 bg-brand-tint/20" : ""
                    }`}
                  >
                    {/* Delete button - shows on hover */}
                    <button
                      type="button"
                      aria-label="Delete notification"
                      onClick={(e) =>
                        handleDeleteNotification(e, notification._id)
                      }
                      className="absolute bottom-3 right-3 rounded-full p-1.5 text-ink-subtle opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                      title="Delete notification"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>

                    <div className="relative flex items-start justify-between gap-2.5">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="badge badge-brand">
                            {getBadgeText(notification)}
                          </span>
                          <span className="text-xs font-semibold text-ink">
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-brand-action"></span>
                          )}
                        </div>
                        <p className="mb-1 text-sm font-medium leading-6 text-ink">
                          {notification.message}
                        </p>
                        {notification.relatedJob && (
                          <p className="text-sm text-ink-muted">
                            {notification.relatedJob.rate &&
                              `₹${notification.relatedJob.rate}`}
                            {notification.relatedJob.rate &&
                              notification.relatedJob.location &&
                              " • "}
                            {notification.relatedJob.location}
                          </p>
                        )}
                      </div>
                      <span className="whitespace-nowrap text-xs font-medium text-ink-subtle">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                // Empty State
                <div className="empty-state">
                  <img
                    src="/Empty_notification.svg"
                    alt=""
                    className="mb-6 w-full max-w-[240px]"
                  />
                  <h2 className="text-xl font-bold text-brand-ink">
                    No notifications available right now
                  </h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    Check back soon for updates.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Load More Button */}
          {pagination.hasMore && !isLoading && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  // Could implement load more functionality here
                }}
              >
                Load more
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default NotificationPage;
