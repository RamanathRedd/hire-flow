export interface CandidateUpdate {
  name?: string;
  phone?: string;
  resume_url?: string;
  linkedin_url?: string | null;
  experience_years?: number;
  skills?: string[];
  current_title?: string;
  current_company?: string;
}
