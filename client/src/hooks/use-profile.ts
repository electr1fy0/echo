import { fetchProfile, updateProfile, fetchPublicProfile, followUser, unfollowUser } from "@/api/profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import { useToken } from "./use-auth";

export function useFetchProfile() {
  const token = useToken();
  return useQuery({
    queryKey: ["profile", token],
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

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => followUser(username),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => unfollowUser(username),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
  });
}
