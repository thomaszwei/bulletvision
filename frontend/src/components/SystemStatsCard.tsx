import { useQuery } from "@tanstack/react-query";
import { Cpu, Thermometer, HardDrive, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { systemApi, type SystemStats } from "@/api/system";

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function tempColor(c: number): string {
  if (c >= 75) return "#EF4444"; // accent red
  if (c >= 60) return "#F59E0B"; // warn amber
  return "#10B981"; // confirm green
}

function loadColor(pct: number): string {
  if (pct >= 85) return "#EF4444";
  if (pct >= 65) return "#F59E0B";
  return "#6366F1"; // brand indigo
}

export default function SystemStatsCard() {
  const { t } = useTranslation();
  const { data, isError } = useQuery<SystemStats>({
    queryKey: ["systemStats"],
    queryFn: systemApi.stats,
    refetchInterval: 5_000,
    retry: false,
  });

  if (isError) {
    return (
      <div className="card text-xs text-gray-500">{t("system.loadingError")}</div>
    );
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide flex items-center gap-2">
        <Cpu size={14} /> {t("system.title")}
      </h2>

      {/* CPU */}
      <Row
        label={t("system.cpu")}
        value={data ? `${data.cpu_percent}%` : "—"}
        bar={data ? <Bar value={data.cpu_percent} color={loadColor(data.cpu_percent)} /> : null}
      />

      {/* Memory */}
      <Row
        label={t("system.memory")}
        value={
          data
            ? `${data.memory_percent}% (${Math.round(data.memory_used_mb / 1024 * 10) / 10} / ${Math.round(data.memory_total_mb / 1024 * 10) / 10} GB)`
            : "—"
        }
        bar={data ? <Bar value={data.memory_percent} color={loadColor(data.memory_percent)} /> : null}
      />

      {/* Temperature */}
      <Row
        label={t("system.temperature")}
        value={
          data
            ? data.cpu_temp_celsius !== null
              ? `${data.cpu_temp_celsius} °C`
              : t("system.na")
            : "—"
        }
        icon={<Thermometer size={12} className="shrink-0" style={{ color: data?.cpu_temp_celsius != null ? tempColor(data.cpu_temp_celsius) : undefined }} />}
        bar={
          data?.cpu_temp_celsius != null
            ? <Bar value={(data.cpu_temp_celsius / 90) * 100} color={tempColor(data.cpu_temp_celsius)} />
            : null
        }
      />

      {/* Disk */}
      <Row
        label={t("system.disk")}
        value={
          data
            ? `${data.disk_percent}% (${data.disk_used_gb} / ${data.disk_total_gb} GB)`
            : "—"
        }
        icon={<HardDrive size={12} className="shrink-0 text-gray-400" />}
        bar={data ? <Bar value={data.disk_percent} color={loadColor(data.disk_percent)} /> : null}
      />

      {/* Camera FPS */}
      <Row
        label={t("system.cameraFps")}
        value={data ? (data.camera_fps !== null ? `${data.camera_fps} fps` : t("system.na")) : "—"}
        icon={<Camera size={12} className="shrink-0 text-gray-400" />}
      />
    </div>
  );
}

function Row({
  label,
  value,
  bar,
  icon,
}: {
  label: string;
  value: string;
  bar?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          {icon}
          {label}
        </span>
        <span className="text-xs font-mono text-white">{value}</span>
      </div>
      {bar}
    </div>
  );
}
