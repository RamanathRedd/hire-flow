import { useMutation, useQuery } from "@tanstack/react-query";
import {
  cancelInterview,
  getInterviews,
  getUpcomingInterviews,
  reScheduleInterview,
  scheduleInterview,
  submitInterviewFeedback,
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

export const useReScheduleInterview = () =>
  useMutation({
    mutationFn: (interview_id: number, interview_details: any) =>
      reScheduleInterview(interview_id, interview_details),
  });

export const useCancelInterview = () =>
  useMutation({
    mutationFn: (interview_id: number, cancellation_data: any) =>
      cancelInterview(interview_id, cancellation_data),
  });

export const useSubmitInterviewFeedback = () =>
  useMutation({
    mutationFn: (interview_id: number, submit_feedback: any) =>
      submitInterviewFeedback(interview_id, submit_feedback),
  });
