---
title: Voyara API
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# Voyara AI Travel Copilot - Backend

Voyara is an AI-powered travel companion designed to streamline trip planning, budget estimation, and destination discovery. This repository contains the FastAPI backend that powers the Voyara ecosystem, providing robust APIs for authentication, trip generation, real-time chat, and travel intelligence.

## FastAPI Architecture

The backend is built using **FastAPI**, a modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints.

- **High Performance**: Built on top of Starlette and Pydantic.
- **Auto-generated Documentation**: Interactive API docs available via Swagger UI and ReDoc.
- **Asynchronous Support**: Fully supports `async`/`await` for efficient I/O operations.
- **Type Safety**: Leverages Python type hints for data validation and serialization.

## Folder Structure

```text
app/
├── database/     # Database connection and session management
├── models/       # SQLAlchemy ORM models
├── routes/       # API endpoints (Auth, Trips, Chat, Features)
├── services/     # Business logic and external service integrations
└── main.py       # Application entry point and configuration
```

## API Endpoints

The API is structured into several modular routers:

- **Authentication (`/api/auth`)**: User registration, login, and profile management.
- **Trip Management (`/api/trips`)**: CRUD operations for travel itineraries and trip details.
- **AI Chat (`/api/chat`)**: Context-aware travel assistant powered by OpenAI.
- **Travel Features (`/features`)**: Flight/Hotel search, weather updates, and budget estimation.
- **System (`/`)**: Root endpoint for health checks and documentation links.

## Environment Variables

The following environment variables are required for the application to function:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key for OpenAI services |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens |
| `ALLOWED_ORIGINS` | Comma-separated list of permitted CORS origins |
| `DATABASE_URL` | Connection string for the database (e.g., SQLite/PostgreSQL) |

## Docker Deployment

To build and run the backend using Docker:

```bash
# Build the Docker image
docker build -t voyara-backend .

# Run the container
docker run -p 7860:7860 --env-file .env voyara-backend
```

## Hugging Face Spaces Deployment

This backend is optimized for deployment on Hugging Face Spaces using the Docker SDK.

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces).
2. Select **Docker** as the SDK.
3. Upload the contents of the `backend/` directory.
4. Set the required secrets in the Space settings (Settings > Variables and secrets).
5. The Space will automatically build and deploy the container.

The application runs on:
`uvicorn app.main:app --host 0.0.0.0 --port 7860`

## Local Development Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload
   ```

5. **Access the Documentation**:
   - Swagger UI: `http://localhost:7860/docs`
   - ReDoc: `http://localhost:7860/redoc`
