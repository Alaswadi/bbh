from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

from backend.database import init_db, SessionLocal, ScheduledScan, Scan
from backend.routers import scans, results
from backend.recon.engine import start_scan_task

# Scheduler instance
scheduler = AsyncIOScheduler()


async def run_scheduled_scans():
    """Check and run any due scheduled scans."""
    db = SessionLocal()
    try:
        active_schedules = db.query(ScheduledScan).filter(ScheduledScan.is_active == True).all()
        
        for scheduled in active_schedules:
            # Create a new scan
            scan = Scan(domain=scheduled.domain, is_scheduled=True)
            db.add(scan)
            db.commit()
            db.refresh(scan)
            
            # Update last run
            scheduled.last_run = datetime.utcnow()
            db.commit()
            
            # Run scan in background
            await start_scan_task(scan.id, db)
            
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    init_db()
    print("[*] Database initialized")
    
    # Start scheduler for periodic scans (runs every hour to check schedules)
    scheduler.add_job(
        check_and_run_scheduled,
        trigger='interval',
        minutes=60,
        id='scheduled_scan_checker'
    )
    scheduler.start()
    print("[*] Scheduler started")
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    print("[*] Scheduler stopped")


async def check_and_run_scheduled():
    """Check scheduled scans and run if needed based on cron expression."""
    db = SessionLocal()
    try:
        active_schedules = db.query(ScheduledScan).filter(ScheduledScan.is_active == True).all()
        now = datetime.utcnow()
        
        for scheduled in active_schedules:
            try:
                trigger = CronTrigger.from_crontab(scheduled.cron_expression)
                next_run = trigger.get_next_fire_time(None, now)
                
                # If last_run is None or next_run is in the past, run now
                should_run = False
                if scheduled.last_run is None:
                    should_run = True
                elif scheduled.last_run < now and (next_run is None or next_run <= now):
                    should_run = True
                
                if should_run:
                    # Create a new scan
                    scan = Scan(domain=scheduled.domain, is_scheduled=True)
                    db.add(scan)
                    db.commit()
                    db.refresh(scan)
                    
                    # Update last run
                    scheduled.last_run = now
                    scheduled.next_run = trigger.get_next_fire_time(None, now)
                    db.commit()
                    
                    print(f"[+] Running scheduled scan for {scheduled.domain}")
                    await start_scan_task(scan.id, db)
                    
            except Exception as e:
                print(f"[!] Error processing schedule {scheduled.id}: {e}")
                
    finally:
        db.close()


# Create FastAPI app
app = FastAPI(
    title="Bug Bounty Recon Framework",
    description="Professional reconnaissance tool with subfinder, naabu, httpx, and gau integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scans.router)
app.include_router(results.router)


@app.get("/")
def root():
    return {
        "name": "Bug Bounty Recon Framework",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
