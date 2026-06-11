import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, TEXT
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(TEXT, nullable=False)
    type = Column(String(50), nullable=False)  # Weather, FlightAlert, HotelAlert, Event
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", backref="notifications")
