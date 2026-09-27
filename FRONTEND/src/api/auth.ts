export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: "Admin" | "User";
  expires_in: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const login = async (
  email: string,
  password: string,
  isAdmin: boolean,
): Promise<LoginResponse> => {
  const query = new URLSearchParams({ isAdmin: String(isAdmin) });
  const response = await fetch(`${API_BASE_URL}/auth/login?${query}`, {
    method: "POST",
    body: new URLSearchParams({ username: email, password }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    let errorMessage = "Sign in failed. Please try again.";

    // Expanded type guards to check for 'detail', 'message', or 'error' keys from backend
    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof data.detail === "string")
        errorMessage = data.detail;
      else if ("message" in data && typeof data.message === "string")
        errorMessage = data.message;
      else if ("error" in data && typeof data.error === "string")
        errorMessage = data.error;
    }

    throw new Error(errorMessage);
  }

  return data as LoginResponse;
};
