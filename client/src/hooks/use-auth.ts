import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signin, signup, verifySession, signout, verifyMagicLink } from "@/api/auth";
import { getToken, setGoogleOnboardingToken } from "@/lib/utils";
import { useNavigate } from "react-router";

export function useToken() {
  const [token, setTokenState] = useState(getToken);
  useEffect(() => {
    const handleTokenChange = () => {
      setTokenState(getToken());
    };
    window.addEventListener("auth-token-change", handleTokenChange);
    return () => {
      window.removeEventListener("auth-token-change", handleTokenChange);
    };
  }, []);
  return token;
}

export function useSignin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signin,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}
export function useSignup() {
  return useMutation({
    mutationFn: signup,
  });
}
export function useAuth() {
  const token = useToken();
  return useQuery({
    queryKey: ["auth", token],
    queryFn: verifySession,
    enabled: !!token,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "rate-limit") {
        return failureCount < 3;
      }
      if (error instanceof TypeError) {
        return failureCount < 2;
      }
      return false;
    },
    staleTime: 5 * 60 * 1000,
  });
}
export function useSignout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: signout,
    onSuccess: () => {
      const token = getToken();
      queryClient.setQueryData(["auth", token], undefined);
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
      localStorage.removeItem("turnsout_columns");
      navigate("/", { replace: true });
    },
  });
}


import { verifyEmail, requestPasswordReset, resetPassword, resendVerification, deleteAccount, sendOtp, verifyOtp } from "@/api/auth";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      const token = getToken();
      queryClient.setQueryData(["auth", token], undefined);
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
      navigate("/", { replace: true });
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (email: string) => sendOtp(email),
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyOtp(email, otp),
    onSuccess: (data) => {
      if (data.needsOnboarding) {
        setGoogleOnboardingToken(data.onboardingToken);
        navigate("/onboarding", { replace: true });
        return;
      }
      queryClient.refetchQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}

export function useVerifyMagicLink() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (token: string) => verifyMagicLink(token),
    onSuccess: (data) => {
      if (data.needsOnboarding) {
        setGoogleOnboardingToken(data.onboardingToken);
        navigate("/onboarding", { replace: true });
        return;
      }
      queryClient.refetchQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => resendVerification(email),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["auth"] });
    },
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
