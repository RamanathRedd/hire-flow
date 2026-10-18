import { useQuery } from "@tanstack/react-query";
import { getInterviewers, getRecruiterDetails } from "../api/recruiters";

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
