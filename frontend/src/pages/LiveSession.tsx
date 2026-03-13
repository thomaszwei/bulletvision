import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Camera, RefreshCw, Target, UserCheck, Square, ChevronRight, Check, X } from "lucide-react";
import { useSession, useSessionActions, useSessionDetections } from "@/hooks/useSession";
import { useDetectionActions } from "@/hooks/useDetections";
import { useDetectionStore } from "@/store/detectionStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { LiveFeed } from "@/components/camera/LiveFeed";
import type { WSEvent, Detection } from "@/types";
import { formatDate, confidenceLabel, confidenceColor, cn } from "@/lib/utils";
import { sessionsApi } from "@/api/sessions";
import { useQuery } from "@tanstack/react-query";
import { playersApi } from "@/api/players";
import { useTranslation } from "react-i18next";

export default function LiveSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = id ? parseInt(id) : null;

  if (!sessionId) {
    return <SessionPicker />;
  }

  return <LiveSessionView sessionId={sessionId} />;
}

function SessionPicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: sessions } = useQuery({ queryKey: ["sessions"], queryFn: sessionsApi.list });
  const { data: players } = useQuery({ queryKey: ["players"], queryFn: playersApi.list });
  const [name, setName] = useState("");
  const [mode, setMode] = useState("freeplay");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const s = await sessionsApi.create({ name: name || undefined, mode, player_ids: selectedPlayers });
      navigate(`/session/${s.id}`);
    } finally {
      setCreating(false);
    }
  };

  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t("session.title")}</h1>

      {activeSessions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-sm text-gray-400 mb-3">{t("session.resumeActive").toUpperCase()}</h2>
          <ul className="space-y-2">
            {activeSessions.map((s) => (
              <li key={s.id}>
                <button onClick={() => navigate(`/session/${s.id}`)} className="w-full flex items-center justify-between p-3 bg-surface-elevated hover:bg-surface-border rounded-lg transition-colors">
                  <div className="text-left">
                    <p className="font-medium text-sm">{s.name ?? t("common.sessionPrefix", { id: s.id })}</p>
                    <p className="text-xs text-gray-500">{s.mode} Â· {formatDate(s.created_at)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="font-semibold text-sm text-gray-400">{t("session.createNew").toUpperCase()}</h2>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("session.sessionNameLabel")}</label>
          <input className="input" placeholder={t("session.sessionNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("session.modeLabel")}</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="freeplay">{t("session.modeFreeplay")}</option>
            <option value="turnbased">{t("session.modeTurnbased")}</option>
            <option value="timed">{t("session.modeTimed")}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("session.playersLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {players?.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayers((prev) =>
                  prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                )}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                  selectedPlayers.includes(p.id)
                    ? "border-brand bg-brand/20 text-brand"
                    : "border-surface-border text-gray-400 hover:text-white"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          {!players?.length && (
            <p className="text-xs text-gray-500">
              {t("session.noPlayersYet")}{" "}
              <a href="/players" className="text-brand hover:underline">{t("session.createSome")}</a>
            </p>
          )}
        </div>
        <button className="btn-primary w-full" onClick={handleCreate} disabled={creating}>
          <Camera size={16} /> {creating ? t("session.creating") : t("session.createButton")}
        </button>
      </div>
    </div>
  );
}

function LiveSessionView({ sessionId }: { sessionId: number }) {
  const { t } = useTranslation();
  const { data: session, refetch: refetchSession } = useSession(sessionId);
  const { data: initialDetections } = useSessionDetections(sessionId);
  const actions = useSessionActions(sessionId);
  const detectionActions = useDetectionActions(sessionId);

  const { detections, setDetections, addOrUpdate } = useDetectionStore();

  useEffect(() => {
    if (initialDetections) setDetections(initialDetections);
  }, [initialDetections, setDetections]);

  const handleWSEvent = useCallback((event: WSEvent) => {
    if (event.type === "detection_new" || event.type === "detection_updated") {
      addOrUpdate(event.data as unknown as Detection);
    }
    if (event.type === "session_ended" || event.type === "player_switched" || event.type === "baseline_reset") {
      refetchSession();
    }
  }, [addOrUpdate, refetchSession]);

  useWebSocket({ sessionId, onEvent: handleWSEvent, enabled: session?.status === "active" });

  if (!session) {
    return <div className="text-gray-400 animate-pulse">{t("session.loading")}</div>;
  }

  const activePlayer = session.session_players.find((sp) => sp.is_active);
  const pendingDetections = detections.filter((d) => d.status === "pending");
  const confirmedDetections = detections.filter((d) => d.status === "confirmed");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{session.name ?? t("common.sessionPrefix", { id: session.id })}</h1>
          <p className="text-gray-500 text-sm capitalize">{session.mode} Â· {session.status}</p>
        </div>
        <div className="flex gap-2">
          {session.status === "active" && (
            <button className="btn-danger" onClick={() => actions.end.mutate()}>
              <Square size={14} /> {t("session.endSession")}
            </button>
          )}
          {session.status === "pending" && (
            <button className="btn-primary" onClick={() => actions.start.mutate()}>
              {t("session.startSession")}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <LiveFeed
            detections={detections}
            onConfirm={(id) => detectionActions.confirm.mutate(id)}
            onReject={(id) => detectionActions.reject.mutate(id)}
            hasBaseline={!!session.baseline_path}
          />

          {session.status === "active" && (
            <div className="flex flex-wrap gap-2">
              {!session.baseline_path ? (
                <button className="btn-primary" onClick={() => actions.baseline.mutate()} disabled={actions.baseline.isPending}>
                  <Target size={14} /> {actions.baseline.isPending ? t("session.capturing") : t("session.captureBaseline")}
                </button>
              ) : (
                <button className="btn-outline" onClick={() => actions.resetBaseline.mutate()} disabled={actions.resetBaseline.isPending}>
                  <RefreshCw size={14} /> {actions.resetBaseline.isPending ? t("session.resetting") : t("session.resetBaseline")}
                </button>
              )}
              {session.session_players.length > 1 && (
                <button className="btn-ghost" onClick={() => actions.nextPlayer.mutate()} disabled={actions.nextPlayer.isPending}>
                  <UserCheck size={14} /> {t("session.nextPlayer")}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">{t("session.playersSection")}</h3>
            <ul className="space-y-2">
              {session.session_players.map((sp) => (
                <li
                  key={sp.id}
                  onClick={() => {
                    if (!sp.is_active && session.status === "active") {
                      actions.switchToPlayer.mutate(sp.player_id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    sp.is_active
                      ? "bg-brand/10 border border-brand/30"
                      : session.status === "active"
                        ? "bg-transparent hover:bg-surface-elevated cursor-pointer border border-transparent"
                        : "bg-transparent border border-transparent"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: sp.player.avatar_color }}
                  >
                    {sp.player.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sp.player.name}</p>
                    {sp.is_active
                      ? <p className="text-xs text-brand">{t("session.activeBadge")}</p>
                      : session.status === "active" && <p className="text-xs text-gray-500">{t("session.clickToSwitch")}</p>
                    }
                  </div>
                  <span className="text-lg font-bold text-brand">{sp.score}</span>
                </li>
              ))}
              {session.session_players.length === 0 && (
                <li className="text-gray-500 text-sm">{t("session.noPlayersSection")}</li>
              )}
            </ul>
          </div>

          <div className="card flex-1">
            <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              {t("session.pendingSection", { count: pendingDetections.length })}
            </h3>
            {pendingDetections.length === 0 ? (
              <p className="text-gray-600 text-sm">{t("session.noDetections")}</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pendingDetections.map((d) => (
                  <DetectionListItem
                    key={d.id}
                    detection={d}
                    onConfirm={() => detectionActions.confirm.mutate(d.id)}
                    onReject={() => detectionActions.reject.mutate(d.id)}
                  />
                ))}
              </ul>
            )}

            <div className="mt-3 pt-3 border-t border-surface-border">
              <p className="text-xs text-gray-500">{t("session.confirmedCount", { count: confirmedDetections.length })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectionListItem({
  detection: d, onConfirm, onReject,
}: {
  detection: Detection;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <li className="flex items-center gap-2 p-2 bg-surface-elevated rounded-lg">
      <div className="shrink-0">
        <span className="badge-pending">#{d.id}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${confidenceColor(d.confidence)}`}>
          {confidenceLabel(d.confidence)} {Math.round(d.confidence * 100)}%
        </p>
        <p className="text-xs text-gray-500">{formatDate(d.detected_at)}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onConfirm} className="p-1.5 bg-confirm/20 text-confirm rounded hover:bg-confirm/30 transition-colors" title="Confirm">
          <Check size={14} strokeWidth={2.5} />
        </button>
        <button onClick={onReject} className="p-1.5 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors" title="Reject">
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </li>
  );
}
