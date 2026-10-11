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
