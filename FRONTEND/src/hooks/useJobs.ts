import { useMutation, useQuery } from "@tanstack/react-query";
import type { JobCreate, JobFilter } from "../types/job";
import { createJob, deleteJob, getJobs } from "../api/jobs";

export const useCreateJob = () =>
  useMutation({
    mutationFn: (jobDetails: JobCreate) => createJob(jobDetails),
  });

export const useGetJobs = (jobFilters: JobFilter) =>
  useQuery({
    queryKey: ["jobs"],
    queryFn: () => getJobs(jobFilters),
  });

export const useDeleteJob = () =>
  useMutation({
    mutationFn: (job_id: number) => deleteJob(job_id),
  });
