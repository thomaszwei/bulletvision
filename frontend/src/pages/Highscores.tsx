import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Star, Target, Percent } from "lucide-react";
import { scoresApi } from "@/api/scores";
import type { HighscoreEntry } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Highscores() {
  const { t } = useTranslation();
  const { data: highscores = [], isLoading } = useQuery({
    queryKey: ["highscores"],
    queryFn: () => scoresApi.highscores(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("highscores.title")}</h1>
        <p className="text-gray-500 text-sm">{t("highscores.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : highscores.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p>{t("highscores.noScores")}</p>
        </div>
      ) : (
        <>
          {highscores.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-2">
              <PodiumCard entry={highscores[1]} position={2} />
              <PodiumCard entry={highscores[0]} position={1} />
              <PodiumCard entry={highscores[2]} position={3} />
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-surface-border">
                  <th className="text-left py-2 px-3">{t("highscores.rankHeader")}</th>
                  <th className="text-left py-2 px-3">{t("highscores.playerHeader")}</th>
                  <th className="text-right py-2 px-3"><Trophy size={12} className="inline" /> {t("highscores.scoreHeader")}</th>
                  <th className="text-right py-2 px-3 hidden sm:table-cell"><Target size={12} className="inline" /> {t("highscores.shotsHeader")}</th>
                  <th className="text-right py-2 px-3 hidden sm:table-cell"><Percent size={12} className="inline" /> {t("highscores.accHeader")}</th>
                  <th className="text-right py-2 px-3 hidden md:table-cell">{t("highscores.bestHeader")}</th>
                </tr>
              </thead>
              <tbody>
                {highscores.map((entry) => (
                  <LeaderboardRow key={entry.player_id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({ entry, position }: { entry: HighscoreEntry; position: 1 | 2 | 3 }) {
  const { t } = useTranslation();
  const heights = { 1: "h-36", 2: "h-28", 3: "h-24" };
  const icons = {
    1: <Trophy size={20} className="text-yellow-400" />,
    2: <Medal size={20} className="text-gray-300" />,
    3: <Medal size={20} className="text-amber-600" />,
  };

  return (
    <div className={cn("card flex flex-col items-center justify-end pb-4 gap-2", heights[position])}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow"
        style={{ background: entry.avatar_color }}
      >
        {entry.player_name[0].toUpperCase()}
      </div>
      <p className="font-semibold text-sm truncate max-w-full px-2 text-center">{entry.player_name}</p>
      <div className="flex items-center gap-1">
        {icons[position]}
        <span className="font-bold text-lg">{entry.total_score}</span>
        <span className="text-xs text-gray-500">{t("common.pts")}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: HighscoreEntry }) {
  const { t } = useTranslation();
  const rankColors: Record<number, string> = { 1: "text-yellow-400", 2: "text-gray-300", 3: "text-amber-600" };
  const RankIcon = entry.rank <= 3
    ? () => <Star size={14} className={rankColors[entry.rank] ?? ""} fill="currentColor" />
    : () => <span className="text-gray-500 text-xs">#{entry.rank}</span>;

  return (
    <tr className="border-b border-surface-border/50 hover:bg-surface-elevated/50 transition-colors">
      <td className="py-3 px-3"><RankIcon /></td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: entry.avatar_color }}
          >
            {entry.player_name[0].toUpperCase()}
          </div>
          <span className="font-medium">{entry.player_name}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-right font-bold text-brand">{entry.total_score}</td>
      <td className="py-3 px-3 text-right text-gray-400 hidden sm:table-cell">{entry.sessions_played}</td>
      <td className="py-3 px-3 text-right text-gray-400 hidden sm:table-cell">{Math.round((entry.accuracy ?? 0) * 100)}%</td>
      <td className="py-3 px-3 text-right text-gray-400 hidden md:table-cell">{entry.best_session_score ?? t("common.noData")}</td>
    </tr>
  );
}

export default function Highscores() {
  const { data: highscores = [], isLoading } = useQuery({
    queryKey: ["highscores"],
    queryFn: () => scoresApi.highscores(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Highscores</h1>
        <p className="text-gray-500 text-sm">All-time leaderboard</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : highscores.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p>No scores yet. Run a session to get on the board!</p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {highscores.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-2">
              <PodiumCard entry={highscores[1]} position={2} />
              <PodiumCard entry={highscores[0]} position={1} />
              <PodiumCard entry={highscores[2]} position={3} />
            </div>
          )}

          {/* Full table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-surface-border">
                  <th className="text-left py-2 px-3">Rank</th>
                  <th className="text-left py-2 px-3">Player</th>
                  <th className="text-right py-2 px-3"><Trophy size={12} className="inline" /> Score</th>
                  <th className="text-right py-2 px-3 hidden sm:table-cell"><Target size={12} className="inline" /> Shots</th>
                  <th className="text-right py-2 px-3 hidden sm:table-cell"><Percent size={12} className="inline" /> Acc.</th>
                  <th className="text-right py-2 px-3 hidden md:table-cell">Best</th>
                </tr>
              </thead>
              <tbody>
                {highscores.map((entry) => (
                  <LeaderboardRow key={entry.player_id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({ entry, position }: { entry: HighscoreEntry; position: 1 | 2 | 3 }) {
  const heights = { 1: "h-36", 2: "h-28", 3: "h-24" };
  const icons = {
    1: <Trophy size={20} className="text-yellow-400" />,
    2: <Medal size={20} className="text-gray-300" />,
    3: <Medal size={20} className="text-amber-600" />,
  };

  return (
    <div className={cn("card flex flex-col items-center justify-end pb-4 gap-2", heights[position])}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow"
        style={{ background: entry.avatar_color }}
      >
        {entry.player_name[0].toUpperCase()}
      </div>
      <p className="font-semibold text-sm truncate max-w-full px-2 text-center">{entry.player_name}</p>
      <div className="flex items-center gap-1">
        {icons[position]}
        <span className="font-bold text-lg">{entry.total_score}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: HighscoreEntry }) {
  const rankColors: Record<number, string> = { 1: "text-yellow-400", 2: "text-gray-300", 3: "text-amber-600" };
  const RankIcon = entry.rank <= 3
    ? () => <Star size={14} className={rankColors[entry.rank] ?? ""} fill="currentColor" />
    : () => <span className="text-gray-500 text-xs">#{entry.rank}</span>;

  return (
    <tr className="border-b border-surface-border/50 hover:bg-surface-elevated/50 transition-colors">
      <td className="py-3 px-3">
        <RankIcon />
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: entry.avatar_color }}
          >
            {entry.player_name[0].toUpperCase()}
          </div>
          <span className="font-medium">{entry.player_name}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-right font-bold text-brand">{entry.total_score}</td>
      <td className="py-3 px-3 text-right text-gray-400 hidden sm:table-cell">{entry.sessions_played}</td>
      <td className="py-3 px-3 text-right text-gray-400 hidden sm:table-cell">{Math.round((entry.accuracy ?? 0) * 100)}%</td>
      <td className="py-3 px-3 text-right text-gray-400 hidden md:table-cell">{entry.best_session_score ?? "–"}</td>
    </tr>
  );
}
