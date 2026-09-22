"""
Rate Limiter Middleware for MarketMind.
Enforces client rate limits on AI analysis and chat endpoints to protect quotas.
Provides automatic exemption for users who provide their own Gemini API keys.
"""

import time
import logging
from typing import Dict, List, Optional
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter.
    Zero external dependencies, highly resilient, and supports dynamic key exemption.
    """

    def __init__(self):
        # Maps client_identifier -> list of request timestamps (epoch floats)
        self._ai_requests: Dict[str, List[float]] = {}
        self._data_requests: Dict[str, List[float]] = {}
        self._cleanup_counter = 0

    def _get_client_ip(self, request: Request) -> str:
        """Extracts the true client IP address taking proxies into account."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        client = getattr(request, "client", None)
        if client and hasattr(client, "host"):
            return client.host
        return "127.0.0.1"

    def _cleanup_old_records(self, now: float):
        """Purges old timestamps to prevent memory growth."""
        self._cleanup_counter += 1
        if self._cleanup_counter < 100:
            return
        self._cleanup_counter = 0

        # Purge AI records older than 1 hour (3600 seconds)
        cutoff_ai = now - 3600
        for key in list(self._ai_requests.keys()):
            self._ai_requests[key] = [t for t in self._ai_requests[key] if t > cutoff_ai]
            if not self._ai_requests[key]:
                del self._ai_requests[key]

        # Purge data records older than 1 minute (60 seconds)
        cutoff_data = now - 60
        for key in list(self._data_requests.keys()):
            self._data_requests[key] = [t for t in self._data_requests[key] if t > cutoff_data]
            if not self._data_requests[key]:
                del self._data_requests[key]

    def check_ai_limit(
        self,
        request: Request,
        user_id: Optional[str] = None,
        custom_key_present: bool = False,
        max_requests: int = 15,
        window_seconds: int = 3600,
    ):
        """
        Enforces AI rate limits (default 15 requests / hour).
        If user provides their own Gemini API key, bypass limit completely!
        """
        # Exemption: If custom key is provided in header or user profile, no limit applies
        if custom_key_present:
            return

        header_key = request.headers.get("X-Gemini-Key")
        if header_key and len(header_key.strip()) >= 15:
            return

        now = time.time()
        self._cleanup_old_records(now)

        # Unique identifier: user_id if authenticated, else IP address
        client_key = user_id or self._get_client_ip(request)

        timestamps = self._ai_requests.setdefault(client_key, [])
        # Filter timestamps within current window
        cutoff = now - window_seconds
        active_timestamps = [t for t in timestamps if t > cutoff]
        self._ai_requests[client_key] = active_timestamps

        if len(active_timestamps) >= max_requests:
            oldest = active_timestamps[0]
            retry_after = int(window_seconds - (now - oldest)) + 1
            logger.warning(f"AI Rate limit exceeded for client {client_key}. Retry after {retry_after}s.")
            raise HTTPException(
                status_code=429,
                detail=(
                    f"AI Rate Limit Reached ({max_requests} requests/hour). "
                    "To unlock unlimited AI queries, configure your personal Gemini API key in the left navigation panel."
                ),
                headers={
                    "Retry-After": str(max(1, retry_after)),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        # Record this request
        self._ai_requests[client_key].append(now)


rate_limiter = SlidingWindowRateLimiter()
