import { useQuery } from "@tanstack/react-query";
import { getDepartments } from "../api/referenceData";

export const useDepartments = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });
