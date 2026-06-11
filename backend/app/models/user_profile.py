import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    travel_style = Column(String, nullable=True)  # e.g., Adventure, Relaxation, Culture, Food
    budget_range = Column(String, nullable=True)   # e.g., Budget, Mid-Range, Luxury
    favorite_destinations = Column(JSON, nullable=True)  # List of strings
    preferred_hotels = Column(JSON, nullable=True)      # List of strings
    food_preferences = Column(JSON, nullable=True)      # List of strings
    preferred_activities = Column(JSON, nullable=True)  # List of strings
    preferred_currency = Column(String, default="INR", nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", backref="profile")
