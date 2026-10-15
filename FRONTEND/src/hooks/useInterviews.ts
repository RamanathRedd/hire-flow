import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getInterviews,
  getUpcomingInterviews,
  scheduleInterview,
} from "../api/interviews";
import type { InterviewFilters } from "../types/interview";

export const useScheduleInterview = () =>
  useMutation({
    mutationFn: (interview_details: any) =>
      scheduleInterview(interview_details),
  });

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
