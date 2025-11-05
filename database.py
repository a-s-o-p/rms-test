"""
Database Manager using SQLAlchemy
Handles connection pooling, session management, and database initialization
"""

import os
from typing import Generator, Optional
from contextlib import contextmanager
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from sqlalchemy.pool import QueuePool
from dataclasses import dataclass
import logging

from models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database configuration"""
    host: str
    port: int
    database: str
    user: str
    password: str
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    
    @classmethod
    def from_env(cls):
        """Load configuration from environment variables"""
        return cls(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "mydb"),
            user=os.getenv("DB_USER", "myuser"),
            password=os.getenv("DB_PASSWORD", "mypass"),
            pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
            pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
            echo=os.getenv("DB_ECHO", "false").lower() == "true"
        )
    
    def get_database_url(self) -> str:
        """Get SQLAlchemy database URL"""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


class DatabaseManager:
    """
    Database manager for SQLAlchemy
    Handles connection pooling and session management
    """
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = None
        self.session_factory = None
        self.scoped_session_factory = None
        self._initialize()
    
    def _initialize(self):
        """Initialize database engine and session factory"""
        try:
            # Create engine with connection pooling
            self.engine = create_engine(
                self.config.get_database_url(),
                poolclass=QueuePool,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                echo=self.config.echo,
                pool_pre_ping=True,  # Verify connections before using
            )
            
            # Enable pgvector extension
            with self.engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                conn.commit()
            
            # Create session factory
            self.session_factory = sessionmaker(
                bind=self.engine,
                expire_on_commit=False
            )
            
            # Create thread-safe scoped session
            self.scoped_session_factory = scoped_session(self.session_factory)
            
            logger.info("Database connection initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """
        Context manager for database sessions
        Automatically commits or rolls back on exception
        
        Usage:
            with db.session_scope() as session:
                session.query(Model).filter(...).all()
        """
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Session rollback due to error: {e}")
            raise
        finally:
            session.close()
    
    def get_session(self) -> Session:
        """
        Get a new session (manual management)
        Remember to close it when done!
        
        Usage:
            session = db.get_session()
            try:
                # do work
                session.commit()
            finally:
                session.close()
        """
        return self.session_factory()
    
    def get_scoped_session(self) -> Session:
        """
        Get thread-local scoped session
        Useful for web applications
        """
        return self.scoped_session_factory()
    
    def create_all_tables(self):
        """Create all tables in the database"""
        try:
            Base.metadata.create_all(self.engine)
            logger.info("All tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise
    
    def drop_all_tables(self):
        """Drop all tables in the database (use with caution!)"""
        try:
            Base.metadata.drop_all(self.engine)
            logger.info("All tables dropped successfully")
        except Exception as e:
            logger.error(f"Failed to drop tables: {e}")
            raise
    
    def close(self):
        """Close all connections and dispose of the engine"""
        if self.engine:
            self.scoped_session_factory.remove()
            self.engine.dispose()
            logger.info("Database connections closed")
    
    def execute_raw_sql(self, sql: str, params: dict = None):
        """
        Execute raw SQL (for migrations, etc.)
        
        Args:
            sql: SQL statement
            params: Optional parameters dictionary
        """
        with self.engine.connect() as conn:
            result = conn.execute(text(sql), params or {})
            conn.commit()
            return result
    
    def health_check(self) -> bool:
        """Check if database connection is healthy"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Event listeners for better connection handling
@event.listens_for(QueuePool, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Event fired when a new connection is created"""
    logger.debug("New database connection established")


@event.listens_for(QueuePool, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Event fired when connection is checked out from pool"""
    logger.debug("Connection checked out from pool")


@event.listens_for(QueuePool, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Event fired when connection is returned to pool"""
    logger.debug("Connection returned to pool")


# Singleton instance (optional)
_db_instance: Optional[DatabaseManager] = None


def get_db() -> DatabaseManager:
    """
    Get singleton database instance
    Useful for dependency injection in web frameworks
    """
    global _db_instance
    if _db_instance is None:
        config = DatabaseConfig.from_env()
        _db_instance = DatabaseManager(config)
    return _db_instance


def init_db(config: DatabaseConfig = None) -> DatabaseManager:
    """
    Initialize database with configuration
    
    Args:
        config: DatabaseConfig instance, if None loads from environment
    
    Returns:
        DatabaseManager instance
    """
    if config is None:
        config = DatabaseConfig.from_env()
    return DatabaseManager(config)


if __name__ == "__main__":
    # Test connection
    config = DatabaseConfig.from_env()
    db = DatabaseManager(config)
    
    try:
        # Health check
        if db.health_check():
            print("✓ Database connection successful")
        else:
            print("✗ Database connection failed")
        
        # Create tables
        db.create_all_tables()
        print("✓ Tables created")
        
    finally:
        db.close()
