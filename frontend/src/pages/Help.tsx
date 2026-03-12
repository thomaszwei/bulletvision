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
              <li key={i}><strong>{m.name}</strong> — {m.desc}</li>
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

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "setup",
    title: "Setup & Installation",
    content: (
      <div className="space-y-3 text-sm text-gray-300">
        <p><strong>Requirements:</strong> Raspberry Pi 4 (2 GB+ RAM), Pi Camera Module v2 or HQ, Docker + Docker Compose v2, a white/light-coloured target.</p>
        <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
          <li>Clone the repository onto your Pi.</li>
          <li>Copy <code className="bg-surface-elevated px-1 rounded">.env.example</code> to <code className="bg-surface-elevated px-1 rounded">.env</code> and edit as needed.</li>
          <li>Connect the Pi Camera or USB webcam.</li>
          <li>Run <code className="bg-surface-elevated px-1 rounded">docker compose up --build -d</code>.</li>
          <li>Open <code className="bg-surface-elevated px-1 rounded">http://&lt;pi-ip&gt;</code> in any browser on the same network.</li>
        </ol>
        <p><strong>Demo mode:</strong> set <code className="bg-surface-elevated px-1 rounded">CAMERA_BACKEND=demo</code> in <code>.env</code> to test without a camera — synthetic frames with fake bullet holes are generated.</p>
      </div>
    ),
  },
  {
    id: "detection",
    title: "How Detection Works",
    content: (
      <div className="space-y-3 text-sm text-gray-300">
        <p>BulletVision uses <strong>frame differencing</strong>:</p>
        <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
          <li><strong>Baseline capture</strong> — you take a clean snapshot of the target before shooting.</li>
          <li>The CV pipeline continuously subtracts the baseline from new frames.</li>
          <li>Dark circular regions that appear in the diff are candidates for bullet holes.</li>
          <li>Each candidate is scored by circularity, darkness and area. Only those above the <em>Confidence Threshold</em> are reported.</li>
          <li>Reported detections appear as amber rings on the live feed and in the Pending list.</li>
          <li>You <strong>confirm</strong> (✓) or <strong>reject</strong> (✕) each detection.</li>
        </ol>
        <p>All coordinates are stored normalised (0–1) so detections work at any display resolution.</p>
      </div>
    ),
  },
  {
    id: "scoring",
    title: "Scoring System",
    content: (
      <div className="space-y-3 text-sm text-gray-300">
        <p>Points are awarded automatically when a detection is <strong>confirmed</strong>:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>Base points per hit (configurable in Settings, default 10).</li>
          <li>Zone multiplier applied for centre hits (bull's-eye).</li>
          <li>Session leaderboard updates live via WebSocket.</li>
        </ul>
        <p>Milestones trigger <strong>achievements</strong>: First Hit, 5 Hits, 10 Hits, 25 Hits, 50 Hits, 100 Hits.</p>
        <p>All-time rankings are visible on the Highscores page.</p>
      </div>
    ),
  },
  {
    id: "multiplayer",
    title: "Multiplayer & Modes",
    content: (
      <div className="space-y-3 text-sm text-gray-300">
        <p>Three session modes:</p>
        <ul className="list-disc list-inside space-y-1.5 text-gray-400">
          <li><strong>Freeplay</strong> — All players shoot simultaneously. Any confirmed hit is credited to the active player.</li>
          <li><strong>Turn-Based</strong> — Players take turns. Use "Next Player" in the controls bar to rotate. Hits are automatically credited to the current active player.</li>
          <li><strong>Timed Rounds</strong> — Each player gets a fixed time window (future feature).</li>
        </ul>
        <p>Add players on the <a href="/players" className="text-brand hover:underline">Players page</a> before creating a session. You can add up to 8 players per session.</p>
      </div>
    ),
  },
  {
    id: "camera",
    title: "Camera Tips",
    content: (
      <div className="space-y-3 text-sm text-gray-300">
        <p>For best detection results:</p>
        <ul className="list-disc list-inside space-y-1.5 text-gray-400">
          <li>Mount the camera <strong>perpendicular</strong> to the target (facing straight on). Angled shots reduce detection accuracy.</li>
          <li>Use <strong>consistent, diffuse lighting</strong>. Avoid direct sunlight which creates shadows that change between frames.</li>
          <li>Use a <strong>plain white or light-coloured</strong> target. Dark or patterned targets reduce contrast.</li>
          <li>Don't move the camera or target after capturing the baseline — even small shifts cause false positives.</li>
          <li>If you get too many false positives, increase the <em>Confidence Threshold</em> in Settings.</li>
          <li>Use the <strong>Calibration</strong> page to correct perspective if the camera cannot be mounted straight on.</li>
        </ul>
        <p>Supported camera backends: <code className="bg-surface-elevated px-1 rounded">v4l2</code> (USB / CSI via V4L2), <code className="bg-surface-elevated px-1 rounded">picamera2</code> (Pi Camera native), <code className="bg-surface-elevated px-1 rounded">demo</code>.</p>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    content: (
      <div className="space-y-4 text-sm text-gray-300">
        <TroubleItem
          problem="Camera not detected"
          solution="Check that the camera device is passed through in docker-compose.yml (/dev/video0). Run `v4l2-ctl --list-devices` on the Pi to verify the device path. Try setting CAMERA_BACKEND=demo to confirm the app is working."
        />
        <TroubleItem
          problem="Too many false positives"
          solution="Increase the Confidence Threshold to 0.75–0.90 in Settings. Also ensure the baseline was captured in stable lighting before any shooting."
        />
        <TroubleItem
          problem="Detections missing real holes"
          solution="Decrease the Confidence Threshold (try 0.50). Make sure lighting hasn't changed since the baseline was captured. Try Reset Baseline then re-shoot."
        />
        <TroubleItem
          problem="Live feed not showing"
          solution="Check that the backend container is running: `docker compose ps`. Inspect logs: `docker compose logs backend`. Verify camera permissions with `ls -l /dev/video*`."
        />
        <TroubleItem
          problem="Scores not updating"
          solution="Verify the WebSocket connection is open (check browser DevTools → Network → WS). If using a reverse proxy, ensure it's forwarding the Upgrade header."
        />
        <TroubleItem
          problem="High CPU on Pi"
          solution="Lower Detection FPS to 1–2 in Settings. Detection runs at 640×480 by default; lower Camera Width/Height if needed. Ensure ORB alignment is disabled (it is by default)."
        />
      </div>
    ),
  },
];

export default function Help() {
  const [open, setOpen] = useState<string | null>("setup");

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Help</h1>
        <p className="text-gray-500 text-sm">BulletVision user guide</p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <button
              className="w-full flex items-center gap-3 text-left"
              onClick={() => setOpen(open === s.id ? null : s.id)}
            >
              <span className="shrink-0 text-gray-500">
                {open === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <span className="font-semibold">{s.title}</span>
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
        <p><strong>BulletVision</strong> — self-hosted Raspberry Pi bullet hole detection.</p>
        <p>Stack: FastAPI · OpenCV · React · SQLite · Docker</p>
        <p>Run <code className="bg-surface-elevated px-1 rounded">docker compose logs -f</code> to view live logs.</p>
      </div>
    </div>
  );
}

function TroubleItem({ problem, solution }: { problem: string; solution: string }) {
  return (
    <div>
      <p className="font-semibold text-white">❓ {problem}</p>
      <p className="text-gray-400 mt-0.5">{solution}</p>
    </div>
  );
}
