import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

JOB_ID = "daily_pipeline"


class PipelineService:
    def __init__(self, data_service, model_service):
        self.data_service = data_service
        self.model_service = model_service
        self.scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
        self.status = {
            "last_run": None,
            "status": "never_run",
            "next_run": None,
            "message": "Pipeline has not run yet",
        }

    def _run_pipeline(self):
        logger.info("Pipeline: starting...")
        self.status["status"] = "running"
        try:
            self.data_service.fetch_latest()
            self.model_service.update_predictions()
            self.status = {
                "last_run": datetime.now().isoformat(),
                "status": "success",
                "message": "Data and predictions updated successfully",
                "next_run": self._next_run_time(),
            }
            logger.info("Pipeline: completed successfully")
        except Exception as e:
            self.status = {
                "last_run": datetime.now().isoformat(),
                "status": "error",
                "message": str(e),
                "next_run": self._next_run_time(),
            }
            logger.error(f"Pipeline: failed — {e}")

    def _next_run_time(self):
        job = self.scheduler.get_job(JOB_ID)
        if job and job.next_run_time:
            return job.next_run_time.isoformat()
        return None

    def start(self):
        # Daily at 18:30 IST (after NSE close)
        self.scheduler.add_job(
            self._run_pipeline,
            trigger=CronTrigger(hour=18, minute=30),
            id=JOB_ID,
            name="Daily Stock Data Pipeline",
            replace_existing=True,
        )
        self.scheduler.start()
        self.status["next_run"] = self._next_run_time()
        logger.info("Pipeline scheduler started")

    def stop(self):
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    def run_now(self):
        self._run_pipeline()
        return self.status

    def get_status(self) -> dict:
        self.status["next_run"] = self._next_run_time()
        return self.status
