// All shared TypeScript types — mirrors backend Pydantic schemas

export type SessionStatus = "pending" | "active" | "paused" | "ended";
export type SessionMode = "freeplay" | "turnbased" | "timed";
export type DetectionStatus = "pending" | "confirmed" | "rejected";

export interface Player {
  id: number;
  name: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  player_id: number;
  player_name: string;
  total_score: number;
  sessions_played: number;
  shots_fired: number;
  shots_confirmed: number;
  accuracy: number;
  best_session_score: number | null;
}

export interface SessionPlayer {
  id: number;
  player_id: number;
  player: Player;
  turn_order: number;
  score: number;
  shots_fired: number;
  is_active: boolean;
}

export interface Session {
  id: number;
  name: string | null;
  status: SessionStatus;
  mode: SessionMode;
  baseline_path: string | null;
  notes: string | null;
  created_at: string;
  ended_at: string | null;
  session_players: SessionPlayer[];
}

export interface Detection {
  id: number;
  session_id: number;
  player_id: number | null;
  x: number;  // normalised 0–1
  y: number;  // normalised 0–1
  radius: number;  // normalised
  confidence: number;  // 0–1
  status: DetectionStatus;
  frame_path: string | null;
  annotated_path: string | null;
  detected_at: string;
  updated_at: string;
}

export interface Score {
  id: number;
  session_id: number;
  player_id: number;
  detection_id: number | null;
  points: number;
  zone: string | null;
  created_at: string;
}

export interface HighscoreEntry {
  rank: number;
  player_id: number;
  player_name: string;
  avatar_color: string;
  total_score: number;
  sessions_played: number;
  accuracy: number;
  best_session_score: number | null;
}

export interface CalibrationProfile {
  id: number;
  name: string;
  corners_json: string | null;
  perspective_matrix: string | null;
  crop_rect_json: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CameraStatus {
  available: boolean;
  fps: number;
  width: number;
  height: number;
  demo_mode: boolean;
  backend: string;
  focus_supported: boolean;
  focus_mode: string;
  focus_requested_mode: string;
}

export interface AppSettings {
  [key: string]: number | boolean | string;
}

// WebSocket event types
export type WSEventType =
  | "detection_new"
  | "detection_updated"
  | "baseline_reset"
  | "player_switched"
  | "session_started"
  | "session_ended"
  | "camera_status"
  | "pong";

export interface WSEvent {
  type: WSEventType;
  data: Record<string, unknown>;
}
