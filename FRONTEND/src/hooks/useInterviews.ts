import { useQuery } from "@tanstack/react-query";
import { getInterviews, getUpcomingInterviews } from "../api/interviews";
import type { InterviewFilters } from "../types/interview";

export const useGetInterviews = (interviewFilters: InterviewFilters) =>
  useQuery({
    queryKey: [
      "interviews",
      interviewFilters.round_type ?? null,
      interviewFilters.status ?? null,
      interviewFilters.job_id ?? null,
    ],
    queryFn: () => getInterviews(interviewFilters),
  });

export const useUpcomingInterviews = (interviewFilters: InterviewFilters) =>
  useQuery({
    queryKey: [
      "upcomingInterviews",
      interviewFilters.round_type ?? null,
      interviewFilters.status ?? null,
      interviewFilters.job_id ?? null,
    ],
    queryFn: () => getUpcomingInterviews(interviewFilters),
  });
