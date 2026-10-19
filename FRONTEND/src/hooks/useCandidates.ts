import { useMutation, useQuery } from "@tanstack/react-query";
import { getCandidateDetails, updateCandidateDetails } from "../api/candidates";
import type { CandidateUpdate } from "../types/candidate";

export const useGetCandidateDetails = () =>
  useQuery({
    queryKey: ["candidateDetails"],
    queryFn: getCandidateDetails,
  });

export const useUpdateRecruiterDetails = () =>
  useMutation({
    mutationFn: ({
      candidate_id,
      candidate_details,
    }: {
      candidate_id: number;
      candidate_details: CandidateUpdate;
    }) => updateCandidateDetails(candidate_id, candidate_details),
  });
