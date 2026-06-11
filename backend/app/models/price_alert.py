import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    target_price = Column(Float, nullable=False)
    notification_method = Column(String, default="email") # email or push
    current_price = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to user
    user = relationship("User", backref="price_alerts")
