import { useMutation } from "@tanstack/react-query";
import { applyJob } from "../api/applications";

export const useApplyJob = () =>
  useMutation({
    mutationFn: (job_id: number) => applyJob(job_id),
  });
