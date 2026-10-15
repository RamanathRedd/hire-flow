import { useQuery } from "@tanstack/react-query";
import { getInterviewers } from "../api/recruiters";

export const useGetInterviewers = () =>
  useQuery({
    queryKey: ["interviewers"],
    queryFn: getInterviewers,
  });
