"""
Base Safety Agent implementation for the Trade Safety Committee.
Provides Pydantic response validation, automatic single-retry error correction,
and graceful failure degradation without crashing the orchestrator.
"""

import json
import logging
from typing import Type, TypeVar, Optional, Dict, Any
from pydantic import BaseModel, ValidationError

from app.llm.client import gemini_client

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

class BaseSafetyAgent:
    def __init__(self, agent_name: str, agent_type: str, schema_class: Type[T], system_prompt: str):
        self.agent_name = agent_name
        self.agent_type = agent_type
        self.schema_class = schema_class
        self.system_prompt = system_prompt

    async def run(
        self,
        context_prompt: str,
        user_api_key: Optional[str] = None,
        deterministic_fallback: Optional[Dict[str, Any]] = None
    ) -> T:
        """
        Executes LLM reasoning with strict Pydantic validation, single-retry correction,
        and guaranteed fallback handling.
        """
        raw_output = ""
        try:
            raw_output = await gemini_client.generate(
                system_prompt=self.system_prompt,
                user_prompt=context_prompt,
                use_cache=True,
                override_api_key=user_api_key
            )
            parsed_data = self._clean_and_parse_json(raw_output)
            return self.schema_class(**parsed_data)
        except (json.JSONDecodeError, ValidationError) as parse_err:
            logger.warning(
                f"{self.agent_name} output validation failed ({parse_err}). Attempting single-retry correction..."
            )
            try:
                # Single retry with explicit correction guidance
                correction_prompt = (
                    f"PREVIOUS OUTPUT FAILED JSON VALIDATION:\n{raw_output}\n\n"
                    f"VALIDATION ERROR:\n{str(parse_err)}\n\n"
                    f"Please re-generate STRICTLY valid JSON conforming to the requested schema keys."
                )
                retry_output = await gemini_client.generate(
                    system_prompt=self.system_prompt,
                    user_prompt=correction_prompt,
                    use_cache=False,
                    override_api_key=user_api_key
                )
                parsed_retry = self._clean_and_parse_json(retry_output)
                return self.schema_class(**parsed_retry)
            except Exception as retry_err:
                logger.error(
                    f"{self.agent_name} correction retry failed ({retry_err}). Using deterministic fallback."
                )
                return self._build_fallback(deterministic_fallback, status="UNAVAILABLE")
        except Exception as general_err:
            logger.error(f"{self.agent_name} execution error: {general_err}")
            return self._build_fallback(deterministic_fallback, status="FAILED")

    def _clean_and_parse_json(self, raw_text: str) -> Dict[str, Any]:
        """Cleans markdown JSON codeblocks and parses to dict."""
        text = raw_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())

    def _build_fallback(self, fallback_data: Optional[Dict[str, Any]], status: str = "UNAVAILABLE") -> T:
        """Constructs a valid schema object using deterministic fallback data."""
        data = fallback_data.copy() if fallback_data else {}
        data["agent_name"] = self.agent_name
        data["agent_type"] = self.agent_type
        data["status"] = status
        try:
            return self.schema_class(**data)
        except Exception:
            # Absolute baseline fallback if even partial fallback fails
            base_dict = {
                "agent_name": self.agent_name,
                "agent_type": self.agent_type,
                "status": status,
                "confidence": 0,
                "reasoning": [f"{self.agent_name} temporarily operating with deterministic baseline metrics."],
                "risk_flags": [f"{self.agent_name} status: {status}"]
            }
            return self.schema_class.model_validate(base_dict, strict=False)
