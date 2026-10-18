import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getInterviewers = async () => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/recruiters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const getRecruiterDetails = async () => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/recruiters/recruiter`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {}
};
