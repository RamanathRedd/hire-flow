import { useMutation, useQuery } from "@tanstack/react-query";
import {
  applyJob,
  getApplicationCounts,
  getCandidateApplications,
  getLiveApplications,
  rejectApplication,
  updateApplicationStage,
} from "../api/applications";

export const useApplyJob = () =>
  useMutation({
    mutationFn: (job_id: number) => applyJob(job_id),
  });

export const useLiveApplications = () =>
  useQuery({
    queryKey: ["live_applications"],
    queryFn: getLiveApplications,
  });

export const useApplicationCounts = () =>
  useQuery({
    queryKey: ["application_counts"],
    queryFn: getApplicationCounts,
  });

export const useCandidateApplications = (status: string | null) =>
  useQuery({
    queryKey: ["applications", status ?? null],
    queryFn: () => getCandidateApplications(status),
  });

export const useRejectApplication = () =>
  useMutation({
    mutationFn: ({
      applicationId,
      rejection_reason,
    }: {
      applicationId: number;
      rejection_reason: string;
    }) => rejectApplication(applicationId, rejection_reason),
  });

export const useUpdateApplicationStage = () =>
  useMutation({
    mutationFn: ({
      applicationId,
      stage,
    }: {
      applicationId: number;
      stage: string;
    }) => updateApplicationStage(applicationId, stage),
  });
