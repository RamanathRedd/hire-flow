export interface InterviewFilters {
  round_type: string | null;
  status: string | null;
  job_id: number | null;
}

export interface interviewFeedback {
  feedback: string;
  rating: number;
}
