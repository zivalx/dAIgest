#!/usr/bin/env python3
"""
Database Initialization Script

Creates all tables and optionally seeds initial data.
Run this after setting up your environment variables.

Usage:
    python init_db.py [--reset]

Options:
    --reset: Drop all tables before creating (WARNING: destroys data)
"""
import asyncio
import argparse
import sys
import logging

from src.database import engine
from src.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database(reset=False):
    """Initialize the database schema."""
    logger.info("Starting database initialization...")

    async with engine.begin() as conn:
        if reset:
            logger.warning("RESET flag set - dropping all tables!")
            await conn.run_sync(Base.metadata.drop_all)
            logger.info("All tables dropped")

        logger.info("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Tables created successfully")

    logger.info("Database initialization complete!")


async def seed_sample_data():
    """Optionally seed sample data (for testing)."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    from src.models import SourceConfig
    import uuid

    logger.info("Seeding sample data...")

    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Sample Reddit config
        reddit_config = SourceConfig(
            id=uuid.uuid4(),
            name="Sample Reddit Config",
            source_type="reddit",
            credential_ref="REDDIT_CLIENT_1",
            collect_spec={
                "subreddits": ["python", "programming"],
                "sort": "hot",
                "max_posts": 20,
                "include_comments": False,
            },
            enabled=True,
        )
        session.add(reddit_config)

        # Sample YouTube config
        youtube_config = SourceConfig(
            id=uuid.uuid4(),
            name="Sample YouTube Config",
            source_type="youtube",
            credential_ref="YOUTUBE_API",
            collect_spec={
                "channels": ["@Veritasium", "@VSauce"],
                "max_videos": 5,
                "days_back": 7,
                "use_transcript_api": True,
            },
            enabled=True,
        )
        session.add(youtube_config)

        await session.commit()

    logger.info("Sample data seeded successfully")


def main():
    parser = argparse.ArgumentParser(description="Initialize Daigest database")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop all tables before creating (WARNING: destroys data)",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Seed sample data after initialization",
    )

    args = parser.parse_args()

    if args.reset:
        confirm = input("Are you sure you want to reset the database? This will DELETE ALL DATA. (yes/no): ")
        if confirm.lower() != "yes":
            print("Reset cancelled")
            sys.exit(0)

    # Run initialization
    asyncio.run(init_database(reset=args.reset))

    # Optionally seed data
    if args.seed:
        asyncio.run(seed_sample_data())


if __name__ == "__main__":
    main()
