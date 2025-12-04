from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from backend.database import get_db, Subdomain, Scan

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/")
def get_all_results(
    scan_id: int = Query(None),
    alive_only: bool = Query(False),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all subdomain results with optional filtering."""
    query = db.query(Subdomain)
    
    if scan_id:
        query = query.filter(Subdomain.scan_id == scan_id)
    
    if alive_only:
        query = query.filter(Subdomain.is_alive == True)
    
    total = query.count()
    results = query.order_by(Subdomain.id.desc()).offset(skip).limit(limit).all()
    
    # Parse JSON fields
    parsed_results = []
    for r in results:
        parsed_results.append({
            "id": r.id,
            "scan_id": r.scan_id,
            "subdomain": r.subdomain,
            "ip_address": r.ip_address,
            "ports": json.loads(r.ports) if r.ports else [],
            "status_code": r.status_code,
            "content_length": r.content_length,
            "title": r.title,
            "technologies": json.loads(r.technologies) if r.technologies else [],
            "urls": json.loads(r.urls) if r.urls else [],
            "is_alive": r.is_alive,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    
    return {"results": parsed_results, "total": total}


@router.get("/stats")
def get_global_stats(db: Session = Depends(get_db)):
    """Get global statistics across all scans."""
    total_scans = db.query(Scan).count()
    completed_scans = db.query(Scan).filter(Scan.status == "completed").count()
    running_scans = db.query(Scan).filter(Scan.status == "running").count()
    
    total_subdomains = db.query(Subdomain).count()
    alive_hosts = db.query(Subdomain).filter(Subdomain.is_alive == True).count()
    with_ports = db.query(Subdomain).filter(Subdomain.ports.isnot(None)).count()
    
    # Get technology distribution
    tech_counts = {}
    subdomains_with_tech = db.query(Subdomain).filter(Subdomain.technologies.isnot(None)).all()
    for sub in subdomains_with_tech:
        try:
            techs = json.loads(sub.technologies)
            for tech in techs:
                tech_counts[tech] = tech_counts.get(tech, 0) + 1
        except:
            pass
    
    # Get top 10 technologies
    top_technologies = sorted(tech_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Port distribution
    port_counts = {}
    subdomains_with_ports = db.query(Subdomain).filter(Subdomain.ports.isnot(None)).all()
    for sub in subdomains_with_ports:
        try:
            ports = json.loads(sub.ports)
            for port in ports:
                port_counts[str(port)] = port_counts.get(str(port), 0) + 1
        except:
            pass
    
    top_ports = sorted(port_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "scans": {
            "total": total_scans,
            "completed": completed_scans,
            "running": running_scans
        },
        "subdomains": {
            "total": total_subdomains,
            "alive": alive_hosts,
            "with_open_ports": with_ports
        },
        "top_technologies": top_technologies,
        "top_ports": top_ports
    }


@router.get("/export/{scan_id}")
def export_scan_results(scan_id: int, db: Session = Depends(get_db)):
    """Export scan results for download."""
    subdomains = db.query(Subdomain).filter(Subdomain.scan_id == scan_id).all()
    
    export_data = []
    for r in subdomains:
        export_data.append({
            "subdomain": r.subdomain,
            "ip": r.ip_address,
            "ports": json.loads(r.ports) if r.ports else [],
            "status_code": r.status_code,
            "title": r.title,
            "technologies": json.loads(r.technologies) if r.technologies else [],
            "is_alive": r.is_alive
        })
    
    return {"scan_id": scan_id, "results": export_data}
