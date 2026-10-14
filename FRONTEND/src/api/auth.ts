import axios from "axios";
import type { LoginResponse, RegisterCredentials } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Sign in failed. Please try again.";
  }

  if (!error.response) {
    return "Unable to connect to the server. Check that the backend is running and try again.";
  }

  const data: unknown = error.response.data;
  if (typeof data === "object" && data !== null) {
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    if ("message" in data && typeof data.message === "string")
      return data.message;
    if ("error" in data && typeof data.error === "string") return data.error;
  }

  return "Sign in failed. Please try again.";
};

export const login = async (
  email: string,
  password: string,
  isAdmin: boolean,
): Promise<LoginResponse> => {
  const query = new URLSearchParams({ isAdmin: String(isAdmin) });
  const body = new URLSearchParams({ username: email, password });

  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login?${query}`,
      body,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const register = async (credentails: RegisterCredentials) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      isAdmin,
      department,
      resume_url,
      linkedin_url,
      experience_years,
      skills,
      current_title,
      current_company,
    } = credentails;
    const query = new URLSearchParams({ isAdmin: String(isAdmin) });
    const body = isAdmin
      ? {
          name,
          email,
          phone,
          department,
          password,
        }
      : {
          name,
          password,
          email,
          phone,
          resume_url,
          linkedin_url: linkedin_url || null,
          experience_years,
          skills,
          current_title,
          current_company,
        };
    const response = await axios.post(
      `${API_BASE_URL}/auth/register?${query}`,
      body,
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
