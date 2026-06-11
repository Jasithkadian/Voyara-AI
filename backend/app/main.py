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
    title="voira API",
    description="Backend API for voira - AI-powered personalized travel planner, budget estimator, and recommender.",
    version="2.0.0"
)

# Configure CORS for Frontend integration
allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
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
        "message": "Welcome to the voira API!",
        "docs_url": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
