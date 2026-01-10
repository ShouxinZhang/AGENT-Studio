from __future__ import annotations

from typing import Any, Dict, Optional
import random

from . import rules

Direction = rules.Direction
SnakeState = rules.SnakeState


class SnakeEnvironment:
    """Simple Snake environment.

    - Discrete actions: 0=Up, 1=Right, 2=Down, 3=Left, -1=No-op
    - Step advances one tick.
    - Reward: -0.1 per step, +1 on eating, -10 on losing, +100 on winning
    - Done: collision with wall or self (configurable)
    """

    def __init__(
        self,
        grid_w: int = 15,
        grid_h: int = 15,
        seed: Optional[int] = None,
        allow_180: bool = False,
        wrap_walls: bool = False,
        die_on_self_collision: bool = True,
    ):
        self.grid_w = grid_w
        self.grid_h = grid_h
        self.allow_180 = allow_180
        self.wrap_walls = wrap_walls
        self.die_on_self_collision = die_on_self_collision
        self._rng = random.Random(seed)
        self._done = False
        self._truncated = False
        self._state: Optional[SnakeState] = None

    def reset(self) -> Dict[str, Any]:
        state = rules.reset_state(self.grid_w, self.grid_h, self._rng)
        self._done = False
        self._truncated = False
        self._state = state
        return self._to_state_dict(reward=0.0)

    def step(self, action: int) -> Dict[str, Any]:
        if self._state is None:
            return self.reset()
        if self._done or self._truncated:
            return self.reset()

        next_state, reward, done, _info = rules.step_state(
            self._state,
            action,
            self._rng,
            allow_180=self.allow_180,
            wrap_walls=self.wrap_walls,
            die_on_self_collision=self.die_on_self_collision,
            spawn_mode="random",
        )
        self._state = next_state
        self._done = done
        return self._to_state_dict(reward=reward)

    def close(self) -> None:
        return

    def get_empty_cells(self):
        if self._state is None:
            return []
        return rules.empty_cells(self._state)

    def _to_state_dict(self, reward: float) -> Dict[str, Any]:
        assert self._state is not None

        observation = {
            "grid": {"w": self._state.grid_w, "h": self._state.grid_h},
            "snake": [[x, y] for (x, y) in self._state.snake],
            "food": [self._state.food[0], self._state.food[1]] if self._state.food is not None else [-1, -1],
            "direction": self._state.direction,
            "score": self._state.score,
        }

        scene = {
            "grid": {"w": self._state.grid_w, "h": self._state.grid_h},
            "snake": observation["snake"],
            "food": observation["food"],
            "score": self._state.score,
            "direction": self._state.direction,
        }

        return {
            "observation": observation,
            "reward": reward,
            "done": self._done,
            "truncated": self._truncated,
            "info": {"score": self._state.score},
            "render": {"mode": "scene", "scene": scene},
        }
