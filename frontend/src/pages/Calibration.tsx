import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Trash2, MousePointer } from "lucide-react";
import { calibrationApi } from "@/api/calibration";
import { cameraApi } from "@/api/camera";
import type { CalibrationProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Calibration() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery({ queryKey: ["calibration"], queryFn: calibrationApi.list });
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => calibrationApi.create({ name: newName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calibration"] }); setShowNew(false); setNewName(""); },
  });

  const activateMutation = useMutation({
    mutationFn: calibrationApi.activate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: calibrationApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("calibration.title")}</h1>
          <p className="text-gray-500 text-sm">{t("calibration.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> {t("calibration.newProfile")}
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">{t("calibration.livePreview")}</h3>
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <img src="/api/camera/stream" alt="Live feed" className="w-full h-full object-contain" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/60">
              <MousePointer size={24} className="mx-auto mb-2" />
              <p className="text-sm">{t("calibration.clickToCalibrate")}</p>
            </div>
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">{t("calibration.noProfiles")}</div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              onActivate={() => activateMutation.mutate(p.id)}
              onDelete={() => { if (confirm(t("calibration.deleteConfirm", { name: p.name }))) deleteMutation.mutate(p.id); }}
            />
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowNew(false)}>
          <div className="card w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold mb-4">{t("calibration.newProfileTitle")}</h2>
            <input
              className="input mb-4"
              placeholder={t("calibration.profileNamePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName && createMutation.mutate()}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setShowNew(false)}>{t("common.cancel")}</button>
              <button className="btn-primary flex-1" onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending}>
                {t("common.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  profile: p, onActivate, onDelete,
}: {
  profile: CalibrationProfile;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("card flex items-center gap-3", p.is_active ? "border-brand/40 border" : "")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{p.name}</span>
          {p.is_active && <span className="badge-active text-xs">{t("calibration.activeBadge")}</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {p.perspective_matrix ? t("calibration.matrixCalibrated") : t("calibration.noMatrix")} · {p.corners_json ? t("calibration.cornersSet") : t("calibration.noCorners")}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {!p.is_active && (
          <button onClick={onActivate} className="btn-ghost text-xs py-1 px-2">
            <Check size={12} /> {t("common.activate")}
          </button>
        )}
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-accent/20 text-gray-500 hover:text-accent transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Calibration() {
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery({ queryKey: ["calibration"], queryFn: calibrationApi.list });
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => calibrationApi.create({ name: newName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calibration"] }); setShowNew(false); setNewName(""); },
  });

  const activateMutation = useMutation({
    mutationFn: calibrationApi.activate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: calibrationApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calibration</h1>
          <p className="text-gray-500 text-sm">Perspective correction profiles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Profile
        </button>
      </div>

      {/* Live feed + corner-click guide */}
      <div className="card">
        <h3 className="font-semibold mb-3">Live Preview</h3>
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <img
            src="/api/camera/stream"
            alt="Live feed"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/60">
              <MousePointer size={24} className="mx-auto mb-2" />
              <p className="text-sm">Click corners to calibrate (future feature)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles list */}
      {profiles.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          No calibration profiles. Create one to correct for camera angle.
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              onActivate={() => activateMutation.mutate(p.id)}
              onDelete={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.id); }}
            />
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowNew(false)}>
          <div className="card w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold mb-4">New Calibration Profile</h2>
            <input
              className="input mb-4"
              placeholder="Profile name (e.g. Range 1 — 5m)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName && createMutation.mutate()}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  profile: p,
  onActivate,
  onDelete,
}: {
  profile: CalibrationProfile;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn("card flex items-center gap-3", p.is_active ? "border-brand/40 border" : "")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{p.name}</span>
          {p.is_active && <span className="badge-active text-xs">Active</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {p.perspective_matrix ? "Matrix calibrated" : "No matrix"} · {p.corners_json ? "Corners set" : "No corners"}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {!p.is_active && (
          <button onClick={onActivate} className="btn-ghost text-xs py-1 px-2">
            <Check size={12} /> Activate
          </button>
        )}
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-accent/20 text-gray-500 hover:text-accent transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
