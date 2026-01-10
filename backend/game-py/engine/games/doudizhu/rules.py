import random
from typing import List, Optional, Tuple
from collections import Counter
from .types import CardRank, CardType, Move, CARDS

def new_deck() -> List[int]:
    """Return a shuffled deck of 54 cards."""
    deck = CARDS.copy()
    random.shuffle(deck)
    return deck

def distribute_cards(deck: List[int]) -> Tuple[List[int], List[int], List[int], List[int]]:
    """Distribute cards to 3 players and keep 3 distinct cards (hole cards)."""
    # 17 cards each, 3 hole cards
    return deck[0:17], deck[17:34], deck[34:51], deck[51:]

def sort_hand(cards: List[int]) -> List[int]:
    """Sort cards desc (convenient for display and logic)."""
    return sorted(cards, reverse=True)

class MoveAnalyzer:
    """Helper to analyze if a move is valid and compare moves."""

    @staticmethod
    def get_move_type(cards: List[int], laizi_ranks: List[int] = []) -> Optional[Move]:
        """
        Parse a list of card ranks into a structured Move object.
        Supports LaiZi (Wild Cards) if laizi_ranks is provided.
        """
        if not cards:
            return Move([], CardType.PASS, 0)
        
        # Separate Wild and Normal
        wild_cards = [c for c in cards if c in laizi_ranks]
        normal_cards = [c for c in cards if c not in laizi_ranks]
        normal_cards = sorted(normal_cards)
        
        n_wild = len(wild_cards)
        n = len(cards)
        
        # ROCKET (Strict: Black Joker + Red Joker) - LaiZi cannot form Rocket usually
        if n == 2 and set(cards) == {CardRank.BLACK_JOKER, CardRank.RED_JOKER}:
            return Move(cards, CardType.ROCKET, 100)

        # 4 Wilds -> PURE_LAIZI_BOMB (Highest bomb except Rocket)
        # Note: In some rules, 4 LaiZi is bigger than Kings. In others smaller.
        # We assume typical: Rocket > Pure LaiZi > Hard > Soft
        if n == 4 and n_wild == 4:
            return Move(cards, CardType.PURE_LAIZI_BOMB, 100)

        # Optimization: If no wild cards, use standard logic fast path
        if n_wild == 0:
            return MoveAnalyzer._get_move_type_standard(cards)

        # --- Wild Card Logic ---
        
        # BOMB (4 cards)
        if n == 4:
            # Can we form a bomb?
            # We need to see if normal_cards can be completed to 4 of same rank
            if not normal_cards:
                 return Move(cards, CardType.PURE_LAIZI_BOMB, 100)
            
            # Check if all normal cards are same rank
            count = Counter(normal_cards)
            if len(count) == 1:
                # Yes, e.g. 3,3,L,L -> 3333
                return Move(cards, CardType.SOFT_BOMB, normal_cards[0])
        
        # SOLO (1 card) - A wild card played alone represents itself (current rank) OR highest rank?
        # Usually played as its original rank if solo.
        if n == 1:
             return Move(cards, CardType.SOLO, cards[0])

        # PAIR (2 cards)
        if n == 2:
            # 1 Normal + 1 Wild -> Pair of Normal
            if len(normal_cards) == 1:
                return Move(cards, CardType.PAIR, normal_cards[0])
            # 2 Wilds -> Pair of Wilds (highest?) or original?
            # usually 2 wilds treated as Pair of Highest normal rank used? 
            # Simplified: Treat 2 Wilds as Pair of their actual Face Value if played together alone?
            # Or usually not allowed to play 2 mixed wilds as a pair unless they are same rank?
            # Let's assume 2 Wilds = Pair of the Wild Rank (if same) or Pair of max?
            if not normal_cards:
                 return Move(cards, CardType.PAIR, max(wild_cards))

        # TRIO types
        if n == 3:
            # 2N+1W or 1N+2W or 3W
            count = Counter(normal_cards)
            if len(count) <= 1: # All normals same
                 rank = normal_cards[0] if normal_cards else max(wild_cards)
                 return Move(cards, CardType.TRIO, rank)

        # TRIO_SOLO (4 cards)
        # Ambiguity: 3,3,L,4 -> could be 3,3,3,4 (Trio+Solo) OR 3,3,4,4 (Pair+Pair? No such type)
        # Priority: Bomb > Trio+Solo. (Handled Bomb above).
        if n == 4:
             # Try to form Trio of Normal
             # ... This gets complex fast. 
             # Heuristic: Try to match highest value type.
             pass
             
        # For this MVP, let's implement basic Soft Bomb detection and keep standard logic for others 
        # unless simple.
        
        # Fallback: Try treating Wilds as "Any".
        # We try to "Upgrade" the most frequent normal card.
        if normal_cards:
             mode_rank, mode_count = Counter(normal_cards).most_common(1)[0]
             needed_for_4 = 4 - mode_count
             if n_wild >= needed_for_4 and n == 4:
                 return Move(cards, CardType.SOFT_BOMB, mode_rank)
                 
             needed_for_3 = 3 - mode_count
             if n_wild >= needed_for_3:
                 # TODO: Check remaining for kicker (Solver problem)
                 pass

        return None # Placeholder for complex LaiZi logic which is hard to inline here.

    @staticmethod
    def _get_move_type_standard(cards: List[int]) -> Optional[Move]:
        """Standard moves without wildcards"""
        cards = sorted(cards)
        count = Counter(cards)
        counts = count.most_common()
        n = len(cards)

        # BOMB
        if n == 4 and len(counts) == 1:
            return Move(cards, CardType.BOMB, cards[0])

        # SOLO
        if n == 1:
            return Move(cards, CardType.SOLO, cards[0])

        # PAIR
        if n == 2 and counts[0][1] == 2:
            return Move(cards, CardType.PAIR, cards[0])

        # TRIO
        if n == 3 and counts[0][1] == 3:
            return Move(cards, CardType.TRIO, cards[0])
        
        # TRIO_SOLO
        if n == 4 and counts[0][1] == 3:
            return Move(cards, CardType.TRIO_SOLO, counts[0][0])
            
        # TRIO_PAIR
        if n == 5 and counts[0][1] == 3 and counts[1][1] == 2:
            return Move(cards, CardType.TRIO_PAIR, counts[0][0])

        # SEQ_SOLO
        if n >= 5 and len(counts) == n and MoveAnalyzer._is_sequence(cards, 1):
            return Move(cards, CardType.SEQ_SOLO, cards[0])

        # SEQ_PAIR
        if n >= 6 and n % 2 == 0 and len(counts) == n/2 and all(c[1]==2 for c in counts) and MoveAnalyzer._is_sequence([c[0] for c in counts], 1):
           return Move(cards, CardType.SEQ_PAIR, min(cards))

        return None

    @staticmethod
    def _is_sequence(ranks: List[int], stride: int = 1) -> bool:
        if any(r >= CardRank.TWO for r in ranks): 
            return False
        sorted_ranks = sorted(ranks)
        for i in range(len(sorted_ranks) - 1):
            if sorted_ranks[i+1] - sorted_ranks[i] != stride:
                return False
        return True

    @staticmethod
    def can_beat(current_move: Move, prev_move: Move) -> bool:
        """
        Check if current_move can beat prev_move.
        Assumes prev_move is not PASS.
        """
        if current_move.type == CardType.PASS:
            return False

        # Rocket beats everything
        if current_move.type == CardType.ROCKET:
            return True
        if prev_move.type == CardType.ROCKET:
            return False

        # Pure LaiZi Bomb > Hard Bomb > Soft Bomb
        # Map bombs to a strength scale: Soft=1, Hard=2, Pure=3
        def get_bomb_strength(m: Move) -> int:
            if m.type == CardType.SOFT_BOMB:
                return 1
            if m.type == CardType.BOMB:
                return 2
            if m.type == CardType.PURE_LAIZI_BOMB:
                return 3
            return 0
        
        curr_bs = get_bomb_strength(current_move)
        prev_bs = get_bomb_strength(prev_move)
        
        if curr_bs > 0:
             # Current is some bomb
             if prev_bs > 0:
                 # Both bombs
                 if curr_bs != prev_bs:
                     return curr_bs > prev_bs
                 else:
                     return current_move.rank > prev_move.rank
             else:
                 # Current is bomb, prev is not
                 return True
                 
        if prev_bs > 0:
             # Prev was bomb, current is not
             return False

        # Normal comparison
        if current_move.type == prev_move.type and len(current_move.cards) == len(prev_move.cards):
            return current_move.rank > prev_move.rank

        return False

