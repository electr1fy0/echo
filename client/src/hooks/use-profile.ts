import { fetchProfile, updateProfile, fetchPublicProfile } from "@/api/profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
export function useFetchProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    staleTime: 2 * 60 * 1000,
  });
}
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: User) => updateProfile(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useFetchPublicProfile(username?: string) {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchPublicProfile(username!),
    enabled: !!username,
    staleTime: 2 * 60 * 1000,
  });
}
