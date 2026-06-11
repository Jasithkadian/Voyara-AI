import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    budget = Column(Float, nullable=False)
    days = Column(Integer, nullable=False)
    travelers = Column(Integer, default=1)
    interests = Column(JSON, nullable=True)  # List of strings
    generated_plan = Column(JSON, nullable=True)  # Full generated plan JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="trips")
    chat_histories = relationship("ChatHistory", back_populates="trip", cascade="all, delete-orphan")
