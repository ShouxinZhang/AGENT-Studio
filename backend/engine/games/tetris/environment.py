"""
Tetris Environment for Agent Studio

Classic Tetris game with discrete actions:
- 0: Move Left
- 1: Move Right
- 2: Rotate Clockwise
- 3: Rotate Counter-Clockwise
- 4: Soft Drop (move down faster)
- 5: Hard Drop (instant drop)
- -1: No-op (just tick)

Rewards:
- Line clear: 100 * lines^2 (1=100, 2=400, 3=900, 4=1600)
- Soft drop: 1 per cell
- Hard drop: 2 per cell
- Game over penalty: -100
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import random

# Tetromino shapes (each rotation state)
# Represented as list of (x, y) offsets from pivot
TETROMINOES = {
    'I': [
        [(0, 0), (1, 0), (2, 0), (3, 0)],
        [(1, -1), (1, 0), (1, 1), (1, 2)],
        [(0, 1), (1, 1), (2, 1), (3, 1)],
        [(2, -1), (2, 0), (2, 1), (2, 2)],
    ],
    'O': [
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0, 0), (1, 0), (0, 1), (1, 1)],
    ],
    'T': [
        [(0, 0), (1, 0), (2, 0), (1, 1)],
        [(1, -1), (1, 0), (1, 1), (0, 0)],
        [(0, 1), (1, 1), (2, 1), (1, 0)],
        [(1, -1), (1, 0), (1, 1), (2, 0)],
    ],
    'S': [
        [(1, 0), (2, 0), (0, 1), (1, 1)],
        [(0, -1), (0, 0), (1, 0), (1, 1)],
        [(1, 0), (2, 0), (0, 1), (1, 1)],
        [(0, -1), (0, 0), (1, 0), (1, 1)],
    ],
    'Z': [
        [(0, 0), (1, 0), (1, 1), (2, 1)],
        [(1, -1), (1, 0), (0, 0), (0, 1)],
        [(0, 0), (1, 0), (1, 1), (2, 1)],
        [(1, -1), (1, 0), (0, 0), (0, 1)],
    ],
    'J': [
        [(0, 0), (0, 1), (1, 1), (2, 1)],
        [(1, -1), (1, 0), (1, 1), (0, 1)],
        [(0, 0), (1, 0), (2, 0), (2, 1)],
        [(1, -1), (1, 0), (1, 1), (2, -1)],
    ],
    'L': [
        [(2, 0), (0, 1), (1, 1), (2, 1)],
        [(0, -1), (1, -1), (1, 0), (1, 1)],
        [(0, 0), (1, 0), (2, 0), (0, 1)],
        [(1, -1), (1, 0), (1, 1), (2, 1)],
    ],
}

PIECE_COLORS = {
    'I': 0,  # Cyan
    'O': 1,  # Yellow
    'T': 2,  # Purple
    'S': 3,  # Green
    'Z': 4,  # Red
    'J': 5,  # Blue
    'L': 6,  # Orange
}

PIECE_LIST = list(TETROMINOES.keys())


@dataclass
class TetrisState:
    grid_w: int
    grid_h: int
    board: List[List[int]]  # -1 = empty, 0-6 = piece color
    current_piece: str
    current_rotation: int
    current_x: int
    current_y: int
    next_piece: str
    score: int
    lines_cleared: int
    level: int
    hold_piece: Optional[str] = None
    can_hold: bool = True


class TetrisEnvironment:
    """Tetris game environment."""

    def __init__(
        self,
        grid_w: int = 10,
        grid_h: int = 20,
        seed: Optional[int] = None,
        start_level: int = 1,
    ):
        self.grid_w = grid_w
        self.grid_h = grid_h
        self.start_level = start_level
        self._rng = random.Random(seed)
        self._done = False
        self._truncated = False
        self._state: Optional[TetrisState] = None
        self._bag: List[str] = []

    def _get_next_piece(self) -> str:
        """7-bag randomizer: shuffle all 7 pieces, use them, repeat."""
        if not self._bag:
            self._bag = PIECE_LIST.copy()
            self._rng.shuffle(self._bag)
        return self._bag.pop()

    def reset(self) -> Dict[str, Any]:
        self._done = False
        self._truncated = False
        self._bag = []

        board = [[-1 for _ in range(self.grid_w)] for _ in range(self.grid_h)]
        current_piece = self._get_next_piece()
        next_piece = self._get_next_piece()

        self._state = TetrisState(
            grid_w=self.grid_w,
            grid_h=self.grid_h,
            board=board,
            current_piece=current_piece,
            current_rotation=0,
            current_x=self.grid_w // 2 - 1,
            current_y=0,
            next_piece=next_piece,
            score=0,
            lines_cleared=0,
            level=self.start_level,
            hold_piece=None,
            can_hold=True,
        )

        # Check if spawn position is valid
        if not self._is_valid_position():
            self._done = True

        return self._to_state_dict(reward=0.0)

    def step(self, action: int) -> Dict[str, Any]:
        if self._state is None:
            return self.reset()
        if self._done or self._truncated:
            return self.reset()

        reward = 0.0

        # Process action
        if action == 0:  # Move Left
            self._move(-1, 0)
        elif action == 1:  # Move Right
            self._move(1, 0)
        elif action == 2:  # Rotate CW
            self._rotate(1)
        elif action == 3:  # Rotate CCW
            self._rotate(-1)
        elif action == 4:  # Soft Drop
            if self._move(0, 1):
                reward += 1
        elif action == 5:  # Hard Drop
            drop_distance = 0
            while self._move(0, 1):
                drop_distance += 1
            reward += drop_distance * 2
            # Lock piece immediately after hard drop
            reward += self._lock_piece()
            return self._to_state_dict(reward=reward)
        # action == -1 or other: No-op, just tick

        # Gravity: try to move down
        if not self._move(0, 1):
            # Can't move down, lock the piece
            reward += self._lock_piece()

        return self._to_state_dict(reward=reward)

    def _get_piece_cells(
        self,
        piece: Optional[str] = None,
        rotation: Optional[int] = None,
        x: Optional[int] = None,
        y: Optional[int] = None
    ) -> List[Tuple[int, int]]:
        """Get absolute cell positions for a piece."""
        assert self._state is not None
        if piece is None:
            piece = self._state.current_piece
        if rotation is None:
            rotation = self._state.current_rotation
        if x is None:
            x = self._state.current_x
        if y is None:
            y = self._state.current_y

        shape = TETROMINOES[piece][rotation % 4]
        return [(x + dx, y + dy) for dx, dy in shape]

    def _is_valid_position(
        self,
        piece: Optional[str] = None,
        rotation: Optional[int] = None,
        x: Optional[int] = None,
        y: Optional[int] = None
    ) -> bool:
        """Check if piece position is valid (no collision)."""
        assert self._state is not None
        cells = self._get_piece_cells(piece, rotation, x, y)
        for cx, cy in cells:
            if cx < 0 or cx >= self.grid_w:
                return False
            if cy < 0 or cy >= self.grid_h:
                return False
            if self._state.board[cy][cx] != -1:
                return False
        return True

    def _move(self, dx: int, dy: int) -> bool:
        """Try to move piece. Returns True if successful."""
        assert self._state is not None
        new_x = self._state.current_x + dx
        new_y = self._state.current_y + dy
        if self._is_valid_position(x=new_x, y=new_y):
            self._state.current_x = new_x
            self._state.current_y = new_y
            return True
        return False

    def _rotate(self, direction: int) -> bool:
        """Try to rotate piece with wall kicks. Returns True if successful."""
        assert self._state is not None
        new_rotation = (self._state.current_rotation + direction) % 4

        # Try basic rotation
        if self._is_valid_position(rotation=new_rotation):
            self._state.current_rotation = new_rotation
            return True

        # Wall kick offsets to try
        kicks = [(-1, 0), (1, 0), (0, -1), (-1, -1), (1, -1), (-2, 0), (2, 0)]
        for kx, ky in kicks:
            if self._is_valid_position(
                rotation=new_rotation,
                x=self._state.current_x + kx,
                y=self._state.current_y + ky
            ):
                self._state.current_rotation = new_rotation
                self._state.current_x += kx
                self._state.current_y += ky
                return True

        return False

    def _lock_piece(self) -> float:
        """Lock current piece to board and spawn new piece. Returns reward."""
        assert self._state is not None
        reward = 0.0
        cells = self._get_piece_cells()
        color = PIECE_COLORS[self._state.current_piece]

        # Place piece on board
        for cx, cy in cells:
            if 0 <= cy < self.grid_h and 0 <= cx < self.grid_w:
                self._state.board[cy][cx] = color

        # Clear completed lines
        lines_to_clear = []
        for y in range(self.grid_h):
            if all(cell != -1 for cell in self._state.board[y]):
                lines_to_clear.append(y)

        if lines_to_clear:
            # Remove cleared lines
            for y in sorted(lines_to_clear, reverse=True):
                del self._state.board[y]
                self._state.board.insert(0, [-1] * self.grid_w)

            num_lines = len(lines_to_clear)
            self._state.lines_cleared += num_lines

            # Scoring: 100 * lines^2 * level
            line_reward = 100 * (num_lines ** 2) * self._state.level
            reward += line_reward
            self._state.score += int(line_reward)

            # Level up every 10 lines
            self._state.level = self.start_level + self._state.lines_cleared // 10

        # Spawn new piece
        self._state.current_piece = self._state.next_piece
        self._state.next_piece = self._get_next_piece()
        self._state.current_rotation = 0
        self._state.current_x = self.grid_w // 2 - 1
        self._state.current_y = 0
        self._state.can_hold = True

        # Check game over
        if not self._is_valid_position():
            self._done = True
            reward -= 100  # Game over penalty

        return reward

    def close(self) -> None:
        pass

    def _to_state_dict(self, reward: float) -> Dict[str, Any]:
        assert self._state is not None

        # Build board with current piece overlaid
        display_board = [row.copy() for row in self._state.board]
        cells = self._get_piece_cells()
        color = PIECE_COLORS[self._state.current_piece]
        for cx, cy in cells:
            if 0 <= cy < self.grid_h and 0 <= cx < self.grid_w:
                display_board[cy][cx] = color

        # Calculate ghost piece (where piece would land)
        ghost_y = self._state.current_y
        while self._is_valid_position(y=ghost_y + 1):
            ghost_y += 1
        ghost_cells = self._get_piece_cells(y=ghost_y)

        # Next piece preview
        next_cells = [(dx, dy) for dx, dy in TETROMINOES[self._state.next_piece][0]]

        scene = {
            "grid": {"w": self._state.grid_w, "h": self._state.grid_h},
            "board": display_board,
            "currentPiece": {
                "type": self._state.current_piece,
                "color": color,
                "cells": [[cx, cy] for cx, cy in cells],
                "x": self._state.current_x,
                "y": self._state.current_y,
                "rotation": self._state.current_rotation,
            },
            "ghostCells": [[cx, cy] for cx, cy in ghost_cells],
            "nextPiece": {
                "type": self._state.next_piece,
                "color": PIECE_COLORS[self._state.next_piece],
                "cells": next_cells,
            },
            "holdPiece": self._state.hold_piece,
            "score": self._state.score,
            "lines": self._state.lines_cleared,
            "level": self._state.level,
        }

        return {
            "observation": scene,
            "reward": reward,
            "done": self._done,
            "truncated": self._truncated,
            "info": {
                "score": self._state.score,
                "lines": self._state.lines_cleared,
                "level": self._state.level,
            },
            "render": {"mode": "scene", "scene": scene},
        }
