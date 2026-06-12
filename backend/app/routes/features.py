
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
from app.models.price_alert import PriceAlert

# Services
from app.services.flight_service import search_flights
from app.services.hotel_service import search_hotels
from app.services.maps_service import calculate_route_details
from app.services.notification_service import create_notification
from app.services.payment_service import create_stripe_payment_intent, create_razorpay_order, process_webhook_payment
from app.services.monitoring_service import run_realtime_trip_monitor, check_all_price_alerts
from app.services.recommendation_service import generate_personalized_recommendations
from app.services.demo_service import get_preloaded_demo_itinerary
from app.services.weather_service import get_weather_for_dates

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

class PriceAlertCreate(BaseModel):
    origin: str
    destination: str
    date: str # YYYY-MM-DD
    target_price: float
    notification_method: Optional[str] = "email"

class ExploreRequest(BaseModel):
    budget: float
    season: Optional[str] = None
    duration: int
    moods: List[str] = []
    surprise_me: Optional[bool] = False


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

# --- PRICE ALERTS ENDPOINTS ---

@router.post("/alerts/create")
def create_price_alert(
    request: PriceAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch initial current price
    initial_price = None
    try:
        flights = search_flights(request.origin, request.destination, request.date, passengers=1)
        if flights:
            initial_price = min(f["price"] for f in flights)
    except Exception as ex:
        pass
        
    alert = PriceAlert(
        user_id=current_user.id,
        origin=request.origin,
        destination=request.destination,
        date=request.date,
        target_price=request.target_price,
        notification_method=request.notification_method,
        current_price=initial_price,
        is_active=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/alerts/list")
def list_price_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = db.query(PriceAlert).filter(PriceAlert.user_id == current_user.id).order_by(PriceAlert.created_at.desc()).all()
    return alerts

@router.post("/alerts/test-trigger")
def test_trigger_price_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = check_all_price_alerts(db)
    return result

# --- WEATHER ROUTE ---

@router.get("/weather")
def get_weather_route(
    destination: str,
    start_date: str, # YYYY-MM-DD
    days: int = 5
):
    try:
        weather = get_weather_for_dates(destination, start_date, days)
        return weather
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch weather: {str(e)}"
        )

# --- EXPLORE MODE ---

EXPLORE_DESTINATIONS = [
    {
        "name": "Goa, India",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        "description": "Lush green coastal views, beautiful beaches, and a vibrant nightlife that makes every moment magical.",
        "estimatedCost": 22000.0,
        "bestSeason": "Winter (Nov-Feb)",
        "seasons": ["winter", "monsoon", "spring"],
        "moods": ["Beaches", "Nightlife", "Relaxing", "Food"]
    },
    {
        "name": "Paris, France",
        "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
        "description": "The city of light and romance, featuring world-class history, dining, art museums, and iconic cafes.",
        "estimatedCost": 85000.0,
        "bestSeason": "Spring (Apr-Jun)",
        "seasons": ["spring", "summer"],
        "moods": ["Culture", "Food", "Relaxing"]
    },
    {
        "name": "Tokyo, Japan",
        "image": "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80",
        "description": "A neo-futuristic hub that blends historic temples, incredible street food, and neon-lit night excursions.",
        "estimatedCost": 75000.0,
        "bestSeason": "Autumn (Sep-Nov)",
        "seasons": ["autumn", "spring"],
        "moods": ["Food", "Culture", "Nightlife", "Adventure"]
    },
    {
        "name": "Dubai, UAE",
        "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
        "description": "A luxurious desert oasis offering sky-high architecture, dune bashing, and premium shopping resorts.",
        "estimatedCost": 55000.0,
        "bestSeason": "Winter (Dec-Mar)",
        "seasons": ["winter", "autumn"],
        "moods": ["Adventure", "Nightlife", "Relaxing"]
    },
    {
        "name": "Bali, Indonesia",
        "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
        "description": "Tropical beaches, lush rice terraces, mystical temples, and tranquil wellness retreats.",
        "estimatedCost": 35000.0,
        "bestSeason": "Summer (Jun-Aug)",
        "seasons": ["summer", "spring"],
        "moods": ["Beaches", "Relaxing", "Culture", "Adventure"]
    },
    {
        "name": "Ladakh, India",
        "image": "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=600&q=80",
        "description": "Dramatic high-altitude desert landscapes, serene monasteries, and jaw-dropping mountain lakes.",
        "estimatedCost": 30000.0,
        "bestSeason": "Summer (Jun-Sep)",
        "seasons": ["summer"],
        "moods": ["Adventure", "Relaxing", "Culture"]
    },
    {
        "name": "Jaipur, India",
        "image": "https://images.unsplash.com/photo-1477584322813-ac8ec5df9c09?auto=format&fit=crop&w=600&q=80",
        "description": "The Pink City, full of royal heritage palaces, gorgeous fortresses, and spiced Rajasthani delicacies.",
        "estimatedCost": 15000.0,
        "bestSeason": "Winter (Nov-Feb)",
        "seasons": ["winter", "autumn", "spring"],
        "moods": ["Culture", "Food"]
    },
    {
        "name": "Phuket, Thailand",
        "image": "https://images.unsplash.com/photo-1528181304800-2f1702424b60?auto=format&fit=crop&w=600&q=80",
        "description": "Crystal blue waters, exciting night markets, and fun island excursions under the tropical sun.",
        "estimatedCost": 40000.0,
        "bestSeason": "Winter (Nov-Feb)",
        "seasons": ["winter", "spring"],
        "moods": ["Beaches", "Relaxing", "Nightlife", "Food"]
    },
    {
        "name": "Rome, Italy",
        "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80",
        "description": "An open-air museum of ancient ruins, Renaissance art, and world-class fresh pasta and gelato.",
        "estimatedCost": 78000.0,
        "bestSeason": "Spring (Apr-Jun)",
        "seasons": ["spring", "autumn"],
        "moods": ["Culture", "Food"]
    },
    {
        "name": "Reykjavik, Iceland",
        "image": "https://images.unsplash.com/photo-1504829857797-ddff28127792?auto=format&fit=crop&w=600&q=80",
        "description": "Stunning hot springs, massive waterfalls, and a chance to experience the magical Northern Lights.",
        "estimatedCost": 98000.0,
        "bestSeason": "Winter (Oct-Mar)",
        "seasons": ["winter", "summer"],
        "moods": ["Adventure", "Relaxing"]
    }
]

@router.post("/explore")
def explore_destinations_endpoint(request: ExploreRequest):
    ranked = []
    for dest in EXPLORE_DESTINATIONS:
        score = 60 # base score
        
        # Budget matching
        if request.budget >= dest["estimatedCost"]:
            score += 20
        elif request.budget >= dest["estimatedCost"] * 0.8:
            score += 10
        else:
            score -= 15
            
        # Season matching
        if request.season:
            season_clean = request.season.lower()
            if season_clean in dest["seasons"]:
                score += 15
            else:
                score -= 5
                
        # Mood matching
        mood_matches = 0
        for m in request.moods:
            if m in dest["moods"]:
                mood_matches += 1
        if request.moods:
            score += (mood_matches / len(request.moods)) * 20
        else:
            score += 10
            
        # Clamp score between 35 and 99
        score = max(35, min(99, round(score)))
        
        ranked.append({
            "name": dest["name"],
            "image": dest["image"],
            "description": dest["description"],
            "estimatedCost": dest["estimatedCost"] * (request.duration / 5.0), # scale cost based on days
            "bestSeason": dest["bestSeason"],
            "moods": dest["moods"],
            "matchScore": score
        })
        
    # Sort by matchScore descending
    ranked.sort(key=lambda x: x["matchScore"], reverse=True)
    
    # If surprise_me, shuffle
    if request.surprise_me:
        import random
        random.shuffle(ranked)
        # override matchScore for surprise me
        for r in ranked:
            r["matchScore"] = random.randint(85, 98)
            
    return ranked[:6]

# --- BUDGET CO-PILOT ---

@router.get("/trips/{trip_id}/budget-copilot")
def budget_copilot_endpoint(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    plan = trip.generated_plan or {}
    breakdown = plan.get("budgetBreakdown", {})
    
    # Fetch all expenses for this trip
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()
    
    # Sum spent per category
    spent = {
        "Food": 0.0,
        "Hotels": 0.0,
        "Transport": 0.0,
        "Activities": 0.0,
        "Miscellaneous": 0.0
    }
    for ex in expenses:
        cat = ex.category
        if cat in spent:
            spent[cat] += ex.amount
        else:
            spent["Miscellaneous"] += ex.amount
            
    # Planned allocations mapping
    planned = {
        "Hotels": float(breakdown.get("hotel_cost", 10000.0)),
        "Food": float(breakdown.get("food_cost", 5000.0)),
        "Transport": float(breakdown.get("transportation_cost", 5000.0)),
        "Activities": float(breakdown.get("activity_cost", 5000.0)),
        "Miscellaneous": float(breakdown.get("miscellaneous_cost", 3000.0))
    }
    
    flags = []
    recommendations = []
    
    category_tips = {
        "Hotels": "You are over budget on lodging. Consider downgrading remaining room nights, looking for high-rated homestays, or checking hostel private rooms.",
        "Food": "Your dining expenses are high. Try traditional local street food stalls or casual family taverns, and limit high-end dining splurges.",
        "Transport": "Transport costs have exceeded normal levels. We recommend utilizing day-passes for public transit, walking short distances, or using local ride-share promo codes.",
        "Activities": "Activities are over budget. Opt for free-entry museum days, self-guided walking tours, or nature hikes which cost nothing.",
        "Miscellaneous": "Shopping and miscellaneous spending is high. Look for souvenir deals in local markets away from main tourist centers and avoid impulse buys."
    }
    
    total_planned = sum(planned.values())
    total_spent = sum(spent.values())
    
    for cat, planned_val in planned.items():
        spent_val = spent[cat]
        if planned_val > 0:
            deviation = (spent_val - planned_val) / planned_val
            if deviation > 0.15:
                flags.append({
                    "category": cat,
                    "planned": planned_val,
                    "spent": spent_val,
                    "deviation": round(deviation * 100, 1),
                    "status": "warning"
                })
                recommendations.append(category_tips[cat])
                
    if not flags:
        status_msg = "Nominal"
        comment = "Great job! All spending categories are well within your allocated budgets. You are on track for a financially balanced trip."
    else:
        status_msg = "Over budget warning"
        comment = f"Alert: You have exceeded your planned budget by more than 15% in {len(flags)} categories. Apply our cost-saving recommendations to recover your balance."
        
    return {
        "status": status_msg,
        "totalPlanned": total_planned,
        "totalSpent": total_spent,
        "breakdown": {
            cat: {"planned": planned[cat], "spent": spent[cat]}
            for cat in planned
        },
        "flags": flags,
        "recommendations": recommendations,
        "comment": comment
    }

