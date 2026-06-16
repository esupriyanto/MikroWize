"""
MikroTik RouterOS SSH client (v6+ compatible)
Uses paramiko for SSH connections.
"""
import paramiko
import time
import re

from ...core.security import decrypt_credential


class MikroTikSSH:
    def __init__(self, ip: str, port: int = 22, username: str = "", encrypted_password: str = ""):
        self.ip = ip
        self.port = port
        self.username = username
        self.password = decrypt_credential(encrypted_password) if encrypted_password else ""
        self.client: paramiko.SSHClient | None = None

    def connect(self) -> bool:
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(
                hostname=self.ip,
                port=self.port,
                username=self.username,
                password=self.password,
                timeout=10,
                allow_agent=False,
                look_for_keys=False,
            )
            return True
        except Exception:
            return False

    def execute(self, command: str, timeout: int = 30) -> str:
        """Execute a RouterOS command and return output."""
        if not self.client:
            raise ConnectionError("Not connected")
        stdin, stdout, stderr = self.client.exec_command(command, timeout=timeout)
        output = stdout.read().decode("utf-8", errors="replace")
        return output.strip()

    def backup(self, name: str = "backup") -> bool:
        """Trigger binary backup on device."""
        output = self.execute(f'/system backup save name={name}')
        return "scheduled" in output.lower() or output == ""

    def export_config(self) -> str:
        """Export running config as plaintext RSC."""
        return self.execute("/export file=config-export")

    def get_file(self, remote_path: str) -> bytes | None:
        """Download a file from the device."""
        if not self.client:
            return None
        sftp = self.client.open_sftp()
        try:
            with sftp.open(remote_path, "rb") as f:
                return f.read()
        except Exception:
            return None
        finally:
            sftp.close()

    def close(self):
        if self.client:
            self.client.close()
            self.client = None
