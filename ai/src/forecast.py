# Copilot: baseline_mavg() + apply_multipliers()
"""
AI Forecast Module

Implements baseline demand forecasting with multipliers from seasonal profiles.
"""

import asyncio
import asyncpg
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class ForecastInput:
    """Input parameters for demand forecasting"""
    business_id: str
    target_week: str  # Format: YYYY-WW
    lookback_weeks: int = 8  # Default lookback period for baseline
    

@dataclass
class HourlyForecast:
    """Single hourly forecast result"""
    date: str
    hour_of_day: int
    forecasted_demand: float
    confidence_score: float
    baseline_value: float
    applied_multiplier: float


class DemandForecaster:
    """Handles demand forecasting with baseline + multipliers"""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Initialize database connection pool"""
        self.pool = await asyncpg.create_pool(
            self.db_url,
            min_size=1,
            max_size=5
        )
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def load_demand_history(
        self, 
        business_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> pd.DataFrame:
        """Load demand history for the given business and date range"""
        
        query = """
        SELECT date, hour_of_day, demand_value, demand_type
        FROM demand_history 
        WHERE business_id = $1 
          AND date >= $2 
          AND date <= $3
        ORDER BY date, hour_of_day
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, business_id, start_date.date(), end_date.date())
        
        if not rows:
            logger.warning(f"No demand history found for business {business_id}")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame([dict(row) for row in rows])
        df['datetime'] = pd.to_datetime(df['date']) + pd.to_timedelta(df['hour_of_day'], unit='h')
        
        return df
    
    async def load_active_multipliers(self, business_id: str) -> Dict[int, float]:
        """Load active seasonal multipliers for the business"""
        
        query = """
        SELECT multiplier_data
        FROM seasonal_profiles 
        WHERE business_id = $1 AND is_active = true
        ORDER BY priority ASC
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, business_id)
        
        # Combine multipliers by priority (lower priority = higher precedence)
        combined_multipliers = {}
        
        for row in rows:
            multiplier_data = row['multiplier_data'] or {}
            
            # If multiplier_data is a string (JSON), parse it
            if isinstance(multiplier_data, str):
                try:
                    multiplier_data = json.loads(multiplier_data)
                except json.JSONDecodeError:
                    multiplier_data = {}
            
            # Convert string keys to integers and merge
            for hour_str, multiplier in multiplier_data.items():
                try:
                    hour = int(hour_str)
                    if 0 <= hour <= 23:
                        # First profile (highest priority) wins
                        if hour not in combined_multipliers:
                            combined_multipliers[hour] = float(multiplier)
                except (ValueError, TypeError):
                    continue
        
        # Fill missing hours with 1.0 (no change)
        for hour in range(24):
            if hour not in combined_multipliers:
                combined_multipliers[hour] = 1.0
        
        return combined_multipliers
    
    def baseline_mavg(self, demand_df: pd.DataFrame, lookback_weeks: int = 8) -> Dict[int, float]:
        """
        Compute baseline demand using moving average for each hour of day
        
        Args:
            demand_df: DataFrame with demand history
            lookback_weeks: Number of weeks to look back for baseline calculation
            
        Returns:
            Dictionary mapping hour_of_day to baseline demand value
        """
        
        if demand_df.empty:
            # Return default baseline if no historical data
            return {hour: 1.0 for hour in range(24)}
        
        # Group by hour_of_day and calculate mean demand
        hourly_baseline = demand_df.groupby('hour_of_day')['demand_value'].agg([
            'mean',
            'std',
            'count'
        ]).to_dict('index')
        
        baseline_values = {}
        
        for hour in range(24):
            if hour in hourly_baseline:
                stats = hourly_baseline[hour]
                mean_demand = stats['mean']
                count = stats['count']
                
                # Weight the baseline by data quality
                confidence_weight = min(count / (lookback_weeks * 7), 1.0)
                baseline_values[hour] = max(mean_demand * confidence_weight, 0.1)
            else:
                # No data for this hour, use minimal baseline
                baseline_values[hour] = 0.1
        
        return baseline_values
    
    def apply_multipliers(
        self, 
        baseline: Dict[int, float], 
        multipliers: Dict[int, float]
    ) -> Dict[int, float]:
        """
        Apply seasonal multipliers to baseline values
        
        Args:
            baseline: Hourly baseline demand values
            multipliers: Hourly multiplier values from seasonal profiles
            
        Returns:
            Dictionary mapping hour_of_day to adjusted demand forecast
        """
        
        adjusted_forecast = {}
        
        for hour in range(24):
            base_value = baseline.get(hour, 0.1)
            multiplier = multipliers.get(hour, 1.0)
            
            # Apply multiplier with bounds checking
            adjusted_value = base_value * multiplier
            adjusted_forecast[hour] = max(adjusted_value, 0.0)
        
        return adjusted_forecast
    
    def calculate_confidence(
        self, 
        demand_df: pd.DataFrame, 
        baseline: Dict[int, float],
        lookback_weeks: int = 8
    ) -> Dict[int, float]:
        """Calculate confidence score for each hour based on data quality"""
        
        confidence_scores = {}
        
        if demand_df.empty:
            return {hour: 0.1 for hour in range(24)}
        
        # Calculate variance and data availability for each hour
        hourly_stats = demand_df.groupby('hour_of_day')['demand_value'].agg([
            'std',
            'count'
        ]).to_dict('index')
        
        for hour in range(24):
            if hour in hourly_stats:
                stats = hourly_stats[hour]
                count = stats['count']
                std = stats.get('std', 0) or 0
                base_value = baseline.get(hour, 1.0)
                
                # Confidence based on data availability and consistency
                data_confidence = min(count / (lookback_weeks * 7), 1.0)
                
                # Lower confidence for high variance relative to baseline
                if base_value > 0:
                    cv = std / base_value  # Coefficient of variation
                    variance_confidence = max(1.0 - (cv * 0.5), 0.1)
                else:
                    variance_confidence = 0.1
                
                confidence_scores[hour] = min(data_confidence * variance_confidence, 1.0)
            else:
                confidence_scores[hour] = 0.1
        
        return confidence_scores
    
    def week_to_dates(self, week_str: str) -> Tuple[datetime, datetime]:
        """Convert YYYY-WW format to start/end dates"""
        try:
            year, week = map(int, week_str.split('-'))
            
            # Calculate first day of the week (Monday)
            jan_4 = datetime(year, 1, 4)
            week_start = jan_4 + timedelta(days=(week - 1) * 7 - jan_4.weekday())
            week_end = week_start + timedelta(days=6)
            
            return week_start, week_end
            
        except (ValueError, AttributeError) as e:
            raise ValueError(f"Invalid week format '{week_str}'. Expected YYYY-WW") from e
    
    async def generate_forecast(self, forecast_input: ForecastInput) -> List[HourlyForecast]:
        """
        Generate hourly demand forecast for the target week
        
        Args:
            forecast_input: Forecast parameters
            
        Returns:
            List of hourly forecasts for the target week
        """
        
        target_start, target_end = self.week_to_dates(forecast_input.target_week)
        
        # Calculate lookback period
        lookback_start = target_start - timedelta(weeks=forecast_input.lookback_weeks)
        lookback_end = target_start - timedelta(days=1)
        
        logger.info(
            f"Generating forecast for business {forecast_input.business_id}, "
            f"week {forecast_input.target_week} ({target_start.date()} to {target_end.date()}), "
            f"using data from {lookback_start.date()} to {lookback_end.date()}"
        )
        
        # Load historical demand data
        demand_df = await self.load_demand_history(
            forecast_input.business_id,
            lookback_start,
            lookback_end
        )
        
        # Load active multipliers
        multipliers = await self.load_active_multipliers(forecast_input.business_id)
        
        # Calculate baseline using moving average
        baseline = self.baseline_mavg(demand_df, forecast_input.lookback_weeks)
        
        # Apply multipliers to get final forecast
        forecast_values = self.apply_multipliers(baseline, multipliers)
        
        # Calculate confidence scores
        confidence_scores = self.calculate_confidence(
            demand_df, baseline, forecast_input.lookback_weeks
        )
        
        # Generate forecasts for each hour of the target week
        forecasts = []
        current_date = target_start.date()
        
        while current_date <= target_end.date():
            for hour in range(24):
                forecast = HourlyForecast(
                    date=current_date.isoformat(),
                    hour_of_day=hour,
                    forecasted_demand=round(forecast_values[hour], 2),
                    confidence_score=round(confidence_scores[hour], 2),
                    baseline_value=round(baseline[hour], 2),
                    applied_multiplier=multipliers[hour]
                )
                forecasts.append(forecast)
            
            current_date += timedelta(days=1)
        
        return forecasts
