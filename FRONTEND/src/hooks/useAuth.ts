import { useMutation } from "@tanstack/react-query";
import { login, register } from "../api/auth";
import type { LoginCredentials, RegisterCredentials } from "../types/auth";

export const useLogin = () =>
  useMutation({
    mutationFn: ({ email, password, isAdmin }: LoginCredentials) =>
      login(email, password, isAdmin),
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (credentails: RegisterCredentials) => register(credentails),
  });
