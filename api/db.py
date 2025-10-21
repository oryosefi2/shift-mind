import asyncpg
import asyncio
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create database connection pool"""
        max_retries = 5
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self.pool = await asyncpg.create_pool(
                    host=os.getenv("POSTGRES_HOST", "localhost"),
                    port=int(os.getenv("POSTGRES_PORT", "5431")),
                    user=os.getenv("POSTGRES_USER", "postgres"),
                    password=os.getenv("POSTGRES_PASSWORD", "postgres"),
                    database=os.getenv("POSTGRES_DB", "shiftmind_test"),
                    min_size=1,
                    max_size=10
                )
                logger.info("Database connection pool created successfully")
                return
            except Exception as e:
                logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    logger.error(f"Failed to create database pool after {max_retries} attempts: {e}")
                    # Don't raise - let the app start without DB for now
                    self.pool = None
                else:
                    await asyncio.sleep(retry_delay)
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def get_businesses(self):
        """Get all businesses - return id and name only"""
        if not self.pool:
            raise Exception("Database connection not available")
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, name FROM businesses ORDER BY name"
            )
            return [{"id": str(row["id"]), "name": row["name"]} for row in rows]
    
    async def get_employees(self, business_id: str):
        """Get employees for a business - return short list"""
        if not self.pool:
            raise Exception("Database connection not available")
            
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, first_name, last_name, email, hourly_rate 
                FROM employees 
                WHERE business_id = $1
                ORDER BY first_name, last_name
                """,
                business_id
            )
            return [
                {
                    "id": str(row["id"]),
                    "first_name": row["first_name"],
                    "last_name": row["last_name"],
                    "email": row["email"],
                    "hourly_rate": float(row["hourly_rate"]) if row["hourly_rate"] else None
                }
                for row in rows
            ]

    async def fetch_all(self, query: str, *args):
        """Execute a SELECT query and return all rows"""
        if not self.pool:
            raise Exception("Database connection not available")
            
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetch_one(self, query: str, *args):
        """Execute a query and return one row"""
        if not self.pool:
            raise Exception("Database connection not available")
            
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

# Global database instance
db = Database()
