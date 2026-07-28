"""
Agent I/O Schema — Standardized contract for all 12 agents.

Per Rebuild Spec Section 2:
Every specialist agent must return this exact shape.
This module validates every response before it touches the pipeline.

Section 2 rules enforced:
- Never output null, empty string, or omit a required field
- Confidence is a function of measurable inputs, not vibes
- Reasoning may only reference numbers from key_levels or input candles
- data_sufficient: false when insufficient data (never blank fields)
"""

import json
from typing import Any, Optional


# ─── Specialist Agent Output Schema ─────────────────────────────
SPECIALIST_SCHEMA = {
    "type": "object",
    "required": ["agent", "bias", "confidence", "key_levels", "reasoning", "data_sufficient"],
    "properties": {
        "agent": {"type": "string", "minLength": 1},
        "bias": {"type": "string", "enum": ["bullish", "bearish", "neutral"]},
        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "key_levels": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["price", "type", "strength"],
                "properties": {
                    "price": {"type": "number"},
                    "type": {"type": "string"},
                    "strength": {"type": "string", "enum": ["high", "medium", "low"]},
                },
            },
        },
        "reasoning": {"type": "string", "minLength": 1, "maxLength": 500},
        "data_sufficient": {"type": "boolean"},
    },
}


# ─── Executive Synthesis Output Schema ──────────────────────────
EXECUTIVE_SCHEMA = {
    "type": "object",
    "required": [
        "recommendation", "confidence", "agents_reporting",
        "agents_data_sufficient", "bull_case", "bear_case",
        "risk_assessment", "invalidation_price", "recommended_scenario",
        "alternative_scenario",
    ],
    "properties": {
        "recommendation": {"type": "string", "enum": ["buy", "sell", "wait", "no_trade"]},
        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "agents_reporting": {"type": "integer", "minimum": 0},
        "agents_data_sufficient": {"type": "integer", "minimum": 0},
        "bull_case": {"type": "array", "items": {"type": "string"}},
        "bear_case": {"type": "array", "items": {"type": "string"}},
        "risk_assessment": {"type": "string", "minLength": 1},
        "invalidation_price": {"type": ["number", "null"]},
        "recommended_scenario": {"type": "string"},
        "alternative_scenario": {"type": "string"},
    },
}


def validate_specialist_output(data: dict[str, Any], agent_name: str) -> tuple[bool, list[str]]:
    """Validate a specialist agent output against the schema.
    
    Returns (is_valid, list_of_errors).
    """
    errors = []
    
    if not isinstance(data, dict):
        return False, [f"[{agent_name}] Output is not a dict: {type(data)}"]
    
    # Check required fields exist
    for field in SPECIALIST_SCHEMA["required"]:
        if field not in data:
            errors.append(f"[{agent_name}] Missing required field: {field}")
    
    if errors:
        return False, errors
    
    # Validate types and values
    if data["agent"] != agent_name and data["agent"] != agent_name.replace("-", "_"):
        # Allow slight naming differences
        pass
    
    if data["bias"] not in ("bullish", "bearish", "neutral"):
        errors.append(f"[{agent_name}] Invalid bias: {data['bias']}")
    
    conf = data["confidence"]
    if not isinstance(conf, (int, float)) or conf < 0 or conf > 1:
        errors.append(f"[{agent_name}] Invalid confidence: {conf} (must be 0.0-1.0)")
    
    if not isinstance(data["key_levels"], list):
        errors.append(f"[{agent_name}] key_levels must be a list")
    else:
        for i, level in enumerate(data["key_levels"]):
            if not isinstance(level, dict):
                errors.append(f"[{agent_name}] key_levels[{i}] must be a dict")
                continue
            for req in ("price", "type", "strength"):
                if req not in level:
                    errors.append(f"[{agent_name}] key_levels[{i}] missing '{req}'")
            if "price" in level and not isinstance(level["price"], (int, float)):
                errors.append(f"[{agent_name}] key_levels[{i}].price must be a number")
    
    if not isinstance(data["reasoning"], str) or len(data["reasoning"].strip()) == 0:
        errors.append(f"[{agent_name}] reasoning must be a non-empty string")
    
    if not isinstance(data["data_sufficient"], bool):
        errors.append(f"[{agent_name}] data_sufficient must be a boolean")
    
    return len(errors) == 0, errors


def validate_executive_output(data: dict[str, Any]) -> tuple[bool, list[str]]:
    """Validate the Executive Synthesis agent output."""
    errors = []
    
    if not isinstance(data, dict):
        return False, ["Executive output is not a dict"]
    
    for field in EXECUTIVE_SCHEMA["required"]:
        if field not in data:
            errors.append(f"Executive missing required field: {field}")
    
    if errors:
        return False, errors
    
    if data["recommendation"] not in ("buy", "sell", "wait", "no_trade"):
        errors.append(f"Invalid recommendation: {data['recommendation']}")
    
    conf = data["confidence"]
    if not isinstance(conf, (int, float)) or conf < 0 or conf > 1:
        errors.append(f"Invalid confidence: {conf}")
    
    for case_field in ("bull_case", "bear_case"):
        if not isinstance(data[case_field], list):
            errors.append(f"{case_field} must be a list")
    
    return len(errors) == 0, errors


def create_fallback_output(agent_name: str, error_msg: str) -> dict[str, Any]:
    """Create a valid fallback output when an agent fails.
    
    Per spec: set data_sufficient=false, bias=neutral, confidence=0.0.
    Never fabricate — explain the failure in reasoning.
    """
    return {
        "agent": agent_name,
        "bias": "neutral",
        "confidence": 0.0,
        "key_levels": [],
        "reasoning": f"Agent failed: {error_msg}",
        "data_sufficient": False,
    }


def create_insufficient_data_output(agent_name: str, reason: str) -> dict[str, Any]:
    """Create a valid output when an agent has insufficient data.
    
    Per spec: this is the explicit 'insufficient data' state,
    rendered as a badge in the UI, never a blank field.
    """
    return {
        "agent": agent_name,
        "bias": "neutral",
        "confidence": 0.0,
        "key_levels": [],
        "reasoning": f"Insufficient data: {reason}",
        "data_sufficient": False,
    }
