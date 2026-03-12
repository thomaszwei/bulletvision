import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Plus, Trophy, Activity } from "lucide-react";
import { sessionsApi } from "@/api/sessions";
import { scoresApi } from "@/api/scores";
import { cameraApi } from "@/api/camera";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: sessions } = useQuery({ queryKey: ["sessions"], queryFn: sessionsApi.list });
  const { data: highscores } = useQuery({ queryKey: ["highscores"], queryFn: () => scoresApi.highscores(5) });
  const { data: camStatus } = useQuery({ queryKey: ["camera-status"], queryFn: cameraApi.status, refetchInterval: 10_000 });

  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];
  const recentSessions = sessions?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <Link to="/session" className="btn-primary">
          <Plus size={16} /> {t("dashboard.newSession")}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.cameraLabel")}
          value={camStatus?.available ? t("dashboard.online") : t("dashboard.offline")}
          sub={camStatus?.demo_mode ? t("dashboard.demoMode") : t("dashboard.fps", { fps: camStatus?.fps ?? 0 })}
          accent={camStatus?.available ? "text-confirm" : "text-accent"}
          icon={<Activity size={18} />}
        />
        <StatCard
          label={t("dashboard.activeSessions")}
          value={String(activeSessions.length)}
          sub={t("dashboard.currentlyRunning")}
          icon={<Crosshair size={18} />}
        />
        <StatCard
          label={t("dashboard.totalSessions")}
          value={String(sessions?.length ?? 0)}
          sub={t("dashboard.allTime")}
          icon={<Activity size={18} />}
        />
        <StatCard
          label={t("dashboard.topScore")}
          value={String(highscores?.[0]?.total_score ?? 0)}
          sub={highscores?.[0]?.player_name ?? "\u2014"}
          icon={<Trophy size={18} />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">{t("dashboard.recentSessions")}</h2>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {t("dashboard.noSessions")}{" "}
              <Link to="/session" className="text-brand hover:underline">{t("dashboard.startOne")}</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.name ?? t("common.sessionPrefix", { id: s.id })}</p>
                    <p className="text-xs text-gray-500">{formatDate(s.created_at)}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">{t("dashboard.topPlayers")}</h2>
          {!highscores?.length ? (
            <p className="text-gray-500 text-sm">{t("dashboard.noScores")}</p>
          ) : (
            <ul className="space-y-2">
              {highscores.map((entry, i) => (
                <li key={entry.player_id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: entry.avatar_color }}
                  >
                    {entry.player_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.player_name}</p>
                  </div>
                  <span className="text-sm font-bold text-brand">{entry.total_score} {t("common.pts")}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/highscores" className="block text-center text-xs text-brand mt-4 hover:underline">
            {t("dashboard.fullLeaderboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon, accent = "text-white",
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between text-gray-400">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 truncate">{sub}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-confirm/10 text-confirm",
  pending: "bg-warn/10 text-warn",
  paused: "bg-brand/10 text-brand",
  ended: "bg-surface-elevated text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? "bg-surface-elevated text-gray-400"}`}>
      {status}
    </span>
  );
}
