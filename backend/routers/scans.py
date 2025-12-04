from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import asyncio

from backend.database import get_db, Scan, Subdomain, ScheduledScan
from backend.recon.engine import start_scan_task, running_scans

router = APIRouter(prefix="/scans", tags=["scans"])


class ScanCreate(BaseModel):
    domain: str
    

class ScheduledScanCreate(BaseModel):
    domain: str
    cron_expression: str  # e.g., "0 0 * * *" for daily at midnight


class ScanResponse(BaseModel):
    id: int
    domain: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


@router.post("/", response_model=ScanResponse)
async def create_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start a new reconnaissance scan."""
    # Create scan record
    scan = Scan(domain=scan_data.domain.strip().lower())
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Start background scan task
    background_tasks.add_task(run_scan_background, scan.id)
    
    return scan


async def run_scan_background(scan_id: int):
    """Run scan in background with new DB session."""
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        running_scans[scan_id] = True
        await start_scan_task(scan_id, db)
    finally:
        db.close()


@router.get("/")
def list_scans(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all scans with pagination."""
    scans = db.query(Scan).order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(Scan).count()
    return {"scans": scans, "total": total}


@router.get("/{scan_id}")
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Get scan details with results."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    subdomains = db.query(Subdomain).filter(Subdomain.scan_id == scan_id).all()
    
    return {
        "scan": scan,
        "subdomains": subdomains,
        "stats": {
            "total_subdomains": len(subdomains),
            "alive_hosts": sum(1 for s in subdomains if s.is_alive),
            "with_ports": sum(1 for s in subdomains if s.ports)
        }
    }


@router.delete("/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    """Delete a scan and its results."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    db.delete(scan)
    db.commit()
    return {"message": "Scan deleted"}


# Scheduled Scans Endpoints

@router.post("/scheduled")
def create_scheduled_scan(
    data: ScheduledScanCreate,
    db: Session = Depends(get_db)
):
    """Create a scheduled scan."""
    scheduled = ScheduledScan(
        domain=data.domain.strip().lower(),
        cron_expression=data.cron_expression
    )
    db.add(scheduled)
    db.commit()
    db.refresh(scheduled)
    return scheduled


@router.get("/scheduled/list")
def list_scheduled_scans(db: Session = Depends(get_db)):
    """List all scheduled scans."""
    return db.query(ScheduledScan).all()


@router.delete("/scheduled/{scheduled_id}")
def delete_scheduled_scan(scheduled_id: int, db: Session = Depends(get_db)):
    """Delete a scheduled scan."""
    scheduled = db.query(ScheduledScan).filter(ScheduledScan.id == scheduled_id).first()
    if not scheduled:
        raise HTTPException(status_code=404, detail="Scheduled scan not found")
    
    db.delete(scheduled)
    db.commit()
    return {"message": "Scheduled scan deleted"}


@router.patch("/scheduled/{scheduled_id}/toggle")  
def toggle_scheduled_scan(scheduled_id: int, db: Session = Depends(get_db)):
    """Toggle scheduled scan active status."""
    scheduled = db.query(ScheduledScan).filter(ScheduledScan.id == scheduled_id).first()
    if not scheduled:
        raise HTTPException(status_code=404, detail="Scheduled scan not found")
    
    scheduled.is_active = not scheduled.is_active
    db.commit()
    return scheduled
