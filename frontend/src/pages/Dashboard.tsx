import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Plus, Trophy, Activity } from "lucide-react";
import { sessionsApi } from "@/api/sessions";
import { scoresApi } from "@/api/scores";
import { cameraApi } from "@/api/camera";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { data: sessions } = useQuery({ queryKey: ["sessions"], queryFn: sessionsApi.list });
  const { data: highscores } = useQuery({ queryKey: ["highscores"], queryFn: () => scoresApi.highscores(5) });
  const { data: camStatus } = useQuery({ queryKey: ["camera-status"], queryFn: cameraApi.status, refetchInterval: 10_000 });

  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];
  const recentSessions = sessions?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Raspberry Pi Bullet Detection System</p>
        </div>
        <Link to="/session" className="btn-primary">
          <Plus size={16} /> New Session
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Camera"
          value={camStatus?.available ? "Online" : "Offline"}
          sub={camStatus?.demo_mode ? "Demo mode" : `${camStatus?.fps ?? 0} fps`}
          accent={camStatus?.available ? "text-confirm" : "text-accent"}
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Active Sessions"
          value={String(activeSessions.length)}
          sub="Currently running"
          icon={<Crosshair size={18} />}
        />
        <StatCard
          label="Total Sessions"
          value={String(sessions?.length ?? 0)}
          sub="All time"
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Top Score"
          value={String(highscores?.[0]?.total_score ?? 0)}
          sub={highscores?.[0]?.player_name ?? "—"}
          icon={<Trophy size={18} />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent sessions */}
        <div className="card">
          <h2 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Recent Sessions</h2>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions yet. <Link to="/session" className="text-brand hover:underline">Start one.</Link></p>
          ) : (
            <ul className="space-y-2">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.name ?? `Session #${s.id}`}</p>
                    <p className="text-xs text-gray-500">{formatDate(s.created_at)}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leaderboard snippet */}
        <div className="card">
          <h2 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Top Players</h2>
          {!highscores?.length ? (
            <p className="text-gray-500 text-sm">No scores yet.</p>
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
                  <span className="text-sm font-bold text-brand">{entry.total_score} pts</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/highscores" className="block text-center text-xs text-brand mt-4 hover:underline">
            Full leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, accent = "text-white" }: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className="p-2 bg-surface-elevated rounded-lg text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${accent}`}>{value}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-confirmed",
    ended: "badge-rejected",
    paused: "badge-pending",
    pending: "badge-pending",
  };
  return <span className={map[status] ?? "badge"}>{status}</span>;
}
