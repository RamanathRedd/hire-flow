import { useMutation } from "@tanstack/react-query";
import { login, register } from "../api/auth";
import type { LoginCredentials, RegisterCredentials } from "../types/auth";

export const useLogin = () =>
  useMutation({
    mutationFn: ({ email, password, isAdmin }: LoginCredentials) =>
      login(email, password, isAdmin),
    meta: { errorHandled: true },
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (credentails: RegisterCredentials) => register(credentails),
    meta: { errorHandled: true },
  });
