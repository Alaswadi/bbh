import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/recon.db")

# Tool paths
SUBFINDER_PATH = os.getenv("SUBFINDER_PATH", "subfinder")
NAABU_PATH = os.getenv("NAABU_PATH", "naabu")
HTTPX_PATH = os.getenv("HTTPX_PATH", "httpx")
GAU_PATH = os.getenv("GAU_PATH", "gau")

# Scan settings
DEFAULT_PORTS = "21,22,25,53,80,110,143,443,445,993,995,1433,1521,3306,3389,5432,5900,6379,8000,8080,8443,8888,9200,27017"
SCAN_TIMEOUT = 3600  # 1 hour max per scan
