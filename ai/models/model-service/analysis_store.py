"""
Analysis History Storage — persists AI analysis results.

Per Volume IV §3.12: Decision Logging
"Every recommendation shall generate a comprehensive audit record."

This module stores analysis results in PostgreSQL using SQLAlchemy.
Each record includes the full agent outputs, executive decision,
confidence calculations, and metadata for future evaluation.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

Base = declarative_base()


class AnalysisRecord(Base):
    """Stores a complete analysis result for auditing and history."""
    __tablename__ = "analysis_history"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    timeframe = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)  # buy, sell, wait, no_trade
    confidence = Column(Integer, nullable=False)
    executive_summary = Column(Text)
    agent_consensus = Column(Text)  # JSON
    agent_breakdown = Column(Text)  # JSON
    key_evidence = Column(Text)  # JSON
    risk_warnings = Column(Text)  # JSON
    suggested_action = Column(Text)  # JSON
    processing_time_ms = Column(Integer)
    total_agents = Column(Integer)
    successful_agents = Column(Integer)
    ai_provider = Column(String)
    ai_model = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AnalysisStore:
    """Manages analysis history storage and retrieval."""

    def __init__(self):
        database_url = os.environ.get(
            "DATABASE_URL",
            "postgresql://mavyx:mavyx_dev_password@localhost:5432/mavyx_intelligence"
        )
        try:
            self.engine = create_engine(database_url)
            Base.metadata.create_all(self.engine)
            self.Session = sessionmaker(bind=self.engine)
            self.available = True
            logger.info("Analysis store connected to database")
        except Exception as e:
            logger.warning(f"Analysis store unavailable: {e}")
            self.available = False

    def save(self, user_id: str, result: dict) -> Optional[str]:
        """Save an analysis result to the database."""
        if not self.available:
            logger.warning("Store unavailable — analysis not saved")
            return None

        import uuid
        analysis_id = str(uuid.uuid4())

        try:
            session = self.Session()
            record = AnalysisRecord(
                id=analysis_id,
                user_id=user_id,
                symbol=result.get("symbol", ""),
                timeframe=result.get("timeframe", ""),
                recommendation=result.get("recommendation", ""),
                confidence=result.get("confidence", 0),
                executive_summary=result.get("executive_summary", ""),
                agent_consensus=json.dumps(result.get("agent_consensus", {})),
                agent_breakdown=json.dumps(result.get("agent_breakdown", [])),
                key_evidence=json.dumps(result.get("key_evidence", [])),
                risk_warnings=json.dumps(result.get("risk_warnings", [])),
                suggested_action=json.dumps(result.get("suggested_action", {})),
                processing_time_ms=result.get("processing_time_ms", 0),
                total_agents=result.get("total_agents", 0),
                successful_agents=result.get("successful_agents", 0),
                ai_provider="zai",
                ai_model=os.environ.get("ZAI_MODEL", "glm-4.5-flash"),
            )
            session.add(record)
            session.commit()
            session.close()
            logger.info(f"Analysis saved: {analysis_id}")
            return analysis_id
        except Exception as e:
            logger.error(f"Failed to save analysis: {e}")
            return None

    def get_history(self, user_id: str, limit: int = 20) -> list[dict]:
        """Retrieve analysis history for a user."""
        if not self.available:
            return []

        try:
            session = self.Session()
            records = (
                session.query(AnalysisRecord)
                .filter(AnalysisRecord.user_id == user_id)
                .order_by(AnalysisRecord.created_at.desc())
                .limit(limit)
                .all()
            )
            results = []
            for r in records:
                results.append({
                    "id": r.id,
                    "symbol": r.symbol,
                    "timeframe": r.timeframe,
                    "recommendation": r.recommendation,
                    "confidence": r.confidence,
                    "executive_summary": r.executive_summary,
                    "processing_time_ms": r.processing_time_ms,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })
            session.close()
            return results
        except Exception as e:
            logger.error(f"Failed to retrieve history: {e}")
            return []

    def get_by_id(self, analysis_id: str) -> Optional[dict]:
        """Retrieve a specific analysis by ID."""
        if not self.available:
            return None

        try:
            session = self.Session()
            r = session.query(AnalysisRecord).filter(
                AnalysisRecord.id == analysis_id
            ).first()
            if not r:
                session.close()
                return None

            result = {
                "id": r.id,
                "user_id": r.user_id,
                "symbol": r.symbol,
                "timeframe": r.timeframe,
                "recommendation": r.recommendation,
                "confidence": r.confidence,
                "executive_summary": r.executive_summary,
                "agent_consensus": json.loads(r.agent_consensus) if r.agent_consensus else {},
                "agent_breakdown": json.loads(r.agent_breakdown) if r.agent_breakdown else [],
                "key_evidence": json.loads(r.key_evidence) if r.key_evidence else [],
                "risk_warnings": json.loads(r.risk_warnings) if r.risk_warnings else [],
                "suggested_action": json.loads(r.suggested_action) if r.suggested_action else {},
                "processing_time_ms": r.processing_time_ms,
                "total_agents": r.total_agents,
                "successful_agents": r.successful_agents,
                "ai_provider": r.ai_provider,
                "ai_model": r.ai_model,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            session.close()
            return result
        except Exception as e:
            logger.error(f"Failed to retrieve analysis: {e}")
            return None
