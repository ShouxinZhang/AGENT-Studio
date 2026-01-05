from typing import Any, Dict, Optional
from .gym_wrapper import GymEnvironment
from .games.snake import SnakeEnvironment
from .games.tetris import TetrisEnvironment
import uuid

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Any] = {}

    def create_session(self, env_id: str, config: Optional[Dict[str, Any]] = None) -> str:
        session_id = str(uuid.uuid4())
        config = config or {}
        match env_id:
            case "Snake":
                grid_w = config.get("grid_w", 15)
                grid_h = config.get("grid_h", 15)
                allow_180 = config.get("allow_180", False)
                wrap_walls = config.get("wrap_walls", False)
                die_on_self_collision = config.get("die_on_self_collision", True)
                self.sessions[session_id] = SnakeEnvironment(
                    grid_w=grid_w,
                    grid_h=grid_h,
                    allow_180=allow_180,
                    wrap_walls=wrap_walls,
                    die_on_self_collision=die_on_self_collision,
                )
            case "Tetris":
                grid_w = config.get("grid_w", 10)
                grid_h = config.get("grid_h", 20)
                start_level = config.get("start_level", 1)
                self.sessions[session_id] = TetrisEnvironment(
                    grid_w=grid_w,
                    grid_h=grid_h,
                    start_level=start_level,
                )
            case _:
                self.sessions[session_id] = GymEnvironment(env_id)
        return session_id

    def get_session(self, session_id: str):
        return self.sessions.get(session_id)

    def delete_session(self, session_id: str):
        if session_id in self.sessions:
            try:
                self.sessions[session_id].close()
            except Exception:
                pass
            del self.sessions[session_id]

# Global instance
session_manager = SessionManager()
