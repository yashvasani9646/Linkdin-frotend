import React, { useState, useEffect } from "react";
import { Eye } from "../../icons/Eye";
import { Pencil } from "../../icons/Pencil";
import { XCircleGray } from "../../icons/XCircleGray";
import AdminCreateJobModal from "../../components/AdminCreateJobModal";
import AdminJobDetailsModal from "../../components/AdminJobDetailsModal";
import api from "../../services/api";
import { API_CONFIG } from "../../config/api.config";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../utils/errorHandler";

const AdminJobsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeRowId, setActiveRowId] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [draftJobData, setDraftJobData] = useState(null);

  // Fetch jobs from API
  const fetchJobs = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await api.get(API_CONFIG.ENDPOINTS.ADMIN.JOBS, {
        params: { page, limit: 10 },
      });
      if (response?.data?.data) {
        setJobs(response.data.data.jobs || []);
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      toast.error(getErrorMessage(error, "Failed to load jobs"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(currentPage);
  }, [currentPage]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-dropdown-container")) {
        setActiveRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleAction = (id) => {
    setActiveRowId(activeRowId === id ? null : id);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedJobs(jobs.map((j) => j.id || j._id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (id) => {
    if (selectedJobs.includes(id)) {
      setSelectedJobs(selectedJobs.filter((jid) => jid !== id));
    } else {
      setSelectedJobs([...selectedJobs, id]);
    }
  };

  // Delete job handler
  const handleDeleteJob = async (job) => {
    const jobId = job.id || job._id;

    try {
      const response = await api.delete(
        `${API_CONFIG.ENDPOINTS.ADMIN.JOBS}/${jobId}`
      );

      if (response?.data?.success) {
        toast.success("Job deleted successfully!");
        fetchJobs(currentPage);
        setActiveRowId(null);
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      toast.error(getErrorMessage(error, "Failed to delete job"));
    }
  };

  // Toggle job status handler (Active <-> Closed)
  const handleToggleStatus = async (job) => {
    const jobId = job.id || job._id;
    const newStatus = job.status === "Active" ? "Closed" : "Active";

    try {
      const response = await api.patch(
        `${API_CONFIG.ENDPOINTS.ADMIN.JOB_STATUS}/${jobId}/status`,
        { status: newStatus }
      );

      if (response?.data?.success) {
        toast.success(`Job status updated to ${newStatus} successfully!`);
        fetchJobs(currentPage);
        setActiveRowId(null);
      }
    } catch (error) {
      console.error("Failed to update job status:", error);
      toast.error(
        getErrorMessage(error, "Failed to update job status")
      );
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-10 h-10 flex items-center cursor-pointer justify-center rounded-full text-sm font-medium transition ${
            currentPage === i
              ? "bg-brand-action text-white"
              : "bg-white text-ink-muted hover:bg-gray-50"
          }`}
        >
          {i.toString().padStart(2, "0")}
        </button>
      );
    }
    return pages;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1 text-sm leading-5 -tracking-[1%] font-medium text-success">
            <img src="/CheckCircleStatus.svg" alt="" />
            Active
          </span>
        );
      case "Inactive":
        return (
          <span className="inline-flex items-center gap-1 text-sm leading-5 -tracking-[1%] font-medium text-danger">
            <img src="/Backspace.svg" className="w-5 h-5" alt="" />
            <span className="text-danger">Inactive</span>
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center gap-1 text-sm leading-5 -tracking-[1%] font-medium text-warning">
            <img
              src="/Backspace.svg"
              className="w-5 h-5 text-warning"
              alt=""
            />
            <span className="text-warning">Closed</span>
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 text-sm leading-5 -tracking-[1%] font-medium text-danger">
            <img src="/Backspace.svg" className="w-5 h-5" alt="" />
            <span className="text-danger">Expired</span>
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-sm leading-5 -tracking-[2%] font-medium text-secondary">
            Draft
          </span>
        );
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Job management</h1>
          <p className="page-subtitle">
            Create, review, update, and delete all job posts across the platform.
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-3 md:w-auto">
          <button className="btn btn-secondary">
            Export CSV
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            + Create job post
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[1000px]">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%] w-[20px]"
                >
                  <input
                    type="checkbox"
                    className="w-4 align-middle h-4 cursor-pointer rounded border border-brand-action text-brand-action focus:ring-brand-action"
                    onChange={handleSelectAll}
                    checked={
                      jobs.length > 0 && selectedJobs.length === jobs.length
                    }
                  />
                </th>
                <th
                  scope="col"
                  className="pr-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Job Title
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Employer
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Posted On
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Applicants
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%]"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 font-normal text-xs leading-[18px] uppercase -tracking-[1%] text-right"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Loading jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job, index) => (
                  <tr
                    key={job.id || job._id}
                    className="transition-colors hover:bg-brand-tint/20"
                  >
                    <td className="px-5 py-[18px]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 align-middle cursor-pointer rounded border border-brand-action text-brand-action focus:ring-brand-action"
                        checked={selectedJobs.includes(job.id || job._id)}
                        onChange={() => handleSelectJob(job.id || job._id)}
                      />
                    </td>
                    <td className="pr-5 py-[18px] text-base leading-6 -tracking-[2%] font-medium text-secondary whitespace-nowrap">
                      {job.jobTitle || job.title || job.companyName || "-"}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {job.createdBy?.fullName || job.employer || "-"}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {job.location?.city || job.location?.state
                        ? [job.location.city, job.location.state]
                            .filter(Boolean)
                            .join(", ")
                        : job.city && job.state
                          ? `${job.city}, ${job.state}`
                          : "-"}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {formatDate(job.createdAt) || job.postedOn || "-"}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {job.applicationCount ?? job.applicants ?? 0}
                    </td>
                    <td className="px-5 py-[18px] text-sm leading-5 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-5 py-[18px] leading-6 -tracking-[2%] font-normal text-ink-muted whitespace-nowrap text-right relative group action-dropdown-container">
                      <button
                        className={`hover:text-gray-600 cursor-pointer ${
                          activeRowId === (job.id || job._id)
                            ? "text-gray-600"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleToggleAction(job.id || job._id)}
                      >
                        <img
                          src="/DotsThreeVertical.svg"
                          className="w-6 h-6 opacity-60"
                          alt=""
                        />
                      </button>
                      {activeRowId === (job.id || job._id) && (
                        <div
                          className={`absolute right-5 w-[216px] bg-white rounded-lg shadow-xl border border-gray-100 z-20 text-left py-3 ${
                            index >= jobs.length - 2
                              ? "bottom-12"
                              : "top-2 mt-8"
                          }`}
                        >
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setIsDetailsModalOpen(true);
                              setActiveRowId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint cursor-pointer flex items-center gap-2"
                          >
                            <Eye />
                            View Job
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setIsEditModalOpen(true);
                              setActiveRowId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-brand-action hover:bg-brand-tint cursor-pointer flex items-center gap-2"
                          >
                            <Pencil />
                            Edit Job
                          </button>
                          <button
                            onClick={() => handleToggleStatus(job)}
                            className={`w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] cursor-pointer flex items-center gap-2 group/status ${
                              job.status === "Active"
                                ? "text-ink-muted hover:text-warning hover:bg-orange-50"
                                : "text-ink-muted hover:text-success hover:bg-green-50"
                            }`}
                          >
                            {/* <img
                              src={
                                job.status === "Active"
                                  ? "/Backspace.svg"
                                  : "/CheckCircleStatus.svg"
                              }
                              className="w-5 h-5"
                              alt=""
                            /> */}
                            <Pencil />
                            {job.status === "Active"
                              ? "Mark Closed"
                              : "Mark Active"}
                          </button>
                          <button
                            onClick={() => {
                              const jobId = job.id || job._id;
                              api
                                .patch(
                                  `${API_CONFIG.ENDPOINTS.ADMIN.JOB_STATUS}/${jobId}/status`,
                                  { status: "Expired" }
                                )
                                .then((response) => {
                                  if (response?.data?.success) {
                                    toast.success(
                                      "Job marked as Expired successfully!"
                                    );
                                    fetchJobs(currentPage);
                                    setActiveRowId(null);
                                  }
                                })
                                .catch((error) => {
                                  console.error(
                                    "Failed to mark job as expired:",
                                    error
                                  );
                                  toast.error(
                                    getErrorMessage(
                                      error,
                                      "Failed to mark job as expired"
                                    )
                                  );
                                });
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-danger hover:bg-red-50 cursor-pointer flex items-center gap-2 group/expired"
                          >
                            <Pencil />
                            Mark Expired
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="w-full text-left px-4 py-2.5 text-xs leading-5 font-normal -tracking-[2%] text-ink-muted hover:text-danger hover:bg-red-50 cursor-pointer flex items-center gap-2"
                          >
                            <XCircleGray />
                            Delete Job
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-10">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-brand-tint transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <img
            src="/arrow-right.svg"
            className="rotate-180"
            alt="Previous"
          />
        </button>
        {renderPagination()}
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-brand-tint cursor-pointer transition disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <img src="/arrow-right.svg" alt="Next" />
        </button>
      </div>
      {/* Modals */}
      <AdminCreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialData={draftJobData}
        onJobCreated={() => fetchJobs(currentPage)}
        onSaveDraft={(data) => setDraftJobData(data)}
        onPublish={() => {
          // console.log("Published Job:", data);
          setDraftJobData(null); // Clear draft after publish
        }}
      />

      <AdminCreateJobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        isEdit={true}
        jobId={selectedJob?.id || selectedJob?._id}
        initialData={selectedJob}
        onJobCreated={() => fetchJobs(currentPage)}
        onSaveDraft={() => {
          // console.log("Saved Draft for Edit", data);
        }}
        onPublish={() => {
          // console.log("Updated Job:", data);
        }}
      />

      <AdminJobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        jobId={selectedJob?.id || selectedJob?._id}
      />
    </div>
  );
};

export default AdminJobsPage;
