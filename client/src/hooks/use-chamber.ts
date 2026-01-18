import {
  createChamber,
  listChambers,
  joinChamber,
  leaveChamber,
} from "@/api/chambers";
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
    onMutate: async (uid) => {
      await queryClient.cancelQueries({ queryKey: ["chambers"] });
      const chambersCache = queryClient.getQueryCache();
      const matchingQueries = chambersCache.findAll({
        predicate: (query) => query.queryKey[0] === "chambers",
      });

      const previousData = matchingQueries.map((query) => ({
        queryKey: query.queryKey,
        data: query.state.data as Chamber[] | undefined,
      }));

      matchingQueries.forEach((query) => {
        const data = query.state.data as Chamber[] | undefined;
        if (!data) return;
        const updated = data.map((chamber) =>
          chamber.uid === uid
            ? {
              ...chamber,
              isJoined: true,
              memberCount: (chamber.memberCount || 0) + 1,
            }
            : chamber
        );
        queryClient.setQueryData(query.queryKey, updated);
      });

      return { previousData };
    },
    onError: (_err, _uid, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}

export function useLeaveChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => leaveChamber(uid),
    onMutate: async (uid) => {
      await queryClient.cancelQueries({ queryKey: ["chambers"] });
      const chambersCache = queryClient.getQueryCache();
      const matchingQueries = chambersCache.findAll({
        predicate: (query) => query.queryKey[0] === "chambers",
      });

      const previousData = matchingQueries.map((query) => ({
        queryKey: query.queryKey,
        data: query.state.data as Chamber[] | undefined,
      }));

      matchingQueries.forEach((query) => {
        const data = query.state.data as Chamber[] | undefined;
        if (!data) return;
        const updated = data.map((chamber) =>
          chamber.uid === uid
            ? {
              ...chamber,
              isJoined: false,
              memberCount: Math.max(0, (chamber.memberCount || 1) - 1),
            }
            : chamber
        );
        queryClient.setQueryData(query.queryKey, updated);
      });

      return { previousData };
    },
    onError: (_err, _uid, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}
