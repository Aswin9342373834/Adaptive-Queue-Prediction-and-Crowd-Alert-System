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
    Represents an individual bank customer token with timestamp tracking and counter assignment.
    """
    token_id: str
    status: str  # "WAITING", "CALLED", "SERVING", "COMPLETED"
    created_at: float
    called_at: Optional[float] = None
    service_start_at: Optional[float] = None
    completed_at: Optional[float] = None
    customer_name: str = ""
    mobile_number: str = ""
    service_type: str = "General Banking"
    assigned_counter: int = 3
    customer_id: str = ""

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


# Standard Bank Counters Configuration
DEFAULT_COUNTERS_CONFIG = [
    {
        "counter": 1,
        "name": "Counter 01",
        "officer": "Robert Vance (Senior Officer)",
        "services": ["Priority / Senior Assistance", "Cash Deposit", "Cash Withdrawal", "General Banking"],
        "active": True,
    },
    {
        "counter": 2,
        "name": "Counter 02",
        "officer": "Emily Watson (Cashier)",
        "services": ["Cash Deposit", "Cash Withdrawal", "Passbook / Statement", "General Banking"],
        "active": True,
    },
    {
        "counter": 3,
        "name": "Counter 03",
        "officer": "Sarah Jenkins (Counter Officer)",
        "services": ["Account Opening", "Account Service", "KYC / Verification", "General Banking"],
        "active": True,
    },
    {
        "counter": 4,
        "name": "Counter 04",
        "officer": "David Kim (Loan Specialist)",
        "services": ["Loan Enquiry", "Financial Advisory", "Account Opening", "General Banking"],
        "active": True,
    },
    {
        "counter": 5,
        "name": "Counter 05",
        "officer": "Ananya Sharma (KYC & Documentation)",
        "services": ["KYC / Verification", "Passbook / Statement", "Auxiliary Desk", "General Banking"],
        "active": True,
    },
]


class QueueManager:
    """
    Manages token generation, state transitions, customer metadata, and counter-specific queue positions.
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
        """Formats integer into token string (e.g., 1 -> 'C001' or 'A101')."""
        return f"{self.prefix}{num:0{self.digits}d}"

    def get_counter_queue_counts(self) -> Dict[int, int]:
        """Returns map of counter number to count of currently WAITING tokens."""
        counts = {c["counter"]: 0 for c in DEFAULT_COUNTERS_CONFIG}
        for token in self.tokens:
            if token.status == "WAITING":
                cntr = token.assigned_counter
                counts[cntr] = counts.get(cntr, 0) + 1
        return counts

    def recommend_counter(self, service_type: str) -> Dict[str, Any]:
        """
        Recommends the best counter based on specialized service capability and shortest queue.
        """
        queue_counts = self.get_counter_queue_counts()
        active_counters = [c for c in DEFAULT_COUNTERS_CONFIG if c["active"]]

        # 1. Exact service match
        exact_matches = [c for c in active_counters if service_type in c["services"]]
        
        # 2. Fallback to General Banking
        eligible_counters = exact_matches if exact_matches else [c for c in active_counters if "General Banking" in c["services"]]
        if not eligible_counters:
            eligible_counters = active_counters

        # Pick eligible counter with minimum waiting queue
        best_counter = min(eligible_counters, key=lambda c: (queue_counts.get(c["counter"], 0), c["counter"]))
        wait_count = queue_counts.get(best_counter["counter"], 0)

        return {
            "recommended_counter": best_counter["counter"],
            "counter_name": best_counter["name"],
            "officer_name": best_counter["officer"],
            "waiting_count": wait_count,
            "reason": f"Shortest queue ({wait_count} waiting) for {service_type}",
        }

    def get_counters_info(self) -> List[Dict[str, Any]]:
        """Returns full snapshot of all counters, active status, officer, live queue count, and active token details."""
        queue_counts = self.get_counter_queue_counts()
        now = time.time()
        result = []
        for c in DEFAULT_COUNTERS_CONFIG:
            cntr_num = c["counter"]
            
            # Find active SERVING token first, then CALLED token
            active_tok = None
            for t in self.tokens:
                if t.assigned_counter == cntr_num and t.status == "SERVING":
                    active_tok = t
                    break
            if not active_tok:
                for t in self.tokens:
                    if t.assigned_counter == cntr_num and t.status == "CALLED":
                        active_tok = t
                        break

            active_details = None
            if active_tok:
                elapsed_sec = 0.0
                if active_tok.service_start_at:
                    elapsed_sec = max(0.0, now - active_tok.service_start_at)
                elif active_tok.called_at:
                    elapsed_sec = max(0.0, now - active_tok.called_at)

                active_details = {
                    "token_id": active_tok.token_id,
                    "status": active_tok.status,
                    "customer_name": active_tok.customer_name,
                    "mobile_number": active_tok.mobile_number,
                    "service_type": active_tok.service_type,
                    "assigned_counter": active_tok.assigned_counter,
                    "customer_id": active_tok.customer_id,
                    "called_at": active_tok.called_at,
                    "service_start_at": active_tok.service_start_at,
                    "elapsed_seconds": round(elapsed_sec, 1),
                    "elapsed_str": f"{int(elapsed_sec // 60):02d}:{int(elapsed_sec % 60):02d}",
                }

            result.append({
                "counter": cntr_num,
                "name": c["name"],
                "officer": c["officer"],
                "services": c["services"],
                "active": c["active"],
                "waiting_count": queue_counts.get(cntr_num, 0),
                "current_serving": active_tok.token_id if active_tok else None,
                "current_status": active_tok.status if active_tok else "IDLE",
                "active_token": active_details,
            })
        return result

    def skip_token(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Marks the currently CALLED or SERVING token as SKIPPED.
        """
        for token in self.tokens:
            if token.status in ("CALLED", "SERVING") and (counter is None or token.assigned_counter == counter):
                token.status = "SKIPPED"
                token.completed_at = time.time()
                self.last_action_message = f"Skipped Token {token.token_id} at Counter {token.assigned_counter:02d}"
                print(f"[QUEUE] {self.last_action_message}")
                return token
        return None

    def generate_token(
        self,
        customer_name: str = "",
        mobile_number: str = "",
        service_type: str = "General Banking",
        assigned_counter: Optional[int] = None,
        customer_id: str = "",
    ) -> Token:
        """
        Generates a new bank token in WAITING state and adds it to the queue with metadata.
        """
        token_id = self._format_token_id(self.next_num)
        self.next_num += 1

        # If counter not specified, recommend the best counter
        if not assigned_counter or assigned_counter <= 0:
            rec = self.recommend_counter(service_type)
            assigned_counter = rec["recommended_counter"]

        new_token = Token(
            token_id=token_id,
            status="WAITING",
            created_at=time.time(),
            customer_name=customer_name.strip(),
            mobile_number=mobile_number.strip(),
            service_type=service_type.strip() or "General Banking",
            assigned_counter=assigned_counter,
            customer_id=customer_id.strip(),
        )
        self.tokens.append(new_token)
        name_str = f" ({customer_name})" if customer_name else ""
        self.last_action_message = f"Generated Token {token_id}{name_str} -> Counter {assigned_counter:02d}"
        print(f"[QUEUE] {self.last_action_message}")
        return new_token

    def call_next(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Calls the next waiting token in line (WAITING -> CALLED).
        If counter is given, calls next token assigned to that counter.
        """
        # 1. Search for token assigned to this specific counter
        if counter is not None:
            for token in self.tokens:
                if token.status == "WAITING" and token.assigned_counter == counter:
                    token.status = "CALLED"
                    token.called_at = time.time()
                    self.last_action_message = f"Counter {counter:02d} called Token {token.token_id}"
                    print(f"[QUEUE] {self.last_action_message}")
                    return token

        # 2. General fallback: if no counter specified, take first waiting token
        if counter is None:
            for token in self.tokens:
                if token.status == "WAITING":
                    token.status = "CALLED"
                    token.called_at = time.time()
                    self.last_action_message = f"Called Token {token.token_id}"
                    print(f"[QUEUE] {self.last_action_message}")
                    return token

        self.last_action_message = f"No waiting tokens for Counter {counter:02d}" if counter else "No waiting tokens to call."
        print(f"[QUEUE] {self.last_action_message}")
        return None

    def start_service(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Transitions the currently CALLED token to SERVING state.
        If counter is given, transitions token for that counter.
        """
        # Find token that is CALLED for this counter
        for token in self.tokens:
            if token.status == "CALLED":
                if counter is None or token.assigned_counter == counter:
                    token.status = "SERVING"
                    token.service_start_at = time.time()
                    self.last_action_message = f"Serving Token {token.token_id} at Counter {token.assigned_counter:02d}"
                    print(f"[QUEUE] {self.last_action_message}")
                    return token

        # If no token is CALLED, check if we can directly serve the next WAITING token
        for token in self.tokens:
            if token.status == "WAITING":
                if counter is None or token.assigned_counter == counter:
                    token.status = "SERVING"
                    token.called_at = time.time()
                    token.service_start_at = time.time()
                    self.last_action_message = f"Directly Serving Token {token.token_id} at Counter {token.assigned_counter:02d}"
                    print(f"[QUEUE] {self.last_action_message}")
                    return token

        self.last_action_message = "No token available to serve."
        print(f"[QUEUE] {self.last_action_message}")
        return None

    def complete_service(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Completes the token currently being served (SERVING -> COMPLETED).
        """
        # Find token currently SERVING for this counter
        for token in self.tokens:
            if token.status == "SERVING":
                if counter is None or token.assigned_counter == counter:
                    token.status = "COMPLETED"
                    token.completed_at = time.time()
                    dur = token.service_duration_seconds
                    self.last_action_message = f"Completed Token {token.token_id} at Counter {token.assigned_counter:02d} (Service: {dur:.1f}s)"
                    print(f"[QUEUE] {self.last_action_message}")
                    return token

        # If none SERVING, check if any is in CALLED state and complete it
        for token in self.tokens:
            if token.status == "CALLED":
                if counter is None or token.assigned_counter == counter:
                    token.status = "COMPLETED"
                    token.completed_at = time.time()
                    dur = token.service_duration_seconds
                    self.last_action_message = f"Completed Token {token.token_id} at Counter {token.assigned_counter:02d} (from CALLED, Service: {dur:.1f}s)"
                    print(f"[QUEUE] {self.last_action_message}")
                    return token

        self.last_action_message = "No active service to complete."
        print(f"[QUEUE] {self.last_action_message}")
        return None

    def get_current_token(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Returns the token currently being served (SERVING), or CALLED if awaiting counter.
        """
        for token in self.tokens:
            if token.status == "SERVING" and (counter is None or token.assigned_counter == counter):
                return token
        for token in self.tokens:
            if token.status == "CALLED" and (counter is None or token.assigned_counter == counter):
                return token
        return None

    def get_serving_token(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Returns strictly the token in active 'SERVING' state.
        """
        for token in self.tokens:
            if token.status == "SERVING" and (counter is None or token.assigned_counter == counter):
                return token
        return None

    def get_next_token(self, counter: Optional[int] = None) -> Optional[Token]:
        """
        Returns the next upcoming token (CALLED if one is already called, otherwise first WAITING).
        """
        for token in self.tokens:
            if token.status == "CALLED" and (counter is None or token.assigned_counter == counter):
                return token
        for token in self.tokens:
            if token.status == "WAITING" and (counter is None or token.assigned_counter == counter):
                return token
        return None

    def get_waiting_tokens(self, counter: Optional[int] = None) -> List[Tuple[Token, int]]:
        """
        Returns all tokens currently WAITING, paired with their 1-indexed queue position.
        """
        waiting_list: List[Tuple[Token, int]] = []
        position = 1
        for token in self.tokens:
            if token.status == "WAITING":
                if counter is None or token.assigned_counter == counter:
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

