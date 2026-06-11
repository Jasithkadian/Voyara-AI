from typing import Dict, Any

def get_preloaded_demo_itinerary(destination: str) -> Dict[str, Any]:
    dest = destination.lower().strip()
    
    currency = "₹"
    
    # 1. BALI DEMO PACKAGE
    if "bali" in dest:
        return {
            "tripSummary": {
                "destination": "Bali, Indonesia",
                "days": 7,
                "travelers": 2
            },
            "dailyItinerary": [
                {
                    "day": 1,
                    "weather": "Sunny, 29°C",
                    "activities": [
                        {"time": "Morning", "title": "Arrive at Denpasar Airport & Ubud Transfer", "description": "Check-in to your resort in Ubud. Relax and enjoy the valley pool view.", "estimatedCost": 1500, "duration": "3 hours", "location": "Ubud Resort"},
                        {"time": "Afternoon", "title": "Ubud Monkey Forest Walk", "description": "Walk through the sacred monkey forest sanctuary and historical temples.", "estimatedCost": 400, "duration": "2 hours", "location": "Sacred Monkey Forest"},
                        {"time": "Evening", "title": "Ubud Traditional Craft Market", "description": "Browse local paintings, wood carvings, and souvenir stalls.", "estimatedCost": 0, "duration": "2 hours", "location": "Ubud Center"}
                    ],
                    "restaurants": [
                        {"name": "Naughty Nuri's Ubud", "cuisine": "Balinese BBQ Ribs", "recommendedMeal": "Lunch", "estimatedCost": 800, "description": "Famous street side grill."},
                        {"name": "Bridges Bali", "cuisine": "Fine Wine & Dining", "recommendedMeal": "Dinner", "estimatedCost": 2500, "description": "Romantic river view dining."}
                    ]
                },
                {
                    "day": 2,
                    "weather": "Sunny, 28°C",
                    "activities": [
                        {"time": "Morning", "title": "Tegalalang Rice Terrace Trek", "description": "Walk through iconic cascading rice fields. Enjoy the scenic giant valley swing.", "estimatedCost": 800, "duration": "3 hours", "location": "Tegalalang"},
                        {"time": "Afternoon", "title": "Tirta Empul Holy Water Temple", "description": "Visit the sacred spring temple and experience traditional purification bathing ritual.", "estimatedCost": 300, "duration": "2 hours", "location": "Tirta Empul"},
                        {"time": "Evening", "title": "Traditional Kecak Fire Dance Performance", "description": "Watch the dramatic cliffside chanting performance at sunset.", "estimatedCost": 600, "duration": "2 hours", "location": "Ubud Amphitheater"}
                    ],
                    "restaurants": [
                        {"name": "Sari Organik", "cuisine": "Farm-to-Table Organic", "recommendedMeal": "Lunch", "estimatedCost": 600, "description": "Located in the middle of rice fields."},
                        {"name": "Locavore", "cuisine": "Modern Gastronomy", "recommendedMeal": "Dinner", "estimatedCost": 4500, "description": "Critically acclaimed tasting menu."}
                    ]
                }
            ],
            "budgetBreakdown": {
                "hotel_cost": 24500.0,
                "food_cost": 12000.0,
                "transportation_cost": 8500.0,
                "activity_cost": 9000.0,
                "miscellaneous_cost": 5000.0,
                "total_cost": 59000.0
            },
            "hotelRecommendations": [
                {"name": "Maya Ubud Resort & Spa", "rating": "4.9/5", "pricePerNight": "₹12,500/night", "distanceFromCenter": "1.5 km from center", "description": "Stunning luxury resort nestled in green river valleys with private plunge pools."},
                {"name": "Alaya Resort Ubud", "rating": "4.6/5", "pricePerNight": "₹6,800/night", "distanceFromCenter": "0.5 km from center", "description": "Boutique sanctuary facing active rice paddies with stellar spa facilities."}
            ],
            "attractions": [
                {"name": "Tegalalang Rice Terraces", "description": "Cascading rice paddies offering amazing valleys scenery.", "category": "Nature", "location": "Tegalalang", "rating": "4.8/5"},
                {"name": "Mount Batur Sunrise Hike", "description": "Early morning volcanic trek to witness the sunrise over Lake Batur.", "category": "Adventure", "location": "Kintamani", "rating": "4.9/5"}
            ],
            "travelTips": [
                "Negotiate scooter rentals down to around ₹400 per day.",
                "Always carry a sarong for temple visits. Sarongs are rented at temple gates.",
                "Avoid drinking tap water; buy bottled mineral water instead."
            ]
        }
        
    # 2. DUBAI DEMO PACKAGE
    elif "dubai" in dest:
        return {
            "tripSummary": {
                "destination": "Dubai, UAE",
                "days": 5,
                "travelers": 2
            },
            "dailyItinerary": [
                {
                    "day": 1,
                    "weather": "Hot, 36°C",
                    "activities": [
                        {"time": "Morning", "title": "Burj Khalifa 148th Sky Deck", "description": "Witness the world's tallest skyline view from the high altitude deck.", "estimatedCost": 7500, "duration": "2.5 hours", "location": "Downtown Dubai"},
                        {"time": "Afternoon", "title": "Dubai Mall & Aquarium", "description": "Explore the giant retail center and walkthrough under the underwater zoo tunnels.", "estimatedCost": 3000, "duration": "4 hours", "location": "Dubai Mall"},
                        {"time": "Evening", "title": "Dubai Fountain Lake Ride", "description": "Sail in a traditional boat as choreographic fountains dance to music.", "estimatedCost": 1200, "duration": "1.5 hours", "location": "Downtown Lake"}
                    ],
                    "restaurants": [
                        {"name": "At.mosphere Burj Khalifa", "cuisine": "International Luxury", "recommendedMeal": "Lunch", "estimatedCost": 9000, "description": "Highest restaurant in the world."},
                        {"name": "Al Hallab Dubai Mall", "cuisine": "Lebanese & Mezze", "recommendedMeal": "Dinner", "estimatedCost": 1800, "description": "Amazing fountain balcony views."}
                    ]
                }
            ],
            "budgetBreakdown": {
                "hotel_cost": 32000.0,
                "food_cost": 15000.0,
                "transportation_cost": 9000.0,
                "activity_cost": 22000.0,
                "miscellaneous_cost": 8000.0,
                "total_cost": 86000.0
            },
            "hotelRecommendations": [
                {"name": "Address Downtown Dubai", "rating": "4.9/5", "pricePerNight": "₹22,000/night", "distanceFromCenter": "0.1 km from Mall", "description": "Ultra luxury rooms overlooking the Burj Khalifa fountain show."},
                {"name": "Rove Downtown", "rating": "4.5/5", "pricePerNight": "₹7,500/night", "distanceFromCenter": "0.8 km from center", "description": "Trendy mid-range hotel close to Downtown landmarks."}
            ],
            "attractions": [
                {"name": "Burj Khalifa", "description": "Tallest building globally with spectacular high-deck observation suites.", "category": "Culture", "location": "Downtown", "rating": "4.9/5"},
                {"name": "Dubai Desert Safari", "description": "Dune bashing, camel riding, and BBQ diner under desert stars.", "category": "Adventure", "location": "Al Lahbab", "rating": "4.8/5"}
            ],
            "travelTips": [
                "Use the clean and fast Dubai Metro to avoid taxi highway traffic.",
                "Dress modestly inside public malls to respect local culture.",
                "Negotiate prices when buying gold or spices at old town Souks."
            ]
        }
    # 3. SWITZERLAND DEMO PACKAGE
    elif "switzerland" in dest:
        return {
            "tripSummary": {
                "destination": "Zurich & Grindelwald, Switzerland",
                "days": 6,
                "travelers": 2
            },
            "dailyItinerary": [
                {
                    "day": 1,
                    "weather": "Snowy, 2°C",
                    "activities": [
                        {"time": "Morning", "title": "Zurich Old Town Walking Tour", "description": "Stroll down historic streets, see Grossmünster, and walk along the Limmat river.", "estimatedCost": 1200, "duration": "3 hours", "location": "Zurich Old Town"},
                        {"time": "Afternoon", "title": "Lake Zurich Boat Cruise", "description": "Take a scenic ferry ride across Lake Zurich with views of the snow-capped Alps.", "estimatedCost": 2200, "duration": "2 hours", "location": "Lake Zurich"},
                        {"time": "Evening", "title": "Bahnhofstrasse Shopping & Chocolate", "description": "Visit luxury boutiques and sample premium Swiss chocolate at Lindt Home of Chocolate.", "estimatedCost": 1500, "duration": "2.5 hours", "location": "Bahnhofstrasse"}
                    ],
                    "restaurants": [
                        {"name": "Swiss Chuchi", "cuisine": "Swiss Cheese Fondue", "recommendedMeal": "Lunch", "estimatedCost": 2800, "description": "Historic fondue spot in Old Town."},
                        {"name": "Kronenhalle", "cuisine": "French-Swiss Fine Dining", "recommendedMeal": "Dinner", "estimatedCost": 6500, "description": "Famous artsy restaurant."}
                    ]
                },
                {
                    "day": 2,
                    "weather": "Partly Cloudy, -1°C",
                    "activities": [
                        {"time": "Morning", "title": "Train to Grindelwald & Check-in", "description": "Scenic rail journey through Interlaken into the Eiger valley.", "estimatedCost": 4500, "duration": "3.5 hours", "location": "Grindelwald"},
                        {"time": "Afternoon", "title": "Mount First Cable Car & Cliff Walk", "description": "Ride the gondola up Mount First and walk along the suspended metal walkway.", "estimatedCost": 3500, "duration": "3 hours", "location": "Mount First"},
                        {"time": "Evening", "title": "Alpine Village Stroll", "description": "Explore the snowy chalet village of Grindelwald with hot cocoa.", "estimatedCost": 400, "duration": "2 hours", "location": "Grindelwald Center"}
                    ],
                    "restaurants": [
                        {"name": "Barique Restaurant", "cuisine": "Modern European", "recommendedMeal": "Lunch", "estimatedCost": 2000, "description": "Stunning terrace overlooking the Eiger."},
                        {"name": "Barry's Restaurant", "cuisine": "Rustic Alpine Specialties", "recommendedMeal": "Dinner", "estimatedCost": 3800, "description": "Cozy chalet dining experience."}
                    ]
                }
            ],
            "budgetBreakdown": {
                "hotel_cost": 48000.0,
                "food_cost": 22000.0,
                "transportation_cost": 18000.0,
                "activity_cost": 15000.0,
                "miscellaneous_cost": 9000.0,
                "total_cost": 112000.0
            },
            "hotelRecommendations": [
                {"name": "Grand Hotel Belvedere, Grindelwald", "rating": "4.9/5", "pricePerNight": "₹24,500/night", "distanceFromCenter": "0.3 km from center", "description": "Historic boutique hotel with panoramic views of the Eiger North Face and an outdoor infinity pool."},
                {"name": "Hotel Spinne Grindelwald", "rating": "4.6/5", "pricePerNight": "₹14,200/night", "distanceFromCenter": "0.1 km from center", "description": "Chalets facing the glacier with a luxurious heated wellness spa."}
            ],
            "attractions": [
                {"name": "Jungfraujoch - Top of Europe", "description": "Highest railway station in Europe offering glacier views and ice palaces.", "category": "Nature", "location": "Jungfrau Region", "rating": "4.9/5"},
                {"name": "First Cliff Walk by Tissot", "description": "Suspended walkway offering high-altitude Alpine views.", "category": "Adventure", "location": "Grindelwald First", "rating": "4.8/5"}
            ],
            "travelTips": [
                "Buy a Swiss Travel Pass to get unlimited travel on trains, buses, and boats.",
                "Always check mountain webcams before booking cable cars.",
                "Tap water is fresh and drinkable from almost every fountain."
            ]
        }
        
    # 4. JAPAN DEMO PACKAGE
    elif "japan" in dest:
        return {
            "tripSummary": {
                "destination": "Tokyo & Kyoto, Japan",
                "days": 7,
                "travelers": 2
            },
            "dailyItinerary": [
                {
                    "day": 1,
                    "weather": "Clear, 18°C",
                    "activities": [
                        {"time": "Morning", "title": "Senso-ji Temple & Nakamise Street", "description": "Visit Tokyo's oldest Buddhist temple and explore historic souvenir stalls.", "estimatedCost": 500, "duration": "2.5 hours", "location": "Asakusa"},
                        {"time": "Afternoon", "title": "Shibuya Crossing & Hachiko Statue", "description": "Experience the world's busiest pedestrian scramble and take photos from above.", "estimatedCost": 0, "duration": "2 hours", "location": "Shibuya"},
                        {"time": "Evening", "title": "Shinjuku Omoide Yokocho Food Tour", "description": "Sample grilled yakitori skewers in narrow atmospheric alleyways.", "estimatedCost": 2500, "duration": "3 hours", "location": "Shinjuku"}
                    ],
                    "restaurants": [
                        {"name": "Ichiran Ramen Shibuya", "cuisine": "Tonkotsu Ramen", "recommendedMeal": "Lunch", "estimatedCost": 1200, "description": "Classic solo dining booths."},
                        {"name": "New York Grill Park Hyatt", "cuisine": "Kobe Beef & Jazz Bar", "recommendedMeal": "Dinner", "estimatedCost": 8500, "description": "Panoramic night skyline views."}
                    ]
                },
                {
                    "day": 2,
                    "weather": "Sunny, 17°C",
                    "activities": [
                        {"time": "Morning", "title": "Meiji Shrine & Harajuku Walk", "description": "Walk through serene forested shrine paths and explore colorful Takeshita street.", "estimatedCost": 0, "duration": "3 hours", "location": "Harajuku"},
                        {"time": "Afternoon", "title": "teamLab Planets TOKYO Digital Art", "description": "Walk through water and interact with immersive 3D digital art projections.", "estimatedCost": 2200, "duration": "2.5 hours", "location": "Toyosu"},
                        {"time": "Evening", "title": "Roppongi Hills Observation Deck", "description": "Sunset views of Tokyo Tower and city skyline.", "estimatedCost": 1500, "duration": "2 hours", "location": "Roppongi"}
                    ],
                    "restaurants": [
                        {"name": "Harajuku Gyozaro", "cuisine": "Gyoza dumplings", "recommendedMeal": "Lunch", "estimatedCost": 800, "description": "Simple and delicious pan-fried dumplings."},
                        {"name": "Sushizanmai Okonomu", "cuisine": "Sushi & Sashimi", "recommendedMeal": "Dinner", "estimatedCost": 3500, "description": "Fresh seafood selection."}
                    ]
                }
            ],
            "budgetBreakdown": {
                "hotel_cost": 38000.0,
                "food_cost": 16000.0,
                "transportation_cost": 14000.0,
                "activity_cost": 12000.0,
                "miscellaneous_cost": 7000.0,
                "total_cost": 87000.0
            },
            "hotelRecommendations": [
                {"name": "Shinjuku Granbell Hotel", "rating": "4.6/5", "pricePerNight": "₹9,800/night", "distanceFromCenter": "0.5 km from station", "description": "Trendy modern rooms in the heart of Tokyo nightlife and restaurants."},
                {"name": "Kyoto Heritage Ryokan Ryokufuso", "rating": "4.8/5", "pricePerNight": "₹16,500/night", "distanceFromCenter": "1.2 km from Kyoto station", "description": "Traditional tatami mat rooms with private public baths and multi-course kaiseki dinners."}
            ],
            "attractions": [
                {"name": "Fushimi Inari-taisha Shrine", "description": "Thousands of vibrant orange torii gates winding up the mountain path.", "category": "Culture", "location": "Kyoto", "rating": "4.9/5"},
                {"name": "teamLab Planets", "description": "Spectacular sensory museum with digital projections.", "category": "Art", "location": "Tokyo", "rating": "4.8/5"}
            ],
            "travelTips": [
                "Get a Suica or Pasmo IC card for easy train transfers.",
                "Tipping is strictly not customary in Japan.",
                "Rent a pocket Wi-Fi or eSIM for navigation."
            ]
        }
        
    # DEFAULT GOA DEMO PACKAGE
    else:
        return {
            "tripSummary": {
                "destination": "Goa, India",
                "days": 3,
                "travelers": 2
            },
            "dailyItinerary": [
                {
                    "day": 1,
                    "weather": "Sunny, 31°C",
                    "activities": [
                        {"time": "Morning", "title": "Check-in Candolim Beach Hotel", "description": "Arrive and settle in to your beachfront resort. Take a walk along the shore.", "estimatedCost": 0, "duration": "2 hours", "location": "Candolim Beach"},
                        {"time": "Afternoon", "title": "Fort Aguada Exploration", "description": "Tour the historic 17th-century Portuguese lighthouse and coastal ramparts.", "estimatedCost": 50, "duration": "2.5 hours", "location": "Fort Aguada"},
                        {"time": "Evening", "title": "Candolim Sunset Beach Walk", "description": "Walk along the sand dunes and enjoy Goan street food like fish cutlets.", "estimatedCost": 300, "duration": "1.5 hours", "location": "Beachfront"}
                    ],
                    "restaurants": [
                        {"name": "Lemon Tree Cafe", "cuisine": "Continental", "recommendedMeal": "Lunch", "estimatedCost": 800, "description": "Comfortable garden cafe."},
                        {"name": "Fisherman's Wharf", "cuisine": "Goan Seafood", "recommendedMeal": "Dinner", "estimatedCost": 1800, "description": "Stellar riverside dining."}
                    ]
                }
            ],
            "budgetBreakdown": {
                "hotel_cost": 15000.0,
                "food_cost": 6000.0,
                "transportation_cost": 4500.0,
                "activity_cost": 2500.0,
                "miscellaneous_cost": 2000.0,
                "total_cost": 30000.0
            },
            "hotelRecommendations": [
                {"name": "Taj Fort Aguada Resort", "rating": "4.9/5", "pricePerNight": "₹15,000/night", "distanceFromCenter": "0.1 km from beach", "description": "Stunning luxury resort facing the Arabian Sea."},
                {"name": "Lemon Tree Amarante Resort", "rating": "4.4/5", "pricePerNight": "₹6,000/night", "distanceFromCenter": "0.8 km from beach", "description": "Cozy Portuguese-style boutique lodging."}
            ],
            "attractions": [
                {"name": "Fort Aguada", "description": "17th-century lighthouse with historic lookouts.", "category": "Culture", "location": "Candolim", "rating": "4.5/5"},
                {"name": "Anjuna Flea Market", "description": "Famous open bazaar with clothes, spices, and music.", "category": "Shopping", "location": "Anjuna", "rating": "4.4/5"}
            ],
            "travelTips": [
                "Rent a scooter to explore beach spots easily.",
                "Always carry cash for local street shopping.",
                "Book beach watersports in the early morning to avoid queues."
            ]
        }
