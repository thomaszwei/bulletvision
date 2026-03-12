import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Help() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>("setup");

  type SectionKey = "setup" | "detection" | "scoring" | "multiplayer" | "camera" | "troubleshooting";

  const sections: { id: SectionKey; content: React.ReactNode }[] = [
    {
      id: "setup",
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p><strong>{t("help.sections.setup.requirements")}</strong></p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
            {(t("help.sections.setup.steps", { returnObjects: true }) as string[]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p>{t("help.sections.setup.demo")}</p>
        </div>
      ),
    },
    {
      id: "detection",
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>{t("help.sections.detection.intro")}</p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
            {(t("help.sections.detection.steps", { returnObjects: true }) as string[]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p>{t("help.sections.detection.note")}</p>
        </div>
      ),
    },
    {
      id: "scoring",
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>{t("help.sections.scoring.intro")}</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            {(t("help.sections.scoring.items", { returnObjects: true }) as string[]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p>{t("help.sections.scoring.milestones")}</p>
          <p>{t("help.sections.scoring.highscores")}</p>
        </div>
      ),
    },
    {
      id: "multiplayer",
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>{t("help.sections.multiplayer.intro")}</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            {(t("help.sections.multiplayer.modes", { returnObjects: true }) as { name: string; desc: string }[]).map((m, i) => (
              <li key={i}><strong>{m.name}</strong> â€” {m.desc}</li>
            ))}
          </ul>
          <p>{t("help.sections.multiplayer.hint")}</p>
        </div>
      ),
    },
    {
      id: "camera",
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>{t("help.sections.camera.intro")}</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            {(t("help.sections.camera.tips", { returnObjects: true }) as string[]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p>{t("help.sections.camera.backends")}</p>
        </div>
      ),
    },
    {
      id: "troubleshooting",
      content: (
        <div className="space-y-4 text-sm text-gray-300">
          {(t("help.sections.troubleshooting.items", { returnObjects: true }) as { problem: string; solution: string }[]).map((item, i) => (
            <div key={i}>
              <p className="font-semibold text-white mb-1">{item.problem}</p>
              <p className="text-gray-400">{item.solution}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("help.title")}</h1>
        <p className="text-gray-500 text-sm">{t("help.subtitle")}</p>
      </div>

      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <button
              className="w-full flex items-center gap-3 text-left"
              onClick={() => setOpen(open === s.id ? null : s.id)}
            >
              <span className="shrink-0 text-gray-500">
                {open === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <span className="font-semibold">{t(`help.sections.${s.id}.title`)}</span>
            </button>
            {open === s.id && (
              <div className="mt-4 pt-4 border-t border-surface-border animate-fade-in">
                {s.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card text-xs text-gray-500 space-y-1">
        <p><strong>{t("help.footerDesc")}</strong></p>
        <p>{t("help.footerStack")}</p>
        <p>{t("help.footerLogs")}</p>
      </div>
    </div>
  );
}
