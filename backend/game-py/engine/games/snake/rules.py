from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Dict, List, Literal, Optional, Sequence, Tuple
import random


Direction = int  # 0: up, 1: right, 2: down, 3: left
SpawnMode = Literal["random", "defer"]


@dataclass(frozen=True)
class SnakeState:
    grid_w: int
    grid_h: int
    snake: Tuple[Tuple[int, int], ...]  # head first
    food: Optional[Tuple[int, int]]
    direction: Direction
    score: int
    steps_since_eat: int


def dir_delta(direction: Direction) -> Tuple[int, int]:
    if direction == 0:
        return (0, -1)
    if direction == 1:
        return (1, 0)
    if direction == 2:
        return (0, 1)
    return (-1, 0)


def is_opposite(a: Direction, b: Direction) -> bool:
    return (a == 0 and b == 2) or (a == 2 and b == 0) or (a == 1 and b == 3) or (a == 3 and b == 1)


def empty_cells(state: SnakeState) -> List[Tuple[int, int]]:
    occupied = set(state.snake)
    return [
        (x, y)
        for y in range(state.grid_h)
        for x in range(state.grid_w)
        if (x, y) not in occupied
    ]


def reset_state(grid_w: int, grid_h: int, rng: random.Random) -> SnakeState:
    cx = grid_w // 2
    cy = grid_h // 2
    snake: Tuple[Tuple[int, int], ...] = ((cx, cy), (cx - 1, cy), (cx - 2, cy))
    direction: Direction = 1  # right
    state = SnakeState(
        grid_w=grid_w,
        grid_h=grid_h,
        snake=snake,
        food=None,
        direction=direction,
        score=0,
        steps_since_eat=0,
    )
    food = spawn_food(state, rng)
    return replace(state, food=food)


def spawn_food(state: SnakeState, rng: random.Random) -> Optional[Tuple[int, int]]:
    cells = empty_cells(state)
    if not cells:
        return None
    return rng.choice(cells)


def set_food(state: SnakeState, food: Optional[Tuple[int, int]]) -> SnakeState:
    if food is None:
        return replace(state, food=None)

    if food in state.snake:
        raise ValueError("Food cannot be placed on snake body")
    if not (0 <= food[0] < state.grid_w and 0 <= food[1] < state.grid_h):
        raise ValueError("Food out of bounds")
    return replace(state, food=food)


def legal_moves(state: SnakeState, allow_180: bool = False) -> List[int]:
    # Disallow 180-degree turns by default.
    if allow_180:
        return [0, 1, 2, 3]

    d = state.direction
    if d == 0:
        return [0, 1, 3]
    if d == 1:
        return [0, 1, 2]
    if d == 2:
        return [1, 2, 3]
    return [0, 2, 3]


def step_state(
    state: SnakeState,
    action: int,
    rng: random.Random,
    *,
    allow_180: bool = False,
    wrap_walls: bool = False,
    die_on_self_collision: bool = True,
    spawn_mode: SpawnMode = "random",
) -> Tuple[SnakeState, float, bool, Dict[str, object]]:
    """Pure transition function for Snake.

    Rewards:
      - +1 for eating
      - -10 for losing
            - +100 for winning (fill board)

    spawn_mode:
      - "random": place new food immediately after eating.
      - "defer": after eating, set food=None and return pending spawn info.
    """

    # Direction update
    new_direction = state.direction
    if action in (0, 1, 2, 3):
        if allow_180 or not is_opposite(action, state.direction):
            new_direction = action

    dx, dy = dir_delta(new_direction)
    head_x, head_y = state.snake[0]
    new_head = (head_x + dx, head_y + dy)

    # Wall collision
    if wrap_walls:
        new_head = (new_head[0] % state.grid_w, new_head[1] % state.grid_h)
    else:
        if not (0 <= new_head[0] < state.grid_w and 0 <= new_head[1] < state.grid_h):
            return state, -10.0, True, {"eaten": False, "reason": "wall"}

    will_eat = state.food is not None and new_head == state.food

    # Self collision: moving into current tail is allowed if not eating.
    body_to_check: Sequence[Tuple[int, int]] = state.snake if will_eat else state.snake[:-1]
    if new_head in body_to_check:
        if die_on_self_collision:
            return state, -10.0, True, {"eaten": False, "reason": "self"}

    snake_list = list(state.snake)
    snake_list.insert(0, new_head)

    # Non-lethal self-collision: bite cuts tail.
    if not die_on_self_collision:
        try:
            dup_idx = snake_list[1:].index(new_head) + 1
            snake_list = snake_list[:dup_idx]
        except ValueError:
            pass

    reward = -0.1
    new_score = state.score
    new_food: Optional[Tuple[int, int]] = state.food
    steps_since_eat = state.steps_since_eat + 1
    info: Dict[str, object] = {"eaten": False}

    if steps_since_eat >= 200:
        return state, -100.0, True, {"eaten": False, "reason": "starvation"}

    if will_eat:
        reward = 10.0
        new_score = state.score + 1
        steps_since_eat = 0
        info["eaten"] = True

        # Win condition: fill board
        if len(snake_list) == state.grid_w * state.grid_h:
            won_state = SnakeState(
                grid_w=state.grid_w,
                grid_h=state.grid_h,
                snake=tuple(snake_list),
                food=None,
                direction=new_direction,
                score=new_score,
                steps_since_eat=steps_since_eat,
            )
            return won_state, 100.0, True, {"eaten": True, "won": True}

        # Spawn next food
        if spawn_mode == "random":
            tmp_state = SnakeState(
                grid_w=state.grid_w,
                grid_h=state.grid_h,
                snake=tuple(snake_list),
                food=None,
                direction=new_direction,
                score=new_score,
                steps_since_eat=steps_since_eat,
            )
            new_food = spawn_food(tmp_state, rng)
            if new_food is None:
                return tmp_state, 100.0, True, {"eaten": True, "won": True}
        else:
            new_food = None
            tmp_state = SnakeState(
                grid_w=state.grid_w,
                grid_h=state.grid_h,
                snake=tuple(snake_list),
                food=None,
                direction=new_direction,
                score=new_score,
                steps_since_eat=steps_since_eat,
            )
            info["pending_food"] = True
            info["empty_cells"] = empty_cells(tmp_state)
    else:
        snake_list.pop()  # move tail

    next_state = SnakeState(
        grid_w=state.grid_w,
        grid_h=state.grid_h,
        snake=tuple(snake_list),
        food=new_food,
        direction=new_direction,
        score=new_score,
        steps_since_eat=steps_since_eat,
    )
    return next_state, reward, False, info
