"""Database session and engine management using SQLModel."""

from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from app.config import get_settings

settings = get_settings()
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)


def create_db_and_tables() -> None:
    """Create all database tables registered in SQLModel metadata."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session within context management for request dependency injection."""
    with Session(engine) as session:
        yield session
