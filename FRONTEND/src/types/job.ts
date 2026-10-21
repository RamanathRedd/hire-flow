export interface JobFilter {
  department: string | null;
  status: string | null;
  location: string | null;
}

export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  status: string;
  applicant_count: number;
  openings_count: number;
  filled_count: number;
  job_type: string;
  description: string;
  requirements: string;
}

export interface JobCreate {
  title: string;
  department: string;
  location: string;
  job_type: string;
  description: string;
  status: string;
  openings_count: number;
  requirements: string;
}

export interface JobUpdate {
  location: string | null;
  job_type: string | null;
  openings_count: number | null;
  description: string | null;
  requirements: string | null;
}

export interface JobApplicationFilters {
  this_week: boolean;
  needs_attention: boolean;
  interview_round: boolean;
  offer_stage: boolean;
  stage_filter: string | null;
  date_applied_filter: number | null;
}
