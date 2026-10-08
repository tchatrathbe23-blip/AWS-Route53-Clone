from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, hosted_zones, dns_records

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AWS Route53 Clone Backend REST API built with FastAPI and SQLite"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any origin for local dev/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(hosted_zones.router, prefix=settings.API_V1_STR)
app.include_router(dns_records.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "AWS Route53 Clone API",
        "version": settings.VERSION
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AWS Route53 API Clone",
        "docs": "/docs",
        "health": "/health"
    }
