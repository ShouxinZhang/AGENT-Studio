from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
import random
from dataclasses import dataclass, field

from .types import CardType, Move, RANK_STR
from .rules import new_deck, distribute_cards, sort_hand, MoveAnalyzer

@dataclass
class DoudizhuState:
    hands: Dict[int, List[int]]  # Player IDX (0,1,2) -> Cards
    hole_cards: List[int]
    landlord: int
    current_player: int
    last_move: Optional[Move] = None
    last_move_player: int = -1 
    history: List[Tuple[int, List[int]]] = field(default_factory=list) 
    winner: int = -1
    # Mode related
    laizi_ranks: List[int] = field(default_factory=list) # Ranks that are Wild

class DoudizhuEnvironment:
    """
    Simplified Doudizhu Environment.
    Supports Classic and Tiandi LaiZi modes.
    """
    def __init__(self, seed: Optional[int] = None, mode: str = "classic"):
        self._rng = random.Random(seed)
        self.mode = mode
        self._state: Optional[DoudizhuState] = None
        self._done = False
        
    def reset(self) -> Dict[str, Any]:
        deck = new_deck()
        self._rng.shuffle(deck)
        
        h0 = sort_hand(deck[0:17])
        h1 = sort_hand(deck[17:34])
        h2 = sort_hand(deck[34:51])
        hole = deck[51:]
        
        landlord = self._rng.randint(0, 2)
        
        hands = {0: h0, 1: h1, 2: h2}
        
        hands[landlord].extend(hole)
        hands[landlord] = sort_hand(hands[landlord])
        
        # Determine LaiZi
        laizi_ranks = []
        if self.mode == "tiandi_laizi":
            # Earth LaiZi: Pick random card or use first hole card?
            # Standard: Reveal top card of deck before deal, but here deck is shuffled.
            # Let's use first hole card as the indicator.
            indicator_val = hole[0]
            if indicator_val > 15: # Joker cannot be indicator usually, redraw or cycle?
                indicator_val = self._rng.randint(3, 15)
            
            earth = indicator_val
            
            # Heaven is Earth + 1
            # Wrap A(14) -> 2(15) -> 3. Exclude Jokers.
            if earth == 15: # 2
               heaven = 3
            else:
               heaven = earth + 1
               
            laizi_ranks = [earth, heaven]
            # Unique ranks
            laizi_ranks = list(set(laizi_ranks))
        
        self._state = DoudizhuState(
            hands=hands,
            hole_cards=hole,
            landlord=landlord,
            current_player=landlord,
            last_move=None,
            last_move_player=landlord,
            laizi_ranks=laizi_ranks
        )
        self._done = False
        
        return self._to_state_dict(reward=0.0)

    def step(self, action: List[int]) -> Dict[str, Any]:
        """
        Action is a list of card integers.
        """
        if self._state is None or self._done:
            return self.reset()

        state = self._state
        current_player = state.current_player
        
        # Validate ownership
        player_hand = state.hands[current_player]
        from collections import Counter
        hand_cnt = Counter(player_hand)
        act_cnt = Counter(action)
        
        has_cards = True
        for c, count in act_cnt.items():
            if hand_cnt[c] < count:
                has_cards = False
                break
        
        reward = 0.0
        info = {"valid": True, "msg": "ok"}
        
        if not has_cards:
            return self._to_state_dict(reward=-10.0, info={"valid": False, "msg": "Target cards not in hand"})

        # Analyze Move
        move = MoveAnalyzer.get_move_type(action, laizi_ranks=state.laizi_ranks)
        
        # Check Rules
        is_free_play = (state.last_move is None) or (state.last_move_player == current_player)
        
        valid_logic = False
        
        if move is None:
            if len(action) == 0:
                # PASS
                if is_free_play:
                    valid_logic = False
                    info["msg"] = "Cannot pass on free turn"
                else:
                    valid_logic = True
            else:
                valid_logic = False
                info["msg"] = "Invalid card combination"
        else:
            if is_free_play:
                valid_logic = True
            else:
                if MoveAnalyzer.can_beat(move, state.last_move):
                    valid_logic = True
                else:
                    valid_logic = False
                    info["msg"] = "Move does not beat previous move"

        if not valid_logic:
            return self._to_state_dict(reward=-1.0, info=info)
            
        # Logic is Valid
        if len(action) > 0:
            for c in action:
                state.hands[current_player].remove(c)
                
            state.last_move = move
            state.last_move_player = current_player
            state.history.append((current_player, action))
            
            # Check Win
            if len(state.hands[current_player]) == 0:
                self._done = True
                state.winner = current_player
                base_reward = 100.0
                if current_player == state.landlord:
                    reward = base_reward
                else:
                    reward = base_reward
        else:
            # PASS
            state.history.append((current_player, []))
            pass
            
        state.current_player = (state.current_player + 1) % 3
        
        return self._to_state_dict(reward=reward, info=info)

    def _to_state_dict(self, reward: float = 0.0, info: Dict = {}) -> Dict[str, Any]:
        if self._state is None:
            return {}
            
        s = self._state
        
        scene = {
            "landlord": s.landlord,
            "holeCards": [RANK_STR[c] for c in s.hole_cards],
            "laizi": [RANK_STR[c] for c in s.laizi_ranks], # New field
            "players": [
                {
                    "id": i,
                    "role": "landlord" if i == s.landlord else "peasant",
                    "handCount": len(s.hands[i]),
                    "hand": [RANK_STR[c] for c in s.hands[i]],
                    "isTurn": i == s.current_player
                }
                for i in range(3)
            ],
            "lastMove": {
                "player": s.last_move_player,
                "cards": [RANK_STR[c] for c in s.last_move.cards] if s.last_move else [],
                "type": s.last_move.type.name if s.last_move else "None"
            },
            "winner": s.winner
        }
        
        obs = {
            "my_hand": s.hands[s.current_player],
            "last_move": s.last_move.cards if s.last_move else [],
            "role": "landlord" if s.current_player == s.landlord else "peasant",
            "laizi_ranks": s.laizi_ranks
        }

        return {
            "observation": obs,
            "reward": reward,
            "done": self._done,
            "truncated": False,
            "info": info,
            "render": {"mode": "scene", "scene": scene}
        }
    
    def close(self):
        pass

