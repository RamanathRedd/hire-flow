import axios from "axios";
import type {
  JobApplicationFilters,
  JobCreate,
  JobFilter,
  JobUpdate,
} from "../types/job";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const createJob = async (jobDetails: JobCreate) => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.post(`${API_BASE_URL}/jobs`, jobDetails, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const getJobs = async (jobFilters: JobFilter) => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  const response = await axios.get(`${API_BASE_URL}/jobs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      department: jobFilters.department || null,
      status: jobFilters.status || null,
      location: jobFilters.location || null,
    },
  });

  return response.data;
};

export const deleteJob = async (job_id: number) => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.delete(`${API_BASE_URL}/jobs/${job_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const updateJob = async (
  job_id: number,
  jodUpdateDetails: JobUpdate,
) => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.patch(
      `${API_BASE_URL}/jobs/${job_id}`,
      jodUpdateDetails,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const updateJobStatus = async (job_id: number, status: string) => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.patch(
      `${API_BASE_URL}/jobs/${job_id}/status`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { new_status: status },
      },
    );
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const getJobApplications = async (
  job_id: number,
  application_filters: JobApplicationFilters,
) => {
  if (!job_id) return;
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.get(
      `${API_BASE_URL}/jobs/${job_id}/applications/filters`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: application_filters,
      },
    );
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};
