export interface InterviewFilters {
  round_types: string[] | null;
  statuses: string[] | null;
  job_id: number | null;
}

export interface interviewFeedback {
  feedback: string;
  rating: number;
}
