import { useMutation, useQuery } from "@tanstack/react-query";
import {
  cancelInterview,
  getInterviews,
  getUpcomingInterviews,
  reScheduleInterview,
  scheduleInterview,
  submitInterviewFeedback,
} from "../api/interviews";
import type { interviewFeedback, InterviewFilters } from "../types/interview";

export const useScheduleInterview = () =>
  useMutation({
    mutationFn: (interview_details: any) =>
      scheduleInterview(interview_details),
  });

export const useGetInterviews = (
  interviewFilters: InterviewFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: [
      "interviews",
      interviewFilters.round_type ?? null,
      interviewFilters.status ?? null,
      interviewFilters.job_id ?? null,
    ],
    queryFn: () => getInterviews(interviewFilters),
    enabled,
  });

export const useUpcomingInterviews = (
  interviewFilters: InterviewFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: [
      "upcomingInterviews",
      interviewFilters.round_type ?? null,
      interviewFilters.status ?? null,
      interviewFilters.job_id ?? null,
    ],
    queryFn: () => getUpcomingInterviews(interviewFilters),
    enabled,
  });

export const useReScheduleInterview = () =>
  useMutation({
    mutationFn: ({
      interview_id,
      interview_details,
    }: {
      interview_id: number;
      interview_details: { interviewer_id: number; scheduled_at: string };
    }) =>
      reScheduleInterview(interview_id, interview_details),
  });

export const useCancelInterview = () =>
  useMutation({
    mutationFn: ({
      interview_id,
      cancellation_data,
    }: {
      interview_id: number;
      cancellation_data: string | null;
    }) => cancelInterview(interview_id, cancellation_data),
  });

export const useSubmitInterviewFeedback = () =>
  useMutation({
    mutationFn: ({
      interview_id,
      submit_feedback,
    }: {
      interview_id: number;
      submit_feedback: interviewFeedback;
    }) => submitInterviewFeedback(interview_id, submit_feedback),
  });
