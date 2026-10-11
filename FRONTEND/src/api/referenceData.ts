import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getDepartments = async (): Promise<
  { id: number; name: string }[]
> => {
  const response = await axios.get<{ id: number; name: string }[]>(
    `${API_BASE_URL}/reference_data/departments`,
  );
  return response.data;
};

export const getLocations = async (): Promise<
  { id: number; name: string }[]
> => {
  const response = await axios.get<{ id: number; name: string }[]>(
    `${API_BASE_URL}/reference_data/locations`,
  );
  return response.data;
};
