import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Trophy, Target, Percent } from "lucide-react";
import { playersApi } from "@/api/players";
import type { Player } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#6366F1", "#A855F7", "#EC4899",
];

export default function Players() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: playersApi.list });
  const [editTarget, setEditTarget] = useState<Player | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => playersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("players.title")}</h1>
          <p className="text-gray-500 text-sm">{t("players.registered", { count: players.length })}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> {t("players.addPlayer")}
        </button>
      </div>

      {players.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <p className="text-lg">{t("players.noPlayers")}</p>
          <p className="text-sm mt-1">{t("players.noPlayersHint")}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              onEdit={() => setEditTarget(p)}
              onDelete={() => {
                if (confirm(t("players.deleteConfirm", { name: p.name }))) deleteMutation.mutate(p.id);
              }}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <PlayerModal
          onClose={() => setShowCreate(false)}
          onSave={() => { qc.invalidateQueries({ queryKey: ["players"] }); setShowCreate(false); }}
        />
      )}
      {editTarget && (
        <PlayerModal
          player={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={() => { qc.invalidateQueries({ queryKey: ["players"] }); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function PlayerCard({ player: p, onEdit, onDelete }: { player: Player; onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const { data: stats } = useQuery({
    queryKey: ["player-stats", p.id],
    queryFn: () => playersApi.stats(p.id),
  });

  return (
    <div className="card group">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md"
          style={{ background: p.avatar_color }}
        >
          {p.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{p.name}</h3>
          <p className="text-xs text-gray-500">{t("common.playerPrefix", { id: p.id })}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-surface-border text-gray-400 hover:text-white transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-accent/20 text-gray-400 hover:text-accent transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-3 gap-2">
          <StatMini icon={<Trophy size={12} />} label={t("players.scoreLabel")} value={stats.total_score} />
          <StatMini icon={<Target size={12} />} label={t("players.shotsLabel")} value={stats.shots_confirmed} />
          <StatMini icon={<Percent size={12} />} label={t("players.accLabel")} value={`${Math.round((stats.accuracy ?? 0) * 100)}%`} />
        </div>
      ) : (
        <div className="h-10 animate-pulse bg-surface-elevated rounded" />
      )}
    </div>
  );
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-surface-elevated rounded-lg px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function PlayerModal({ player, onClose, onSave }: { player?: Player; onClose: () => void; onSave: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(player?.name ?? "");
  const [color, setColor] = useState(player?.avatar_color ?? COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (player) {
        await playersApi.update(player.id, { name, avatar_color: color });
      } else {
        await playersApi.create({ name, avatar_color: color });
      }
      onSave();
    } catch {
      setError(t("players.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4">{player ? t("players.editPlayer") : t("players.newPlayer")}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("players.nameLabel")}</label>
            <input
              className="input"
              placeholder={t("players.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">{t("players.avatarColorLabel")}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("w-8 h-8 rounded-full transition-all", color === c ? "ring-2 ring-white ring-offset-2 ring-offset-surface" : "")}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-accent text-xs">{error}</p>}
        </div>
        <div className="flex gap-2 mt-6">
          <button className="btn-ghost flex-1" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn-primary flex-1" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

const COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#6366F1", "#A855F7", "#EC4899",
];
