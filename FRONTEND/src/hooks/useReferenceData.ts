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

export const formatDateDayMonth = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export const formatDateDayMonthTime = (scheduledAt: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(scheduledAt));
