import { createChamber, listChambers, joinChamber, leaveChamber } from "@/api/chambers";
import type { Chamber } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useCreateChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chamber: Chamber) => createChamber(chamber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chambers"] }),
  });
}
export function useListChambers(query?: string) {
  return useQuery({
    queryFn: () => listChambers(query),
    queryKey: ["chambers", query],
  });
}
export function useJoinChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => joinChamber(uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chambers"] }),
  });
}
export function useLeaveChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => leaveChamber(uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chambers"] }),
  });
}
