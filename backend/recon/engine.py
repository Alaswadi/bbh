import asyncio
import json
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.database import Scan, Subdomain
from backend.recon.tools import run_subfinder, run_naabu, run_httpx, run_gau


class ReconEngine:
    """Main reconnaissance orchestration engine."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def run_full_scan(self, scan_id: int) -> bool:
        """Execute full recon pipeline: subfinder → naabu → httpx → gau"""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return False
        
        try:
            # Update status to running
            scan.status = "running"
            self.db.commit()
            
            domain = scan.domain
            print(f"[*] Starting scan for {domain}")
            
            # Step 1: Subdomain Enumeration
            print(f"[+] Running subfinder on {domain}...")
            subdomains = await run_subfinder(domain)
            print(f"[+] Found {len(subdomains)} subdomains")
            
            if not subdomains:
                subdomains = [domain]  # At least scan the main domain
            
            # Step 2: Port Scanning
            print(f"[+] Running naabu on {len(subdomains)} hosts...")
            port_results = await run_naabu(subdomains)
            print(f"[+] Port scan complete")
            
            # Step 3: HTTP Probing
            print(f"[+] Running httpx on {len(subdomains)} hosts...")
            http_results = await run_httpx(subdomains)
            print(f"[+] Found {len(http_results)} live web servers")
            
            # Create lookup dict for httpx results
            http_lookup = {r['host']: r for r in http_results}
            
            # Step 4: URL Discovery (on main domain only to save time)
            print(f"[+] Running gau on {domain}...")
            all_urls = await run_gau(domain)
            print(f"[+] Discovered {len(all_urls)} URLs")
            
            # Group URLs by subdomain
            url_map = {}
            for url in all_urls:
                for sub in subdomains:
                    if sub in url:
                        if sub not in url_map:
                            url_map[sub] = []
                        url_map[sub].append(url)
                        break
            
            # Save results to database
            for subdomain in subdomains:
                http_data = http_lookup.get(subdomain, {})
                ports = port_results.get(subdomain, [])
                urls = url_map.get(subdomain, [])
                
                subdomain_record = Subdomain(
                    scan_id=scan_id,
                    subdomain=subdomain,
                    ip_address=http_data.get('ip'),
                    ports=json.dumps(ports) if ports else None,
                    status_code=http_data.get('status_code'),
                    content_length=http_data.get('content_length'),
                    title=http_data.get('title'),
                    technologies=json.dumps(http_data.get('technologies', [])),
                    urls=json.dumps(urls[:100]) if urls else None,  # Limit to 100 URLs per subdomain
                    is_alive=http_data.get('is_alive', False)
                )
                self.db.add(subdomain_record)
            
            # Mark scan as completed
            scan.status = "completed"
            scan.completed_at = datetime.utcnow()
            self.db.commit()
            
            print(f"[✓] Scan completed for {domain}")
            return True
            
        except Exception as e:
            print(f"[!] Scan error: {e}")
            scan.status = "failed"
            self.db.commit()
            return False


# Global running scans tracker
running_scans = {}


async def start_scan_task(scan_id: int, db: Session):
    """Background task to run a scan."""
    engine = ReconEngine(db)
    await engine.run_full_scan(scan_id)
    if scan_id in running_scans:
        del running_scans[scan_id]
