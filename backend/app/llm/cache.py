"""
High-performance prompt caching strategy for MarketMind to avoid redundant LLM invocations.
"""
import hashlib
from typing import Optional

class PromptCache:
    def __init__(self):
        self._cache = {}
        
    def get(self, key: str) -> Optional[str]:
        """Retrieve a cached response if available."""
        return self._cache.get(key)
        
    def set(self, key: str, value: str) -> None:
        """Cache a response."""
        self._cache[key] = value
        
    def make_key(self, system_prompt: str, user_prompt: str) -> str:
        """Create a unique cache key based on prompts."""
        combined = f"{system_prompt}|{user_prompt}"
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()
