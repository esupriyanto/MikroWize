"""
MikroTik RouterOS REST API client (v7+)
Uses requests for sync HTTP calls to /rest/* endpoints.
"""
import requests
from typing import Any

from ...core.security import decrypt_credential


class MikroTikClient:
    def __init__(self, ip: str, port: int = 8728, username: str = "", encrypted_password: str = "", use_tls: bool = False):
        self.ip = ip
        self.port = port
        self.username = username
        self.password = decrypt_credential(encrypted_password) if encrypted_password else ""
        self.base_url = f"{'https' if use_tls else 'http'}://{ip}:{port}"
        self.session = requests.Session()
        self.session.verify = False  # RouterOS self-signed certs
        if self.username:
            self.session.auth = (self.username, self.password)

    def test_connection(self) -> dict | None:
        """Test connectivity and authenticate. Returns system/resource or None."""
        try:
            r = self.session.get(f"{self.base_url}/rest/system/resource", timeout=10)
            if r.status_code == 200:
                return r.json()
            return None
        except Exception:
            return None

    def get(self, path: str) -> list[dict[str, Any]]:
        r = self.session.get(f"{self.base_url}/rest/{path.lstrip('/')}", timeout=15)
        r.raise_for_status()
        return r.json()

    def post(self, path: str, data: dict | None = None) -> Any:
        r = self.session.post(f"{self.base_url}/rest/{path.lstrip('/')}", json=data or {}, timeout=15)
        r.raise_for_status()
        return r.json() if r.text else {}

    def delete(self, path: str) -> bool:
        r = self.session.delete(f"{self.base_url}/rest/{path.lstrip('/')}", timeout=15)
        return r.status_code in (200, 204)

    # Convenience methods

    def get_system_resource(self) -> dict:
        resources = self.get("/system/resource")
        return resources[0] if resources else {}

    def get_interfaces(self) -> list[dict]:
        return self.get("/interface")

    def get_ip_addresses(self) -> list[dict]:
        return self.get("/ip/address")

    def ping(self, target: str, count: int = 5) -> dict:
        return self.post("/tool/ping", {"address": target, "count": count})

    def traceroute(self, target: str) -> dict:
        return self.post("/tool/traceroute", {"address": target})

    def get_log(self, limit: int = 100) -> list[dict]:
        return self.get(f"/log?limit={limit}")

    def backup(self, name: str = "backup") -> dict:
        return self.post("/system/backup/save", {"name": name})

    def export_config(self) -> str:
        result = self.post("/export", {})
        return result.get("output", "")

    def close(self):
        self.session.close()
