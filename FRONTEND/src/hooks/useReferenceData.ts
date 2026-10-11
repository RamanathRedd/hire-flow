import { useQuery } from "@tanstack/react-query";
import { getDepartments, getStatus } from "../api/referenceData";

export const useDepartments = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

export const useStatus = () =>
  useQuery({
    queryKey: ["status"],
    queryFn: getStatus,
  });
