"""
WebSocket connection manager.
Maintains a set of active connections per session_id and broadcasts events.
"""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self) -> None:
        # session_id → set of active WebSocket connections
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, session_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[session_id].add(ws)
        logger.info(f"WS connected: session={session_id} total={len(self._connections[session_id])}")

    def disconnect(self, session_id: int, ws: WebSocket) -> None:
        self._connections[session_id].discard(ws)
        if not self._connections[session_id]:
            del self._connections[session_id]
        logger.info(f"WS disconnected: session={session_id}")

    async def broadcast_to_session(self, session_id: int, event: dict) -> None:
        """Send an event dict to all connections subscribed to session_id."""
        conns = list(self._connections.get(session_id, set()))
        if not conns:
            return
        message = json.dumps(event)
        dead: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)

    async def send_to(self, ws: WebSocket, event: dict) -> None:
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            pass


ws_manager = WebSocketManager()
