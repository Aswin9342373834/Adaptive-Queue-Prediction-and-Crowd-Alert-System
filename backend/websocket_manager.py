"""
WebSocket Connection Manager for Real-Time Dashboard Broadcasting.
"""

from typing import List, Dict, Any
from fastapi import WebSocket
import json


class WebSocketManager:
    """
    Manages active WebSocket client connections and broadcasts live telemetry packets.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accepts and registers a new WebSocket client."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Removes a disconnected WebSocket client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Client disconnected. Total active clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """
        Broadcasts a JSON telemetry dictionary to all connected dashboard clients.
        Automatically cleans up broken connections.
        """
        if not self.active_connections:
            return

        payload = json.dumps(message)
        dead_connections: List[WebSocket] = []

        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)
