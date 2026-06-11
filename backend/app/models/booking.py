import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    booking_type = Column(String, nullable=False)  # Flight, Hotel, Activity
    provider_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="Pending")      # Pending, Confirmed, Cancelled
    payment_status = Column(String, default="Unpaid")  # Unpaid, Paid, Refunded
    refund_status = Column(String, default="None")      # None, Pending, Refunded
    confirmation_id = Column(String, nullable=True)
    booking_reference = Column(String, nullable=True)
    provider_reference = Column(String, nullable=True)
    details = Column(JSON, nullable=True)             # Room type, flight codes, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", backref="bookings")
    trip = relationship("Trip", backref="bookings")
