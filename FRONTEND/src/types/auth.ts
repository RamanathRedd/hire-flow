export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: "Admin" | "User";
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  phone: string;
  department?: string;
  resume_url?: string;
  linkedin_url?: string;
  experience_years?: number;
  current_title?: string;
  current_company?: string;
  skills?: string[];
}
