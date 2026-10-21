import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  JobApplicationFilters,
  JobCreate,
  JobFilter,
  JobUpdate,
} from "../types/job";
import {
  createJob,
  deleteJob,
  getJobApplications,
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

export const useGetJobApplications = (
  job_id: number | null,
  application_filters: JobApplicationFilters,
) =>
  useQuery({
    queryKey: ["jobApplications", job_id, application_filters],
    queryFn: () => {
      if (job_id === null) {
        throw new Error("A job must be selected to load applications.");
      }

      return getJobApplications(job_id, application_filters);
    },
    enabled: job_id !== null,
  });
