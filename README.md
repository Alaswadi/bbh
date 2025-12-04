# Bug Bounty Recon Framework

A professional-grade reconnaissance tool for bug bounty hunters featuring subdomain enumeration, port scanning, web probing, and scheduled scans.

## Features

- 🔍 **Subdomain Enumeration** - Using subfinder
- 🎯 **Port Scanning** - Using naabu
- 🌐 **Web Probing & Tech Detection** - Using httpx
- 📜 **URL Discovery** - Using gau
- ⏰ **Scheduled Scans** - Automatic periodic reconnaissance
- 📊 **Web Dashboard** - Modern visualization interface

## Quick Start (Docker)

```bash
# Clone and navigate to project
cd opustest

# Build and run with Docker Compose
docker-compose up -d --build

# Access the dashboard
# Frontend: http://your-server:5173
# API: http://your-server:8888
```

## Ports

| Service | Port |
|---------|------|
| Backend API | 8888 |
| Frontend Dashboard | 5173 |

## API Endpoints

### Scans
- `POST /scans/` - Start a new scan
- `GET /scans/` - List all scans
- `GET /scans/{id}` - Get scan details
- `DELETE /scans/{id}` - Delete a scan

### Scheduled Scans
- `POST /scans/scheduled` - Create scheduled scan
- `GET /scans/scheduled/list` - List scheduled scans
- `PATCH /scans/scheduled/{id}/toggle` - Toggle active status
- `DELETE /scans/scheduled/{id}` - Delete scheduled scan

### Results
- `GET /results/` - Get all results with filtering
- `GET /results/stats` - Global statistics
- `GET /results/export/{scan_id}` - Export scan results

## Environment Variables

```env
# Backend
DATABASE_URL=sqlite:///./data/recon.db

# Frontend
VITE_API_URL=http://localhost:8888
```

## For Coolify Deployment

1. Push this repo to your Git provider
2. In Coolify, create a new service from this repo
3. Set build command: `docker-compose up -d --build`
4. Expose ports 5173 and 8888
5. Set `VITE_API_URL` to your deployed API URL

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, APScheduler
- **Frontend**: React, Vite
- **Recon Tools**: subfinder, naabu, httpx, gau
- **Database**: SQLite

## License

MIT

⚠️ **Disclaimer**: Only use this tool on domains you have permission to test!
