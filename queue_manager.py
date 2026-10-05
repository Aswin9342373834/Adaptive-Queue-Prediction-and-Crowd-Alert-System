"""
Digital Queue and Token Management Module.
Maintains in-memory bank token lifecycles, states (WAITING -> CALLED -> SERVING -> COMPLETED),
and dynamic queue position calculation.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple, Any
import time
import config


@dataclass
class Token:
    """
    Represents an individual bank customer token with timestamp tracking.
    """
    token_id: str
    status: str  # "WAITING", "CALLED", "SERVING", "COMPLETED"
    created_at: float
    called_at: Optional[float] = None
    service_start_at: Optional[float] = None
    completed_at: Optional[float] = None

    @property
    def wait_duration_seconds(self) -> float:
        """Elapsed time spent waiting before service started or completion."""
        end_time = self.service_start_at or self.completed_at or time.time()
        return max(0.0, end_time - self.created_at)

    @property
    def service_duration_seconds(self) -> float:
        """Duration of active service."""
        if not self.service_start_at:
            return 0.0
        end_time = self.completed_at or time.time()
        return max(0.0, end_time - self.service_start_at)


class QueueManager:
    """
    Manages token generation, state transitions, and real-time queue positions.
    """

    def __init__(
        self,
        prefix: str = config.TOKEN_PREFIX,
        start_num: int = config.TOKEN_START_NUMBER,
        digits: int = config.TOKEN_DIGITS,
    ):
        self.prefix = prefix
        self.next_num = start_num
        self.digits = digits
        self.tokens: List[Token] = []
        self.last_action_message = "System ready."

    def _format_token_id(self, num: int) -> str:
        """Formats integer into token string (e.g., 1 -> 'C001')."""
        return f"{self.prefix}{num:0{self.digits}d}"

    def generate_token(self) -> Token:
        """
        Generates a new bank token in WAITING state and adds it to the queue.
        Triggered by key [N].
        """
        token_id = self._format_token_id(self.next_num)
        self.next_num += 1

        new_token = Token(
            token_id=token_id,
            status="WAITING",
            created_at=time.time(),
        )
        self.tokens.append(new_token)
        self.last_action_message = f"Generated Token {token_id}"
        print(f"[QUEUE] {self.last_action_message}")
        return new_token

    def call_next(self) -> Optional[Token]:
        """
        Calls the next waiting token in line (WAITING -> CALLED).
        Triggered by key [C].
        """
        for token in self.tokens:
            if token.status == "WAITING":
                token.status = "CALLED"
                token.called_at = time.time()
                self.last_action_message = f"Called Token {token.token_id}"
                print(f"[QUEUE] {self.last_action_message}")
                return token

        self.last_action_message = "No waiting tokens to call."
        print(f"[QUEUE] {self.last_action_message}")
        return None

    def start_service(self) -> Optional[Token]:
        """
        Transitions the currently CALLED token to SERVING state.
        Triggered by key [S].
        """
        # Find token that is CALLED
        for token in self.tokens:
            if token.status == "CALLED":
                token.status = "SERVING"
                token.service_start_at = time.time()
                self.last_action_message = f"Serving Token {token.token_id}"
                print(f"[QUEUE] {self.last_action_message}")
                return token

        # If no token is CALLED, check if we can directly call & serve the next WAITING token
        for token in self.tokens:
            if token.status == "WAITING":
                token.status = "SERVING"
                token.called_at = time.time()
                token.service_start_at = time.time()
                self.last_action_message = f"Directly Serving Token {token.token_id}"
                print(f"[QUEUE] {self.last_action_message}")
                return token

        self.last_action_message = "No token available to serve."
        print(f"[QUEUE] {self.last_action_message}")
        return None

    def complete_service(self) -> Optional[Token]:
        """
        Completes the token currently being served (SERVING -> COMPLETED).
        Triggered by key [D].
        """
        # Find token currently SERVING
        for token in self.tokens:
            if token.status == "SERVING":
                token.status = "COMPLETED"
                token.completed_at = time.time()
                dur = token.service_duration_seconds
                self.last_action_message = f"Completed Token {token.token_id} (Service: {dur:.1f}s)"
                print(f"[QUEUE] {self.last_action_message}")
                return token

        # If none SERVING, check if any is in CALLED state and complete it
        for token in self.tokens:
            if token.status == "CALLED":
                token.status = "COMPLETED"
                token.completed_at = time.time()
                dur = token.service_duration_seconds
                self.last_action_message = f"Completed Token {token.token_id} (from CALLED, Service: {dur:.1f}s)"
                print(f"[QUEUE] {self.last_action_message}")
                return token

        self.last_action_message = "No active service to complete."
        print(f"[QUEUE] {self.last_action_message}")
        return None

    def get_current_token(self) -> Optional[Token]:
        """
        Returns the token currently being served (SERVING), or CALLED if awaiting counter.
        """
        for token in self.tokens:
            if token.status == "SERVING":
                return token
        for token in self.tokens:
            if token.status == "CALLED":
                return token
        return None

    def get_serving_token(self) -> Optional[Token]:
        """
        Returns strictly the token in active 'SERVING' state.
        """
        for token in self.tokens:
            if token.status == "SERVING":
                return token
        return None

    def get_next_token(self) -> Optional[Token]:
        """
        Returns the next upcoming token (CALLED if one is already called, otherwise first WAITING).
        """
        for token in self.tokens:
            if token.status == "CALLED":
                return token
        for token in self.tokens:
            if token.status == "WAITING":
                return token
        return None

    def get_waiting_tokens(self) -> List[Tuple[Token, int]]:
        """
        Returns all tokens currently WAITING, paired with their 1-indexed queue position.
        """
        waiting_list: List[Tuple[Token, int]] = []
        position = 1
        for token in self.tokens:
            if token.status == "WAITING":
                waiting_list.append((token, position))
                position += 1
        return waiting_list

    def get_completed_service_durations(self) -> List[float]:
        """
        Returns a list of measured service durations (in seconds) for all COMPLETED tokens.
        """
        durations = []
        for token in self.tokens:
            if token.status == "COMPLETED" and token.service_start_at and token.completed_at:
                dur = max(1.0, token.completed_at - token.service_start_at)
                durations.append(dur)
        return durations

    def get_summary(self) -> Dict[str, Any]:
        """
        Returns a complete structured snapshot of the queue.
        """
        current_tok = self.get_current_token()
        waiting_tuples = self.get_waiting_tokens()
        next_tok = self.get_next_token()

        if current_tok and next_tok and (current_tok.token_id == next_tok.token_id):
            next_tok = waiting_tuples[0][0] if waiting_tuples else None

        current_display = f"{current_tok.token_id} ({current_tok.status})" if current_tok else "None"
        next_display = next_tok.token_id if next_tok else "None"

        return {
            "current_token": current_tok,
            "current_token_display": current_display,
            "next_token_display": next_display,
            "tokens_waiting_count": len(waiting_tuples),
            "waiting_tokens": waiting_tuples,
            "last_action": self.last_action_message,
        }
