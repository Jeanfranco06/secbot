"""Reenvío de eventos al SIEM.
Wazuh: HTTP JSON webhook a /custom/secbot
Splunk: HEC (HTTP Event Collector)
Syslog: RFC5424 vía TCP
"""
import json
import logging
import os
import socket
import httpx
from datetime import datetime
from app.config import settings

log = logging.getLogger(__name__)

def _wazuh(event: dict):
    httpx.post(
        settings.siem_endpoint,
        json={"source": "secbot", "timestamp": datetime.utcnow().isoformat(), **event},
        headers={"Authorization": f"Bearer {settings.siem_token}"},
        timeout=3,
    )

def _splunk(event: dict):
    payload = {
        "time": datetime.utcnow().timestamp(),
        "host": "secbot",
        "source": "secbot",
        "sourcetype": "_json",
        "event": event,
    }
    httpx.post(
        settings.siem_endpoint,
        json=payload,
        headers={"Authorization": f"Splunk {settings.siem_token}"},
        timeout=3,
        verify=False,
    )

def _syslog(event: dict):
    msg = json.dumps(event)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(3)
        host, _, port = settings.siem_endpoint.partition(":")
        s.connect((host, int(port or 514)))
        s.sendall(f"<134>1 {datetime.utcnow().isoformat()} secbot secbot - - {msg}\n".encode())

def send_event(event_type: str, severity: str, **data):
    if not settings.siem_enabled:
        return
    event = {
        "event_type": event_type,
        "severity": severity,
        "data": data,
    }
    try:
        if settings.siem_type == "wazuh":
            _wazuh(event)
        elif settings.siem_type == "splunk":
            _splunk(event)
        else:
            _syslog(event)
    except Exception as e:
        log.warning("SIEM no disponible: %s", e)