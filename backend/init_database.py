import logging
from database import DatabaseConfig, DatabaseManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_database():
    try:
        config = DatabaseConfig.from_env()
        db = DatabaseManager(config)

        if not db.health_check():
            logger.error("❌ Database connection failed!")
            return False
        
        logger.info("✓ Database connection successful")

        logger.info("Creating database tables...")
        db.create_all_tables()
        logger.info("✓ All tables created successfully!")
        
        logger.info("\n✅ Database initialization complete!")
        logger.info("You can now start the application.")
        
        return True
        
    except Exception as e:
        logger.error(f"\n❌ Error during database initialization: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'db' in locals():
            db.close()


if __name__ == "__main__":
    success = init_database()
    exit(0 if success else 1)


