import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw } from "lucide-react";
import { settingsApi } from "@/api/settings";
import { useTranslation } from "react-i18next";

type FieldType = "number" | "boolean" | "string";

interface SettingMeta {
  key: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  group: string;
}

const SETTING_METAS: SettingMeta[] = [
  { key: "confidence_threshold", type: "number", min: 0.1, max: 0.99, step: 0.01, group: "Detection" },
  { key: "min_area", type: "number", min: 10, max: 5000, step: 10, group: "Detection" },
  { key: "max_area", type: "number", min: 100, max: 50000, step: 100, group: "Detection" },
  { key: "detection_fps", type: "number", min: 1, max: 10, step: 1, group: "Detection" },
  { key: "morph_kernel_size", type: "number", min: 3, max: 21, step: 2, group: "Detection" },
  { key: "camera_width", type: "number", min: 320, max: 1920, step: 32, group: "Camera" },
  { key: "camera_height", type: "number", min: 240, max: 1080, step: 24, group: "Camera" },
  { key: "demo_mode", type: "boolean", group: "Camera" },
  { key: "points_per_hit", type: "number", min: 1, max: 100, step: 1, group: "Scoring" },
  { key: "bull_multiplier", type: "number", min: 1, max: 10, step: 0.5, group: "Scoring" },
];

const GROUPS = [...new Set(SETTING_METAS.map((m) => m.group))];

export default function Settings() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: remote = {}, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.list,
  });

  const [local, setLocal] = useState<Record<string, string | number | boolean>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLocal(remote);
      setDirty(false);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: () => settingsApi.bulkUpdate(local),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setDirty(false);
    },
  });

  const handleChange = (key: string, value: string | number | boolean) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleReset = () => {
    setLocal(remote);
    setDirty(false);
  };

  if (isLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-gray-500 text-sm">{t("settings.subtitle")}</p>
        </div>
        {dirty && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={handleReset} disabled={saveMutation.isPending}>
              <RotateCcw size={14} /> {t("common.cancel")}
            </button>
            <button className="btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save size={14} /> {saveMutation.isPending ? t("settings.saving") : t("common.save")}
            </button>
          </div>
        )}
      </div>

      {GROUPS.map((group) => (
        <div key={group} className="card space-y-4">
          <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">{group}</h2>
          {SETTING_METAS.filter((m) => m.group === group).map((meta) => (
            <SettingRow
              key={meta.key}
              meta={meta}
              value={local[meta.key] ?? remote[meta.key]}
              onChange={(v) => handleChange(meta.key, v)}
            />
          ))}
        </div>
      ))}

      {saveMutation.isError && (
        <p className="text-accent text-sm">{t("settings.saveError")}</p>
      )}
    </div>
  );
}

function SettingRow({
  meta, value, onChange,
}: {
  meta: SettingMeta;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  const { t } = useTranslation();
  const fieldT = t(`settings.fields.${meta.key}`, { returnObjects: true }) as { label: string; desc: string };

  return (
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <label className="font-medium text-sm">{fieldT.label}</label>
        <p className="text-xs text-gray-500 mt-0.5">{fieldT.desc}</p>
      </div>
      <div className="shrink-0 w-40">
        {meta.type === "boolean" ? (
          <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${value ? "bg-brand" : "bg-surface-border"}`}
          >
            <span
              className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-1 ${value ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        ) : meta.type === "number" && meta.min !== undefined ? (
          <div className="space-y-1">
            <input
              type="range"
              min={meta.min}
              max={meta.max}
              step={meta.step ?? 1}
              value={Number(value ?? meta.min)}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{meta.min}</span>
              <span className="font-bold text-white">{value ?? meta.min}</span>
              <span>{meta.max}</span>
            </div>
          </div>
        ) : (
          <input
            className="input text-sm"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

interface SettingMeta {
  key: string;
  label: string;
  description: string;
  type: "number" | "boolean" | "string";
  min?: number;
  max?: number;
  step?: number;
  group: string;
}

const SETTING_METAS: SettingMeta[] = [
  // Detection
  { key: "confidence_threshold", label: "Confidence Threshold", description: "Minimum confidence to report a detection (0â€“1)", type: "number", min: 0.1, max: 0.99, step: 0.01, group: "Detection" },
  { key: "min_area", label: "Min Contour Area (pxÂ²)", description: "Smallest contour area counted as a hole", type: "number", min: 10, max: 5000, step: 10, group: "Detection" },
  { key: "max_area", label: "Max Contour Area (pxÂ²)", description: "Largest contour area counted as a hole", type: "number", min: 100, max: 50000, step: 100, group: "Detection" },
  { key: "detection_fps", label: "Detection FPS", description: "Frames per second to analyse (1â€“10)", type: "number", min: 1, max: 10, step: 1, group: "Detection" },
  { key: "morph_kernel_size", label: "Morphology Kernel", description: "Morphological op kernel size (odd number)", type: "number", min: 3, max: 21, step: 2, group: "Detection" },
  // Camera
  { key: "camera_width", label: "Frame Width", description: "Camera capture width in pixels", type: "number", min: 320, max: 1920, step: 32, group: "Camera" },
  { key: "camera_height", label: "Frame Height", description: "Camera capture height in pixels", type: "number", min: 240, max: 1080, step: 24, group: "Camera" },
  { key: "demo_mode", label: "Demo Mode", description: "Use synthetic frames instead of real camera", type: "boolean", group: "Camera" },
  // Scoring
  { key: "points_per_hit", label: "Points per Hit", description: "Base points awarded for a confirmed hit", type: "number", min: 1, max: 100, step: 1, group: "Scoring" },
  { key: "bull_multiplier", label: "Bull Multiplier", description: "Score multiplier for centre-zone hits", type: "number", min: 1, max: 10, step: 0.5, group: "Scoring" },
];

const GROUPS = [...new Set(SETTING_METAS.map((m) => m.group))];
