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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: verifySession,
    retry: false,
  });
}

export function useSignout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}
