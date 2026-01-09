from enum import IntEnum, unique
from dataclasses import dataclass
from typing import List

@unique
class CardType(IntEnum):
    SOLO = 1        # 单张
    PAIR = 2        # 对子
    TRIO = 3        # 三张
    TRIO_SOLO = 4   # 三带一
    TRIO_PAIR = 5   # 三带二
    SEQ_SOLO = 6    # 单顺（5+）
    SEQ_PAIR = 7    # 双顺（3+对）
    SEQ_TRIO = 8    # 三顺（2+三）
    PLANE_SOLO = 9  # 飞机带单
    PLANE_PAIR = 10 # 飞机带对
    BOMB = 11       # 炸弹 (硬炸弹)
    SOFT_BOMB = 12  # 软炸弹 (含癞子)
    PURE_LAIZI_BOMB = 13 # 纯癞子炸弹 (4个癞子)
    ROCKET = 14     # 王炸（火箭）

    PASS = 0        # 过

@unique
class CardRank(IntEnum):
    THREE = 3
    FOUR = 4
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8
    NINE = 9
    TEN = 10
    JACK = 11
    QUEEN = 12
    KING = 13
    ACE = 14
    TWO = 15 # 2 is higher than Ace in DouDizhu
    BLACK_JOKER = 16
    RED_JOKER = 17

CARDS = list(range(3, 16)) * 4 + [16, 17]
# Normalized card strings for display
RANK_STR = {
    3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: 'bj', 17: 'rj'
}

@dataclass
class Move:
    cards: List[int]
    type: CardType
    rank: int  # The value for comparison (e.g., rank of the trio in a trio+1)
    
    def __repr__(self):
        return f"Move({self.type.name}, {[RANK_STR[c] for c in self.cards]})"
