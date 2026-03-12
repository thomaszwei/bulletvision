import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/api/sessions";
import type { Session } from "@/types";

export function useSessions() {
  return useQuery({ queryKey: ["sessions"], queryFn: sessionsApi.list });
}

export function useSession(id: number | null) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.get(id!),
    enabled: id !== null,
    refetchInterval: 5_000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useSessionActions(sessionId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["session", sessionId] });
    qc.invalidateQueries({ queryKey: ["sessions"] });
  };

  const start = useMutation({ mutationFn: () => sessionsApi.start(sessionId), onSuccess: invalidate });
  const baseline = useMutation({ mutationFn: () => sessionsApi.captureBaseline(sessionId), onSuccess: invalidate });
  const resetBaseline = useMutation({ mutationFn: () => sessionsApi.resetBaseline(sessionId), onSuccess: invalidate });
  const end = useMutation({ mutationFn: () => sessionsApi.end(sessionId), onSuccess: invalidate });
  const nextPlayer = useMutation({ mutationFn: () => sessionsApi.nextPlayer(sessionId), onSuccess: invalidate });

  return { start, baseline, resetBaseline, end, nextPlayer };
}

export function useSessionDetections(sessionId: number) {
  return useQuery({
    queryKey: ["detections", sessionId],
    queryFn: () => sessionsApi.getDetections(sessionId),
    refetchInterval: 4_000,
  });
}
