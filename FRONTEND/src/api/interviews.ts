import axios from "axios";
import type { InterviewFilters } from "../types/interview";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const scheduleInterview = async (interview_details: any) => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/interviews`,
      interview_details,
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

export const getInterviews = async (interviewFilter: InterviewFilters) => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/interviews`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: interviewFilter,
    });
    return response.data;
  } catch (error) {
    // throw new Error(getErrorMessage(error));
  }
};

export const getUpcomingInterviews = async (
  interviewFilters: InterviewFilters,
) => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/interviews/upcoming`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: interviewFilters,
    });

    return response.data.interviews;
  } catch (error) {}
};
