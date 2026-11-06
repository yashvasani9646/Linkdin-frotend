import { useState, useEffect } from "react";
import { ModelCross } from "../icons/ModelCross";
import api from "../services/api";
import { API_CONFIG } from "../config/api.config";
import { getErrorMessage } from "../utils/errorHandler";

const AdminJobDetailsModal = ({ isOpen, onClose, jobId }) => {
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch job details when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setJob(null);
      setError(null);
    }
  }, [isOpen, jobId]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.ADMIN.JOBS}/${jobId}`
      );
      if (response?.data?.success && response.data.data?.job) {
        setJob(response.data.data.job);
      }
    } catch (err) {
      console.error("Failed to fetch job details:", err);
      setError(getErrorMessage(err, "Failed to fetch job details"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Helper to render a detail row
  const renderRow = (label, value) => (
    <div className="flex flex-row text-sm leading-6 mb-5 last:mb-0 gap-2">
      <div className="w-[110px] min-w-[150px] text-sm leading-[100%] tracking[0%] font-medium text-secondary">
        {label} :
      </div>
      <div className="flex-1 text-sm leading-[100%] tracking[0%] font-medium text-secondary">
        {value || "-"}
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-xl">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-brand-ink">Job Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Close modal"
          >
            <ModelCross className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500">Loading job details...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-red-500">{error}</p>
            </div>
          ) : job ? (
            <div className="space-y-1">
              {renderRow("Job Title", job.jobTitle || job.title)}
              {renderRow("Company", job.companyName || job.company)}
              {renderRow("Category", job.category)}
              {renderRow("Work Mode", job.workMode)}
              {renderRow("Employment Type", job.employmentType)}
              {renderRow("Experience Level", job.experienceLevel)}
              {renderRow(
                "Location",
                [job.location?.city || job.city, job.location?.state || job.state, job.location?.zipCode || job.zipCode].filter(Boolean).join(", ") || job.address || "-"
              )}
              {renderRow(
                "Salary / Rate",
                job.rate || (job.salary?.max ? `$${job.salary.min?.toLocaleString() || 0} - $${job.salary.max?.toLocaleString()} a ${job.salary.period || "year"}` : "-")
              )}
              {renderRow("Job Description", job.jobDescription)}
              {renderRow(
                "Posted On",
                job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "-"
              )}
              {renderRow("Status", job.status)}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500">No job data available</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminJobDetailsModal;
