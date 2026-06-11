# ✈️ AI Travel Copilot

AI Travel Copilot is a production-ready, full-stack, AI-powered travel planning platform. It helps users generate personalized day-wise travel itineraries, budget estimates, attraction lists, hotel recommendations, and dynamic updates based on weather, budget, or duration changes. It also includes an integrated AI Travel Assistant Chatbot that uses active trip details as context.

---

## 🌟 Key Features

1. **AI Trip Planner:** Enter source, destination, budget, travel dates, travelers, and interests. The copilot generates a structured day-by-day itinerary.
2. **Interactive Budget Estimator:** Provides a breakdown of costs for hotels, food, transportation, and activities, accompanied by an interactive Recharts donut chart.
3. **Hotel Recommendations:** Curates a list of hotels complete with ratings, price range, and custom descriptions explaining the match.
4. **Attraction Discovery:** Discovers top attractions and hidden gems categorized by *Adventure, Nature, Food, Culture,* and *Nightlife*.
5. **AI Travel Assistant Chat:** An in-context chat interface to ask questions like *"What should I pack?"* or *"What should I do tonight?"*.
6. **Dynamic Replanner:** Re-generates and updates the saved itinerary using natural language instructions (e.g. *"It's raining tomorrow, swap beach visits for museums"*).
7. **User Authentication:** Registration, login, and logout secured with JWT authentication stored in a PostgreSQL database.
8. **Premium Dashboard & UI:** Fully responsive, light/dark mode, glassmorphism aesthetics, and smooth animations inspired by Google Travel and Airbnb.

---

## 🏗️ Project Structure

```text
flyscanner/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   └── connection.py       # SQL database session setup & SQLite fallback
│   │   ├── models/
│   │   │   ├── user.py             # User DB model (Auth)
│   │   │   ├── trip.py             # Saved trip details (recommenders & budget JSON)
│   │   │   └── itinerary.py        # Day-by-day activity timelines
│   │   ├── routes/
│   │   │   ├── auth.py             # Register, Login & JWT utilities
│   │   │   ├── trips.py            # Planner, Saver, History & Replanner routes
│   │   │   └── ai.py               # AI Assistant Chat route
│   │   ├── services/
│   │   │   ├── trip_generator.py   # OpenAI GPT-4o-mini structured generator
│   │   │   ├── budget_engine.py    # Rule-based pricing heuristics
│   │   │   └── recommendation_engine.py  # Stay & Attraction filters
│   │   └── main.py                 # FastAPI application & startup hook
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Navigation header with Auth Modal
│   │   │   ├── HeroSection.tsx     # Landing page hero
│   │   │   ├── TripForm.tsx        # Multi-step questionnaire wizard
│   │   │   ├── BudgetCard.tsx      # Recharts donut chart expense visualizer
│   │   │   ├── ItineraryCard.tsx   # Interactive tabbed day timeline
│   │   │   ├── HotelCard.tsx       # Hotel detail card
│   │   │   ├── AttractionCard.tsx  # Categorized attractions cards
│   │   │   └── LoadingState.tsx    # Pulsing progress loader
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Product Landing Page
│   │   │   ├── Dashboard.tsx       # Statistics & Recent Trips overview
│   │   │   ├── TripPlanner.tsx     # Main planning workspace & chatbot
│   │   │   ├── MyTrips.tsx         # Saved trips grid
│   │   │   └── Profile.tsx         # Account summary
│   │   ├── services/
│   │   │   └── api.ts              # Axios wrapper with JWT injection
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Auth tokens & global light/dark theme state
│   │   ├── App.tsx                 # Routing shell
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── tailwind.config.js
│   └── nginx.conf                  # Production SPA routing server
├── docker-compose.yml              # Combined stack composition
├── schema.sql                      # SQL DDL script for PostgreSQL
└── .env.example                    # Configuration template
```

---

## 🚀 Quick Start (Docker Compose)

The fastest way to spin up the entire production-grade stack (PostgreSQL + FastAPI + React Frontend) is with Docker Compose.

### Prerequisite
Make sure you have [Docker](https://www.docker.com/) installed and running.

### Execution
1. Create a `.env` file in the root directory and add your OpenAI API Key:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ```
2. Run the following command in the root folder:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to:
   - **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **FastAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Manual Local Setup

If you prefer to run the components locally without Docker, follow these steps:

### 1. Database Setup
The backend is built with a **smart database fallback**. By default, it will check if `DATABASE_URL` is set in `backend/.env`. If not, or if set to SQLite, it will automatically instantiate a local SQLite database file `flyscanner.db` in the `backend/` directory on startup and create the tables. No manual database creation is required!

If you prefer using PostgreSQL locally:
1. Run a local PostgreSQL instance.
2. Create a database named `flyscanner`.
3. Set `DATABASE_URL=postgresql://your_user:your_password@localhost:5432/flyscanner` in `backend/.env`.

### 2. Backend Setup
1. Move to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` configurations to `.env` and fill in details.
5. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Move to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. The React application will start at [http://localhost:5173](http://localhost:5173).

---

## 🗄️ Database Schema

The database consists of three relational tables: `users`, `trips`, and `itineraries`. Refer to [schema.sql](file:///C:/Users/Umang%20Kadian/Desktop/flyscanner/schema.sql) for the exact DDL.

### Users
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR UNIQUE)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### Trips
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users.id)
- `source` (VARCHAR)
- `destination` (VARCHAR)
- `budget` (DOUBLE PRECISION)
- `days` (INTEGER)
- `dates` (VARCHAR)
- `interests` (JSONB)
- `travelers` (INTEGER)
- `budget_breakdown` (JSONB)
- `hotel_recommendations` (JSONB)
- `attraction_recommendations` (JSONB)
- `travel_tips` (JSONB)
- `created_at` (TIMESTAMP)

### Itineraries
- `id` (SERIAL PRIMARY KEY)
- `trip_id` (INTEGER REFERENCES trips.id)
- `day_number` (INTEGER)
- `activities` (JSONB)

---

## 🔌 API Documentation

Detailed Swagger specifications are available at `http://localhost:8000/docs` when the backend is running.

### Authentication Endpoints
- `POST /auth/register` - Create a new user account.
- `POST /auth/login` - Authenticate credentials and get a JWT access token.

### Travel & Planning Endpoints
- `POST /trips/generate` - Pass travel preferences to get a structured JSON plan (Unauthenticated or Authenticated).
- `POST /trips/save` - Save the generated travel plan to user history (Requires Auth).
- `GET /trips/history` - List all past saved trips for the user (Requires Auth).
- `DELETE /trips/{id}` - Delete a saved trip by ID (Requires Auth).
- `POST /trips/replan` - Supply natural language changes to modify the trip details (Requires Auth).

### AI Interaction
- `POST /chat` - Interactive assistant chat using trip context (Requires Auth).

---

## 🚀 Deployment Instructions

### Frontend (Vercel)
Vite applications deploy seamlessly on Vercel.
1. Connect your Github repository containing the project to Vercel.
2. Set the root directory of the Vercel project to `frontend/`.
3. Add a build-time environment variable:
   - `VITE_API_URL` = your_deployed_backend_api_url (e.g. `https://api-travelcopilot.render.com`).
4. Vercel will build the React application and distribute it on their global CDN.

### Backend (Render or AWS)
You can deploy the FastAPI server using Render's Web Service or AWS ECS:
1. Create a new Web Service on Render and point it to the repository.
2. Select Docker as the environment, and set the Docker path relative to `backend/Dockerfile`.
3. Add the following environment variables:
   - `DATABASE_URL` = connection string for your cloud PostgreSQL database.
   - `JWT_SECRET` = random security string.
   - `OPENAI_API_KEY` = your paid OpenAI developer key.
4. Render will build the Docker container and expose a secure URL (`https://...`).
