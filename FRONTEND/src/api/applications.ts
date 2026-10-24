import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const applyJob = async (job_id: number) => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.post(
      `${API_BASE_URL}/applications`,
      { job_id },
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

export const getLiveApplications = async () => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.get(`${API_BASE_URL}/applications/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const getCandidateApplications = async (status: string | null) => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.get(`${API_BASE_URL}/applications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { status },
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const getApplicationCounts = async () => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await axios.get(`${API_BASE_URL}/applications/counts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};
