import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.routes import auth, trips, chat, features

# Create tables on startup
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(
    title="AI Travel Copilot API V2",
    description="Backend API for AI-powered personalized travel planner, budget estimator, and recommender.",
    version="2.0.0"
)

# Configure CORS for Frontend integration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "*"  # Accept all for local testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with `/api` prefix
app.include_router(auth.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(features.router)

@app.on_event("startup")
def startup_event():
    try:
        from app.services.monitoring_service import start_price_alert_monitor
        start_price_alert_monitor()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to start price alert monitor: {e}")


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI Travel Copilot API V2!",
        "docs_url": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
