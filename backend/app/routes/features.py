from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from app.database.connection import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.trip import Trip
from app.models.user_profile import UserProfile
from app.models.expense import Expense
from app.models.booking import Booking
from app.models.notification import Notification
from app.models.transaction import Transaction

# Services
from app.services.flight_service import search_flights
from app.services.hotel_service import search_hotels
from app.services.maps_service import calculate_route_details
from app.services.notification_service import create_notification
from app.services.payment_service import create_stripe_payment_intent, create_razorpay_order, process_webhook_payment
from app.services.monitoring_service import run_realtime_trip_monitor
from app.services.recommendation_service import generate_personalized_recommendations
from app.services.demo_service import get_preloaded_demo_itinerary

router = APIRouter(prefix="/api", tags=["Platform Features"])

# --- PYDANTIC SCHEMAS ---

class UserProfileSchema(BaseModel):
    travel_style: Optional[str] = None
    budget_range: Optional[str] = None
    favorite_destinations: Optional[List[str]] = []
    preferred_hotels: Optional[List[str]] = []
    food_preferences: Optional[List[str]] = []
    preferred_activities: Optional[List[str]] = []

class ExpenseCreate(BaseModel):
    trip_id: int
    category: str  # Food, Hotels, Shopping, Transport, Activities, Miscellaneous
    amount: float
    description: Optional[str] = None
    spent_date: Optional[str] = None # YYYY-MM-DD

class BookingCreate(BaseModel):
    trip_id: int
    booking_type: str # Flight, Hotel, Activity
    provider_name: str
    price: float
    currency: Optional[str] = "INR"
    status: Optional[str] = "Pending"
    payment_status: Optional[str] = "Unpaid"
    details: Optional[Dict[str, Any]] = {}

class PaymentCreate(BaseModel):
    booking_id: int
    gateway: str  # Stripe or Razorpay

class MonitorCheckRequest(BaseModel):
    trip_id: int

class RouteCalculateRequest(BaseModel):
    locations: List[Dict[str, Any]] # [{"name": "A", "lat": 12.3, "lng": 76.5}, ...]

# --- FLIGHTS & HOTELS SEARCH ---

@router.get("/flights/search")
def search_flights_route(
    source: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str] = None,
    passengers: int = 1
):
    try:
        flights = search_flights(source, destination, departure_date, return_date, passengers)
        return flights
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flight search failed: {str(e)}"
        )

@router.get("/hotels/search")
def search_hotels_route(destination: str):
    try:
        hotels = search_hotels(destination)
        return hotels
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel search failed: {str(e)}"
        )

# --- GOOGLE MAPS ROUTING ---

@router.post("/route/calculate")
def calculate_trip_route(request: RouteCalculateRequest):
    try:
        route_details = calculate_route_details(request.locations)
        return route_details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route calculation failed: {str(e)}"
        )

# --- EXPENSE TRACKER ---

@router.post("/expenses")
def add_expense(
    request: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve Trip to verify ownership & planned budget
    trip = db.query(Trip).filter(Trip.id == request.trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
        
    import datetime
    s_date = datetime.date.today()
    if request.spent_date:
        try:
            s_date = datetime.datetime.strptime(request.spent_date, "%Y-%m-%d").date()
        except:
            pass

    db_expense = Expense(
        user_id=current_user.id,
        trip_id=request.trip_id,
        category=request.category,
        amount=request.amount,
        description=request.description,
        spent_date=s_date
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # --- SMART ALERTS: OVERSPENDING CHECK ---
    # Retrieve planned budget breakdown
    plan = trip.generated_plan or {}
    breakdown = plan.get("budgetBreakdown", {})
    
    # Map input category to JSON planned keys
    mapped_keys = {
        "Hotels": "hotel_cost",
        "Food": "food_cost",
        "Transport": "transportation_cost",
        "Activities": "activity_cost",
        "Miscellaneous": "miscellaneous_cost"
    }
    
    planned_key = mapped_keys.get(request.category)
    if planned_key and planned_key in breakdown:
        planned_limit = breakdown[planned_key]
        
        # Calculate sum of spent in this category
        spent_sum = db.query(Expense).filter(
            Expense.trip_id == request.trip_id,
            Expense.category == request.category
        ).with_entities(Expense.amount).all()
        
        total_spent = sum(x[0] for x in spent_sum)
        
        if total_spent > planned_limit:
            # Overspent alert! Trigger smart notification
            create_notification(
                db=db,
                user_id=current_user.id,
                title="Overspending Alert!",
                message=f"You have spent a total of ₹{total_spent} on {request.category}, exceeding your planned budget allocation of ₹{planned_limit}.",
                type="BudgetAlert"
            )
            
    return db_expense

@router.get("/expenses")
def get_expenses(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.trip_id == trip_id
    ).order_by(Expense.spent_date.desc()).all()
    
    return expenses

# --- USER PROFILE & PREFERENCES ---

@router.get("/profile")
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Return default blank settings
        return {
            "travel_style": "",
            "budget_range": "",
            "favorite_destinations": [],
            "preferred_hotels": [],
            "food_preferences": [],
            "preferred_activities": []
        }
    return profile

@router.post("/profile")
def update_user_profile(
    request: UserProfileSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        
    profile.travel_style = request.travel_style
    profile.budget_range = request.budget_range
    profile.favorite_destinations = request.favorite_destinations
    profile.preferred_hotels = request.preferred_hotels
    profile.food_preferences = request.food_preferences
    profile.preferred_activities = request.preferred_activities
    
    db.commit()
    db.refresh(profile)
    return profile

# --- SMART NOTIFICATIONS ---

@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()
    return notifications

@router.post("/notifications/read")
def mark_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

# --- BOOKING ENGINE ---

@router.post("/bookings")
def create_booking(
    request: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import uuid
    conf_id = f"FLY-{uuid.uuid4().hex[:8].upper()}" if request.status == "Confirmed" else None
    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"
    provider_ref = f"PRV-{uuid.uuid4().hex[:8].upper()}"
    
    db_booking = Booking(
        user_id=current_user.id,
        trip_id=request.trip_id,
        booking_type=request.booking_type,
        provider_name=request.provider_name,
        price=request.price,
        currency=request.currency,
        status=request.status,
        payment_status=request.payment_status,
        confirmation_id=conf_id,
        booking_reference=booking_ref,
        provider_reference=provider_ref,
        details=request.details
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Send smart booking confirmation notification if confirmed
    if request.status == "Confirmed":
        create_notification(
            db=db,
            user_id=current_user.id,
            title="Booking Confirmed!",
            message=f"Your booking for a {request.booking_type} with {request.provider_name} has been confirmed. Confirmation ID: {conf_id}.",
            type="HotelAlert" if request.booking_type == "Hotel" else "FlightAlert"
        )
    else:
        create_notification(
            db=db,
            user_id=current_user.id,
            title="Booking Created (Pending Payment)",
            message=f"Your booking request for a {request.booking_type} with {request.provider_name} has been created. Booking Reference: {booking_ref}.",
            type="SystemAlert"
        )
    
    return db_booking

@router.get("/bookings")
def get_bookings(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id,
        Booking.trip_id == trip_id
    ).all()
    return bookings

@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "Cancelled":
        return {"status": "ignored", "message": "Booking is already cancelled"}

    # Calculate refund status
    if booking.payment_status == "Paid":
        booking.refund_status = "Refunded"  # Instantly refund in demo / mock workflow
        # Create refund transaction log
        db_transaction = Transaction(
            user_id=current_user.id,
            booking_id=booking.id,
            payment_intent_id=f"refund_{uuid.uuid4().hex[:12]}",
            amount=booking.price,
            currency=booking.currency,
            method="Refund",
            status="Succeeded"
        )
        db.add(db_transaction)
        booking.payment_status = "Refunded"
    else:
        booking.refund_status = "None"

    booking.status = "Cancelled"
    db.commit()

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Booking Cancelled",
        message=f"Your booking {booking.booking_reference or ''} for {booking.booking_type} has been cancelled. Refund Status: {booking.refund_status}.",
        type="SystemAlert"
    )

    return {
        "status": "success",
        "booking_id": booking.id,
        "booking_status": booking.status,
        "refund_status": booking.refund_status
    }

# --- PAYMENTS GATEWAY INTEGRATION ---

@router.post("/payments/create")
def create_payment_intent_endpoint(
    request: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == request.booking_id,
        Booking.user_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Generate references if not set
    if not booking.booking_reference:
        booking.booking_reference = f"BK-{uuid.uuid4().hex[:8].upper()}"
    if not booking.provider_reference:
        booking.provider_reference = f"PRV-{uuid.uuid4().hex[:8].upper()}"
    
    booking.payment_status = "Pending"
    db.commit()

    # Call payment service
    if request.gateway.lower() == "stripe":
        intent = create_stripe_payment_intent(booking.price)
        payment_id = intent["paymentIntentId"]
    else:
        intent = create_razorpay_order(booking.price)
        payment_id = intent["orderId"]

    # Create Transaction record
    db_transaction = Transaction(
        user_id=current_user.id,
        booking_id=booking.id,
        payment_intent_id=payment_id,
        amount=booking.price,
        currency=booking.currency,
        method=request.gateway,
        status="Pending"
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return {
        "transaction_id": db_transaction.id,
        "payment_intent": intent
    }

@router.post("/payments/webhook")
def payment_webhook(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    processed = process_webhook_payment(payload)
    intent_id = processed.get("intentId")
    status_str = processed.get("status")
    
    if not intent_id:
        raise HTTPException(status_code=400, detail="Invalid webhook payload structure")

    transaction = db.query(Transaction).filter(Transaction.payment_intent_id == intent_id).first()
    if not transaction:
        return {"status": "ignored", "message": "Transaction not found"}

    booking = db.query(Booking).filter(Booking.id == transaction.booking_id).first()
    if not booking:
        return {"status": "ignored", "message": "Booking not found"}

    if status_str == "Succeeded":
        transaction.status = "Succeeded"
        booking.payment_status = "Paid"
        booking.status = "Confirmed"
        if not booking.confirmation_id:
            booking.confirmation_id = f"CONF-{uuid.uuid4().hex[:8].upper()}"
        
        create_notification(
            db=db,
            user_id=booking.user_id,
            title="Payment Successful!",
            message=f"Your payment of {booking.currency} {booking.price} for booking {booking.booking_reference} has been received. Booking is now confirmed.",
            type="FlightAlert" if booking.booking_type == "Flight" else "HotelAlert"
        )
    else:
        transaction.status = "Failed"
        booking.payment_status = "Failed"
        booking.status = "Cancelled"
        create_notification(
            db=db,
            user_id=booking.user_id,
            title="Payment Failed",
            message=f"Your payment for booking {booking.booking_reference} failed. Please try again.",
            type="SystemAlert"
        )

    db.commit()
    return {"status": "processed", "transaction_status": transaction.status}

@router.get("/payments/history")
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc()).all()
    
    return [
        {
            "id": tx.id,
            "booking_id": tx.booking_id,
            "payment_intent_id": tx.payment_intent_id,
            "amount": tx.amount,
            "currency": tx.currency,
            "method": tx.method,
            "status": tx.status,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        }
        for tx in transactions
    ]

# --- MONITORING & ANALYTICS & RECOMMENDATIONS ---

@router.post("/monitoring/check")
def check_trip_updates(
    request: MonitorCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = run_realtime_trip_monitor(db, current_user.id, request.trip_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Monitoring check failed: {str(e)}"
        )

@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Query database
    trips_count = db.query(Trip).count()
    bookings_count = db.query(Booking).count()
    
    # Calculate revenue
    revenue_sum = db.query(Booking).filter(
        Booking.payment_status == "Paid"
    ).with_entities(Booking.price).all()
    total_revenue = sum(r[0] for r in revenue_sum) if revenue_sum else 0.0

    # Calculate average budget
    trips = db.query(Trip).all()
    budgets = []
    dest_counts = {}
    for t in trips:
        plan = t.generated_plan or {}
        budget_val = plan.get("budgetBreakdown", {}).get("total_cost", 0.0)
        if budget_val > 0:
            budgets.append(budget_val)
        dest = t.destination.split(",")[0].strip() if t.destination else "Unknown"
        dest_counts[dest] = dest_counts.get(dest, 0) + 1

    avg_budget = sum(budgets) / len(budgets) if budgets else 45000.0
    
    popular_destinations = [
        {"destination": dest, "count": count}
        for dest, count in sorted(dest_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    if not popular_destinations:
        popular_destinations = [
            {"destination": "Bali", "count": 12},
            {"destination": "Goa", "count": 8},
            {"destination": "Dubai", "count": 5}
        ]

    conversion_rate = (bookings_count / trips_count * 100) if trips_count > 0 else 25.0
    retention_rate = 85.0

    return {
        "tripsPlanned": trips_count if trips_count > 0 else 18,
        "tripsSaved": trips_count if trips_count > 0 else 15,
        "bookingsCreated": bookings_count if bookings_count > 0 else 6,
        "revenueGenerated": total_revenue if total_revenue > 0 else 142000.0,
        "averageBudget": avg_budget,
        "popularDestinations": popular_destinations,
        "userRetention": retention_rate,
        "bookingConversion": round(conversion_rate, 1)
    }

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        recommendations = generate_personalized_recommendations(db, current_user.id)
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )

@router.get("/demo/itinerary")
def get_demo_itinerary(
    destination: str
):
    try:
        itinerary = get_preloaded_demo_itinerary(destination)
        return itinerary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch demo itinerary: {str(e)}"
        )
