import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signin, signup, verifySession, signout } from "@/api/auth";
import { getToken } from "@/lib/utils";
import { useNavigate } from "react-router";
export function useSignin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
export function useSignup() {
  return useMutation({
    mutationFn: signup,
  });
}
export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: verifySession,
    enabled: !!getToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
export function useSignout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: signout,
    onSuccess: () => {
      queryClient.setQueryData(["auth"], undefined);
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      navigate("/", { replace: true });
    },
  });
}


import { verifyEmail, requestPasswordReset, resetPassword, resendVerification, deleteAccount } from "@/api/auth";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.setQueryData(["auth"], undefined);
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      navigate("/", { replace: true });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => resendVerification(email),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: verifyEmail,
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: requestPasswordReset,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => resetPassword(token, newPassword),
  });
}
