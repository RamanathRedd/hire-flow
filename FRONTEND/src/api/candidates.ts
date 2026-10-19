import axios from "axios";
import type { CandidateUpdate } from "../types/candidate";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getCandidateDetails = async () => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/candidates/candidate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {}
};

export const updateCandidateDetails = async (
  candidate_id: number,
  candidate_details: CandidateUpdate,
) => {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token found in sessionStorage");
  }

  try {
    const response = await axios.patch(
      `${API_BASE_URL}/candidates/${candidate_id}`,
      candidate_details,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {}
};
