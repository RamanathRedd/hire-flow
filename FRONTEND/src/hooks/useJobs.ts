import { useMutation, useQuery } from "@tanstack/react-query";
import type { JobCreate, JobFilter, JobUpdate } from "../types/job";
import {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  updateJobStatus,
} from "../api/jobs";

export const useCreateJob = () =>
  useMutation({
    mutationFn: (jobDetails: JobCreate) => createJob(jobDetails),
  });

export const useGetJobs = (jobFilters: JobFilter) =>
  useQuery({
    queryKey: [
      "jobs",
      jobFilters.department ?? null,
      jobFilters.status ?? null,
      jobFilters.location ?? null,
    ],
    queryFn: () => getJobs(jobFilters),
  });

export const useDeleteJob = () =>
  useMutation({
    mutationFn: (job_id: number) => deleteJob(job_id),
  });

export const useUpdateJob = () =>
  useMutation({
    mutationFn: ({
      job_id,
      jobUpdateDetails,
    }: {
      job_id: number;
      jobUpdateDetails: JobUpdate;
    }) => updateJob(job_id, jobUpdateDetails),
  });

export const useUpdateJobStatus = () =>
  useMutation({
    mutationFn: ({ job_id, status }: { job_id: number; status: string }) =>
      updateJobStatus(job_id, status),
  });
