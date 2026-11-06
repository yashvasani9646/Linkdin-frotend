const STORAGE_KEY = 'docduty_jobs';
const SAVED_JOBS_KEY = 'docduty_saved_jobs';
const APPLIED_JOBS_KEY = 'docduty_applied_jobs';

const LEGACY_STORAGE_KEY = 'indeed_jobs';
const LEGACY_SAVED_JOBS_KEY = 'indeed_saved_jobs';
const LEGACY_APPLIED_JOBS_KEY = 'indeed_applied_jobs';

// Custom event names
export const JOB_POSTED_EVENT = 'job-posted';
export const STORAGE_UPDATE_EVENT = 'storage-update';

// Helpers to dispatch events
const dispatchStorageUpdate = () => {
  window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
};

const dispatchJobPosted = (job) => {
  window.dispatchEvent(new CustomEvent(JOB_POSTED_EVENT, { detail: job }));
};

// --- Posted Jobs ---

export const getJobs = () => {
  try {
    const jobs = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return jobs ? JSON.parse(jobs) : [];
  } catch {
    return [];
  }
};

export const addJob = (jobData) => {
  try {
    const currentJobs = getJobs();
    const newJob = {
      ...jobData,
      id: Date.now(),
      title: jobData.jobTitle || jobData.companyName || 'Job Position',
      type: 'Full Time',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active',
      applications: 0,
      daysAgo: new Date().toISOString()
    };
    
    const updatedJobs = [newJob, ...currentJobs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
    
    dispatchJobPosted(newJob);
    return newJob;
  } catch {
    return null;
  }
};

// --- Saved Jobs ---

export const getSavedJobs = () => {
  try {
    const jobs = localStorage.getItem(SAVED_JOBS_KEY) || localStorage.getItem(LEGACY_SAVED_JOBS_KEY);
    return jobs ? JSON.parse(jobs) : [];
  } catch {
    return [];
  }
};

export const saveJob = (job) => {
  try {
    const savedJobs = getSavedJobs();
    // Toggle save status
    const exists = savedJobs.find(j => j.id === job.id);
    let newSavedJobs;
    
    if (exists) {
      newSavedJobs = savedJobs.filter(j => j.id !== job.id);
    } else {
      newSavedJobs = [...savedJobs, job];
    }
    
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(newSavedJobs));
    dispatchStorageUpdate();
    return !exists; // Returns true if saved, false if unsaved
  } catch {
    return false;
  }
};

export const isJobSaved = (jobId) => {
  const savedJobs = getSavedJobs();
  return savedJobs.some(j => j.id === jobId);
};

// --- Applied Jobs ---

export const getAppliedJobs = () => {
  try {
    const jobs = localStorage.getItem(APPLIED_JOBS_KEY) || localStorage.getItem(LEGACY_APPLIED_JOBS_KEY);
    return jobs ? JSON.parse(jobs) : [];
  } catch {
    return [];
  }
};

export const applyToJob = (job, applicationData) => {
  try {
    const appliedJobs = getAppliedJobs();
    if (appliedJobs.some(j => j.jobId === job.id)) return false; // Already applied

    const newApplication = {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      appliedDate: new Date().toISOString(),
      status: 'Pending',
      ...applicationData
    };
    
    const newAppliedJobs = [...appliedJobs, newApplication];
    localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(newAppliedJobs));
    dispatchStorageUpdate();
    return true;
  } catch {
    return false;
  }
};

export const isJobApplied = (jobId) => {
  const appliedJobs = getAppliedJobs();
  return appliedJobs.some(j => j.jobId === jobId);
};

// --- Utils ---

export const clearJobs = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SAVED_JOBS_KEY);
    localStorage.removeItem(APPLIED_JOBS_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SAVED_JOBS_KEY);
    localStorage.removeItem(LEGACY_APPLIED_JOBS_KEY);
    dispatchJobPosted(null);
    dispatchStorageUpdate();
};
