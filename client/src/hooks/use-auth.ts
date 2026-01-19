import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signin, signup, verifySession, signout } from "@/api/auth";
export function useSignin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
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
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}
export function useSignout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}


import { verifyEmail, requestPasswordReset, resetPassword, resendVerification, deleteAccount } from "@/api/auth";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: resendVerification,
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
