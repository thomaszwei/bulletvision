"""Initial schema — all tables.

Revision ID: 0001
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "players",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("avatar_color", sa.String(20), nullable=False, server_default="#6366f1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("mode", sa.String(20), nullable=False, server_default="freeplay"),
        sa.Column("baseline_path", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("settings_json", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "session_players",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("session_id", sa.Integer, sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("player_id", sa.Integer, sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("turn_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("shots_fired", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("joined_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "detections",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("session_id", sa.Integer, sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("player_id", sa.Integer, sa.ForeignKey("players.id", ondelete="SET NULL"), nullable=True),
        sa.Column("x", sa.Float, nullable=False),
        sa.Column("y", sa.Float, nullable=False),
        sa.Column("radius", sa.Float, nullable=False),
        sa.Column("confidence", sa.Float, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("frame_path", sa.String(500), nullable=True),
        sa.Column("annotated_path", sa.String(500), nullable=True),
        sa.Column("detected_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "scores",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("session_id", sa.Integer, sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("player_id", sa.Integer, sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("detection_id", sa.Integer, sa.ForeignKey("detections.id", ondelete="SET NULL"), nullable=True),
        sa.Column("points", sa.Integer, nullable=False, server_default="10"),
        sa.Column("zone", sa.String(20), nullable=True, server_default="none"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "settings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("key", sa.String(100), unique=True, nullable=False),
        sa.Column("value", sa.Text, nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "calibration_profiles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("corners_json", sa.Text, nullable=True),
        sa.Column("perspective_matrix", sa.Text, nullable=True),
        sa.Column("crop_rect_json", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "snapshots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("session_id", sa.Integer, sa.ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("detection_id", sa.Integer, sa.ForeignKey("detections.id", ondelete="SET NULL"), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("label", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("player_id", sa.Integer, sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("achievement_type", sa.String(100), nullable=False),
        sa.Column("data_json", sa.Text, nullable=True),
        sa.Column("earned_at", sa.DateTime, server_default=sa.func.now()),
    )

    # Indexes for common query patterns
    op.create_index("ix_detections_session_id", "detections", ["session_id"])
    op.create_index("ix_scores_session_id", "scores", ["session_id"])
    op.create_index("ix_scores_player_id", "scores", ["player_id"])
    op.create_index("ix_settings_key", "settings", ["key"])


def downgrade() -> None:
    op.drop_table("achievements")
    op.drop_table("snapshots")
    op.drop_table("calibration_profiles")
    op.drop_table("settings")
    op.drop_table("scores")
    op.drop_table("detections")
    op.drop_table("session_players")
    op.drop_table("sessions")
    op.drop_table("players")
