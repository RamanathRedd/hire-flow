import { useQuery } from "@tanstack/react-query";
import { getDepartments, getLocations } from "../api/referenceData";

export const useDepartments = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

export const useLocations = () =>
  useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });
