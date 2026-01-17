import { fetchProfile, updateProfile } from "@/api/profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
export function useFetchProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });
}
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: User) => updateProfile(user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
