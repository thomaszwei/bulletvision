import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Clock, Users, Target } from "lucide-react";
import { sessionsApi } from "@/api/sessions";
import type { Session } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  active: "badge-active",
  pending: "badge-pending",
  ended: "badge-ended",
  paused: "badge-pending",
};

export default function SessionHistory() {
  const { t } = useTranslation();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });
  const [filter, setFilter] = useState<"all" | "ended" | "active">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const navigate = useNavigate();

  const filtered = sessions
    .filter((s) => filter === "all" || s.status === filter)
    .sort((a, b) => {
      const da = +new Date(a.created_at);
      const db = +new Date(b.created_at);
      return sort === "newest" ? db - da : da - db;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("history.title")}</h1>
          <p className="text-gray-500 text-sm">{t("history.totalCount", { count: sessions.length })}</p>
        </div>
        <div className="flex gap-2">
          <select className="input py-1.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">{t("history.filterAll")}</option>
            <option value="active">{t("history.filterActive")}</option>
            <option value="ended">{t("history.filterEnded")}</option>
          </select>
          <select className="input py-1.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="newest">{t("history.sortNewest")}</option>
            <option value="oldest">{t("history.sortOldest")}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">{t("history.noSessions")}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <SessionRow key={s.id} session={s} onOpen={() => {
              if (s.status === "active") navigate(`/session/${s.id}`);
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session: s, onOpen }: { session: Session; onOpen: () => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <button className="text-gray-500 shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{s.name ?? t("common.sessionPrefix", { id: s.id })}</span>
            <span className={cn("badge", STATUS_COLORS[s.status] ?? "badge-pending")}>
              {t(`status.${s.status}`, s.status)}
            </span>
            <span className="text-xs text-gray-500 capitalize">{s.mode}</span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(s.created_at)}</span>
            <span className="flex items-center gap-1"><Users size={11} />{t("history.playersCount", { count: s.session_players.length })}</span>
          </p>
        </div>
        {s.status === "active" && (
          <button className="btn-primary text-xs py-1" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            {t("history.resume")}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-border animate-fade-in">
          {s.session_players.length > 0 ? (
            <ul className="space-y-1.5">
              {s.session_players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((sp) => (
                  <li key={sp.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: sp.player.avatar_color }}
                    >
                      {sp.player.name[0].toUpperCase()}
                    </div>
                    <span className="flex-1">{sp.player.name}</span>
                    <span className="flex items-center gap-1 text-gray-400"><Target size={12} />{sp.shots_fired}</span>
                    <span className="font-bold text-brand">{sp.score} {t("common.pts")}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t("history.noPlayers")}</p>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "badge-active",
  pending: "badge-pending",
  ended: "badge-ended",
  paused: "badge-pending",
};

export default function SessionHistory() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });
  const [filter, setFilter] = useState<"all" | "ended" | "active">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const navigate = useNavigate();

  const filtered = sessions
    .filter((s) => filter === "all" || s.status === filter)
    .sort((a, b) => {
      const da = +new Date(a.created_at);
      const db = +new Date(b.created_at);
      return sort === "newest" ? db - da : da - db;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Session History</h1>
          <p className="text-gray-500 text-sm">{sessions.length} sessions total</p>
        </div>
        <div className="flex gap-2">
          <select className="input py-1.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
          <select className="input py-1.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">No sessions found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <SessionRow key={s.id} session={s} onOpen={() => {
              if (s.status === "active") navigate(`/session/${s.id}`);
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session: s, onOpen }: { session: Session; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <button className="text-gray-500 shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{s.name ?? `Session #${s.id}`}</span>
            <span className={cn("badge", STATUS_COLORS[s.status] ?? "badge-pending")}>
              {s.status}
            </span>
            <span className="text-xs text-gray-500 capitalize">{s.mode}</span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(s.created_at)}</span>
            <span className="flex items-center gap-1"><Users size={11} />{s.session_players.length} players</span>
          </p>
        </div>
        {s.status === "active" && (
          <button className="btn-primary text-xs py-1" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            Resume
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-border animate-fade-in">
          {s.session_players.length > 0 ? (
            <ul className="space-y-1.5">
              {s.session_players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((sp) => (
                  <li key={sp.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: sp.player.avatar_color }}
                    >
                      {sp.player.name[0].toUpperCase()}
                    </div>
                    <span className="flex-1">{sp.player.name}</span>
                    <span className="flex items-center gap-1 text-gray-400"><Target size={12} />{sp.shots_fired}</span>
                    <span className="font-bold text-brand">{sp.score} pts</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No players</p>
          )}
        </div>
      )}
    </div>
  );
}
