-- ==========================================
-- AI TRAVEL COPILOT - POSTGRESQL SCHEMA DDL
-- ==========================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for rapid user retrieval
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(255),
    destination VARCHAR(255) NOT NULL,
    budget DOUBLE PRECISION NOT NULL,
    days INTEGER NOT NULL,
    dates VARCHAR(255),
    interests JSONB,                  -- List of selected interests
    travelers INTEGER DEFAULT 1,
    budget_breakdown JSONB,           -- Category-wise cost allocations
    hotel_recommendations JSONB,      -- Curated hotel list
    attraction_recommendations JSONB,  -- Categorized activities & sights
    travel_tips JSONB,                -- Custom travel advice
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_id to query user trip history fast
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);

-- 3. Itineraries Table
CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    activities JSONB NOT NULL         -- Timeline of morning/afternoon/evening events
);

-- Index on trip_id for fetching itinerary details
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
