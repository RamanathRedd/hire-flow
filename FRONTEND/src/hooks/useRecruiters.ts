import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getInterviewers,
  getRecruiterDetails,
  updateRecruiterDetails,
} from "../api/recruiters";
import type { RecruiterUpdate } from "../types/recruiter";

export const useGetInterviewers = () =>
  useQuery({
    queryKey: ["interviewers"],
    queryFn: getInterviewers,
  });

export const useGetRecruiterDetails = () =>
  useQuery({
    queryKey: ["recruiterDetails"],
    queryFn: getRecruiterDetails,
  });

export const useUpdateRecruiterDetails = () =>
  useMutation({
    mutationFn: ({
      recruiter_id,
      recruiter_details,
    }: {
      recruiter_id: number;
      recruiter_details: RecruiterUpdate;
    }) => updateRecruiterDetails(recruiter_id, recruiter_details),
  });
