import { useMutation, useQueryClient } from "@tanstack/react-query";
import { detectionsApi } from "@/api/detections";

export function useDetectionActions(sessionId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["detections", sessionId] });

  const confirm = useMutation({
    mutationFn: (id: number) => detectionsApi.confirm(id),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (id: number) => detectionsApi.reject(id),
    onSuccess: invalidate,
  });

  return { confirm, reject };
}
