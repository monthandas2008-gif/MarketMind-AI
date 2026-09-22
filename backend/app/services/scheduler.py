"""
MarketScheduler for MarketMind.
Automates the daily market intelligence pipeline using APScheduler.
Aligned to Indian Standard Time (Asia/Kolkata) with exchange trading calendar awareness.
"""

import logging
from datetime import datetime, date
from typing import Optional, Set
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.agents.orchestrator import orchestrator_service

logger = logging.getLogger(__name__)

# Standard Indian Exchange (NSE) Holidays for reference
NSE_HOLIDAYS: Set[str] = {
    "2026-01-26",  # Republic Day
    "2026-03-03",  # Mahashivratri
    "2026-03-17",  # Holi
    "2026-04-03",  # Good Friday
    "2026-04-14",  # Dr. Ambedkar Jayanti
    "2026-05-01",  # Maharashtra Day
    "2026-06-17",  # Bakri Id
    "2026-08-15",  # Independence Day
    "2026-10-02",  # Mahatma Gandhi Jayanti
    "2026-10-20",  # Dussehra
    "2026-11-08",  # Diwali Laxmi Pujan
    "2026-11-10",  # Diwali Balipratipada
    "2026-12-25",  # Christmas
}

class MarketScheduler:
    def __init__(self):
        self.tz = pytz.timezone(settings.market.timezone or "Asia/Kolkata")
        self.scheduler = AsyncIOScheduler(timezone=self.tz)
        self.is_running = False

    def is_trading_day(self, check_date: Optional[date] = None) -> bool:
        """
        Returns True if check_date is a regular trading day (Monday to Friday, non-holiday).
        """
        target = check_date or datetime.now(self.tz).date()
        # Check weekend: 5 = Saturday, 6 = Sunday
        if target.weekday() in (5, 6):
            return False
        # Check exchange holidays
        date_str = target.strftime("%Y-%m-%d")
        if date_str in NSE_HOLIDAYS:
            return False
        return True

    async def daily_pipeline(self):
        """
        The automated post-market closing pipeline.
        Fires at 3:50 PM IST Monday to Friday.
        """
        today = datetime.now(self.tz).date()
        logger.info(f"Triggering scheduled Daily Market Pipeline for {today}...")

        if not self.is_trading_day(today):
            logger.info(f"Skipping daily pipeline: {today} is a weekend or NSE trading holiday.")
            return

        try:
            report = await orchestrator_service.generate_daily_report()
            logger.info(f"Daily pipeline completed successfully. Report created for {report.report_date}")
        except Exception as e:
            logger.error(f"Daily pipeline execution failed: {e}", exc_info=True)

    def setup_scheduler(self):
        """Configures the cron trigger and registers jobs."""
        # 3:50 PM IST, Monday through Friday
        trigger = CronTrigger(hour=15, minute=50, day_of_week="mon-fri", timezone=self.tz)
        self.scheduler.add_job(
            self.daily_pipeline,
            trigger=trigger,
            id="marketmind_daily_pipeline",
            name="Daily Indian Market Intelligence Pipeline (3:50 PM IST)",
            replace_existing=True
        )
        logger.info("MarketMind daily pipeline scheduled for 15:50 IST (Mon-Fri).")

    def start(self):
        if not self.is_running:
            self.setup_scheduler()
            self.scheduler.start()
            self.is_running = True
            logger.info("MarketScheduler started.")

    def shutdown(self):
        if self.is_running:
            self.scheduler.shutdown(wait=False)
            self.is_running = False
            logger.info("MarketScheduler stopped.")

    async def run_manually_now(self):
        """Allows manual triggering of the pipeline for live demonstration."""
        logger.info("Manually triggering Daily Market Pipeline...")
        return await orchestrator_service.generate_daily_report()

market_scheduler = MarketScheduler()
