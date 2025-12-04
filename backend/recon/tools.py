import asyncio
import subprocess
import json
import tempfile
from pathlib import Path
from typing import List, Optional
from backend.config import SUBFINDER_PATH, NAABU_PATH, HTTPX_PATH, GAU_PATH, DEFAULT_PORTS


async def run_command(cmd: List[str], timeout: int = 600) -> str:
    """Run a command asynchronously and return output."""
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=timeout
        )
        return stdout.decode('utf-8', errors='ignore')
    except asyncio.TimeoutError:
        process.kill()
        return ""
    except Exception as e:
        print(f"Command error: {e}")
        return ""


async def run_subfinder(domain: str) -> List[str]:
    """Run subfinder for subdomain enumeration."""
    cmd = [SUBFINDER_PATH, "-d", domain, "-silent", "-all"]
    output = await run_command(cmd)
    subdomains = [line.strip() for line in output.split('\n') if line.strip()]
    return list(set(subdomains))


async def run_naabu(hosts: List[str], ports: str = DEFAULT_PORTS) -> dict:
    """Run naabu for port scanning. Returns {host: [ports]}"""
    if not hosts:
        return {}
    
    results = {}
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write('\n'.join(hosts))
        hosts_file = f.name
    
    try:
        cmd = [NAABU_PATH, "-list", hosts_file, "-p", ports, "-silent", "-json"]
        output = await run_command(cmd, timeout=1200)
        
        for line in output.split('\n'):
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                host = data.get('host', data.get('ip', ''))
                port = data.get('port')
                if host and port:
                    if host not in results:
                        results[host] = []
                    results[host].append(port)
            except json.JSONDecodeError:
                continue
    finally:
        Path(hosts_file).unlink(missing_ok=True)
    
    return results


async def run_httpx(hosts: List[str]) -> List[dict]:
    """Run httpx for web probing and tech detection."""
    if not hosts:
        return []
    
    results = []
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write('\n'.join(hosts))
        hosts_file = f.name
    
    try:
        cmd = [
            HTTPX_PATH, "-l", hosts_file, "-silent", "-json",
            "-td",  # Tech detect
            "-sc",  # Status code
            "-cl",  # Content length
            "-title",
            "-ip"
        ]
        output = await run_command(cmd, timeout=900)
        
        for line in output.split('\n'):
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                results.append({
                    'url': data.get('url', ''),
                    'host': data.get('input', ''),
                    'status_code': data.get('status_code'),
                    'content_length': data.get('content_length'),
                    'title': data.get('title', ''),
                    'technologies': data.get('tech', []),
                    'ip': data.get('host', ''),
                    'is_alive': True
                })
            except json.JSONDecodeError:
                continue
    finally:
        Path(hosts_file).unlink(missing_ok=True)
    
    return results


async def run_gau(domain: str) -> List[str]:
    """Run gau for URL discovery."""
    cmd = [GAU_PATH, "--subs", domain]
    output = await run_command(cmd, timeout=600)
    urls = [line.strip() for line in output.split('\n') if line.strip()]
    return list(set(urls))
