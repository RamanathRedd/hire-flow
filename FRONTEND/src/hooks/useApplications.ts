import { useMutation, useQuery } from "@tanstack/react-query";
import { applyJob, getLiveApplications } from "../api/applications";

export const useApplyJob = () =>
  useMutation({
    mutationFn: (job_id: number) => applyJob(job_id),
  });

export const useLiveApplications = () =>
  useQuery({
    queryKey: ["live_applications"],
    queryFn: getLiveApplications,
  });
