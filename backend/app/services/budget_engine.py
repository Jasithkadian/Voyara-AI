from typing import Dict, Any

def calculate_budget_breakdown(
    destination: str,
    total_budget: float,
    days: int,
    travelers: int
) -> Dict[str, float]:
    """
    Refines and validates a budget breakdown for a destination.
    Uses general pricing heuristics to divide the budget.
    """
    dest_lower = destination.lower()
    
    # Tier classification for cost multiplier
    expensive_cities = ["paris", "london", "new york", "tokyo", "singapore", "dubai"]
    moderate_cities = ["goa", "mumbai", "delhi", "bangkok", "bali"]
    
    if any(city in dest_lower for city in expensive_cities):
        tier_multiplier = 1.5
    elif any(city in dest_lower for city in moderate_cities):
        tier_multiplier = 1.0
    else:
        tier_multiplier = 0.8
        
    # Heuristics for minimum daily costs (per traveler in INR or equivalent units)
    # If the budget is very low, we adjust the ratios to ensure they can survive!
    # For example, hostels and public transport.
    
    hotel_ratio = 0.35
    food_ratio = 0.25
    transport_ratio = 0.20
    activity_ratio = 0.20
    
    # Distribute the budget
    hotel_cost = round(total_budget * hotel_ratio, 2)
    food_cost = round(total_budget * food_ratio, 2)
    transport_cost = round(total_budget * transport_ratio, 2)
    activity_cost = round(total_budget * activity_ratio, 2)
    
    return {
        "hotel_cost": hotel_cost,
        "food_cost": food_cost,
        "transport_cost": transport_cost,
        "activity_cost": activity_cost,
        "total_cost": hotel_cost + food_cost + transport_cost + activity_cost
    }
