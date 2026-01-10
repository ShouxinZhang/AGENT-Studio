"""Games module - each game is a separate submodule."""
from .snake import SnakeEnvironment
from .tetris import TetrisEnvironment
from .doudizhu import DoudizhuEnvironment

__all__ = ["SnakeEnvironment", "TetrisEnvironment", "DoudizhuEnvironment"]
