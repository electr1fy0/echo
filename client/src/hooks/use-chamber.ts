import {
  createChamber,
  fetchChamber,
  listChambers,
  joinChamber,
  leaveChamber,
  updateChamber,
  deleteChamber,
  listChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  listAllChannels,
} from "@/api/chambers";
import type { Chamber } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToken } from "./use-auth";

export function useCreateChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chamber: Chamber) => createChamber(chamber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chambers"] }),
  });
}

export function useListChambers(query?: string) {
  const token = useToken();
  return useQuery({
    queryFn: () => listChambers(query),
    queryKey: ["chambers", token, query],
    staleTime: 2 * 60 * 1000,
  });
}

export function useChamber(identifier: string | undefined) {
  return useQuery({
    queryFn: () => fetchChamber(identifier!),
    queryKey: ["chamber", identifier],
    enabled: !!identifier,
    staleTime: 2 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ["questions"] });
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
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useUpdateChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, chamber }: { uid: string; chamber: Chamber }) =>
      updateChamber(uid, chamber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}

export function useDeleteChamber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteChamber(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
    },
  });
}

export function useListChannels(chamberUid: string) {
  return useQuery({
    queryFn: () => listChannels(chamberUid),
    queryKey: ["channels", chamberUid],
    enabled: !!chamberUid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateChannel(chamberUid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channel: { name: string; icon?: string; schema?: any[] }) =>
      createChannel(chamberUid, channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", chamberUid] });
    },
  });
}

export function useUpdateChannel(chamberUid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelUid, channel }: { channelUid: string; channel: { name?: string; icon?: string; schema?: any[] } }) =>
      updateChannel(chamberUid, channelUid, channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", chamberUid] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteChannel(chamberUid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelUid: string) => deleteChannel(chamberUid, channelUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", chamberUid] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useListAllChannels(joinedOnly?: boolean) {
  const token = useToken();
  return useQuery({
    queryFn: () => listAllChannels(joinedOnly),
    queryKey: ["all-channels", token, joinedOnly],
    staleTime: 5 * 60 * 1000,
  });
}
