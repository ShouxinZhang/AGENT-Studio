from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import random


Direction = int  # 0: up, 1: right, 2: down, 3: left


@dataclass
class SnakeState:
    grid_w: int
    grid_h: int
    snake: List[Tuple[int, int]]  # head first
    food: Tuple[int, int]
    direction: Direction
    score: int


class SnakeEnvironment:
    """Simple Snake environment.

    - Discrete actions: 0=Up, 1=Right, 2=Down, 3=Left, -1=No-op
    - Step advances one tick.
    - Reward: +1 on eating food, else 0
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
        cx = self.grid_w // 2
        cy = self.grid_h // 2
        snake = [(cx, cy), (cx - 1, cy), (cx - 2, cy)]
        direction: Direction = 1  # right
        food = self._spawn_food(snake)
        self._done = False
        self._truncated = False
        self._state = SnakeState(
            grid_w=self.grid_w,
            grid_h=self.grid_h,
            snake=snake,
            food=food,
            direction=direction,
            score=0,
        )
        return self._to_state_dict(reward=0.0)

    def step(self, action: int) -> Dict[str, Any]:
        if self._state is None:
            return self.reset()
        if self._done or self._truncated:
            return self.reset()

        # Handle action (direction change)
        if action in (0, 1, 2, 3):
            if self.allow_180 or not self._is_opposite(action, self._state.direction):
                self._state.direction = action

        dx, dy = self._dir_delta(self._state.direction)
        head_x, head_y = self._state.snake[0]
        new_head = (head_x + dx, head_y + dy)

        reward = 0.0

        # Collision with wall
        if self.wrap_walls:
            new_head = (new_head[0] % self.grid_w, new_head[1] % self.grid_h)
        else:
            if not (0 <= new_head[0] < self.grid_w and 0 <= new_head[1] < self.grid_h):
                self._done = True
                return self._to_state_dict(reward=reward)

        # Determine eating after wall handling (important for wrap mode)
        will_eat = new_head == self._state.food

        # Collision with self
        # IMPORTANT: moving into the current tail position is allowed when not eating,
        # because the tail will move away on this tick.
        body_to_check = self._state.snake if will_eat else self._state.snake[:-1]
        if new_head in body_to_check:
            if self.die_on_self_collision:
                self._done = True
                return self._to_state_dict(reward=reward)

        # Move
        self._state.snake.insert(0, new_head)

        # If self-collision is non-lethal, "bite" cuts the tail.
        if not self.die_on_self_collision:
            try:
                dup_idx = self._state.snake[1:].index(new_head) + 1
                self._state.snake = self._state.snake[:dup_idx]
            except ValueError:
                pass

        if new_head == self._state.food:
            reward = 1.0
            self._state.score += 1
            self._state.food = self._spawn_food(self._state.snake)
        else:
            # remove tail
            self._state.snake.pop()

        return self._to_state_dict(reward=reward)

    def close(self) -> None:
        return

    def _spawn_food(self, snake: List[Tuple[int, int]]) -> Tuple[int, int]:
        occupied = set(snake)
        empty: List[Tuple[int, int]] = [
            (x, y)
            for y in range(self.grid_h)
            for x in range(self.grid_w)
            if (x, y) not in occupied
        ]
        if not empty:
            # No space left: treat as done
            self._done = True
            return (0, 0)
        return self._rng.choice(empty)

    @staticmethod
    def _is_opposite(a: Direction, b: Direction) -> bool:
        return (a == 0 and b == 2) or (a == 2 and b == 0) or (a == 1 and b == 3) or (a == 3 and b == 1)

    @staticmethod
    def _dir_delta(direction: Direction) -> Tuple[int, int]:
        if direction == 0:
            return (0, -1)
        if direction == 1:
            return (1, 0)
        if direction == 2:
            return (0, 1)
        return (-1, 0)

    def _to_state_dict(self, reward: float) -> Dict[str, Any]:
        assert self._state is not None

        observation = {
            "grid": {"w": self._state.grid_w, "h": self._state.grid_h},
            "snake": [[x, y] for (x, y) in self._state.snake],
            "food": [self._state.food[0], self._state.food[1]],
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
