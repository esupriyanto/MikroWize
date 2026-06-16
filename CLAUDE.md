# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MikroWize is a web application for centralized management of MikroTik router/switch fleets. It targets ISP operators, NOC engineers, and enterprise IT infrastructure teams managing tens to thousands of MikroTik devices. The platform is inspired by OptiWize, purpose-built for the RouterOS ecosystem.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React + Vite + TailwindCSS |
| AI Agent | Hermes / Claude via OpenRouter |
| Device Comm | MikroTik RouterOS REST API (v7+) / SSH via Paramiko (v6 compatible) |
| Database | PostgreSQL (primary) + Redis (cache & task queue) |
| Task Queue | Celery + Redis |
| Monitoring | Zabbix / Prometheus + Grafana |
| Auth | JWT + RBAC |
| Templates | Jinja2 for RouterOS config rendering |
| Topology | D3.js or Cytoscape.js |
| Deployment | Docker Compose / Kubernetes |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│         (Dashboard / Topology / Terminal)            │
└──────────────────────┬──────────────────────────────┘
                       │ REST / WebSocket
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                      │
│   Auth │ Device CRUD │ Task Manager │ AI Proxy       │
└──────┬───────────────────────┬──────────────────────┘
       │                       │
┌──────▼──────┐       ┌────────▼────────┐
│  PostgreSQL  │       │  Celery + Redis  │
│  (primary)   │       │  (task queue)    │
└─────────────┘       └────────┬────────┘
                               │
              ┌────────────────▼─────────────────┐
              │         Device Workers             │
              │   RouterOS REST API / SSH          │
              └────────────────┬─────────────────┘
                               │
              ┌────────────────▼─────────────────┐
              │      MikroTik Fleet               │
              │  (Router / Switch / AP)            │
              └──────────────────────────────────┘
```

The backend exposes REST + WebSocket endpoints. Heavy operations (bulk onboarding, backups, monitoring checks) run as Celery tasks with Redis as the broker. Device communication is abstracted behind a service layer (`services/mikrotik/`) that handles both REST API (RouterOS v7+) and SSH/Paramiko (RouterOS v6).

## Project Structure

```
mikrowize/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Config, security, dependencies
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Business logic
│   │   │   ├── mikrotik/ # RouterOS API client
│   │   │   ├── backup/   # Backup service
│   │   │   ├── monitor/  # Monitoring integration
│   │   │   └── ai/       # Hermes/Claude integration
│   │   └── tasks/        # Celery tasks
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, Devices, Topology
│   │   ├── components/   # Reusable UI components
│   │   └── services/     # API client (axios)
│   └── Dockerfile
├── infra/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── zabbix/           # Zabbix templates
└── README.md
```

## Feature Priority (implement in this order)

| Priority | Features |
|---|---|
| **P1 (MVP)** | Device Onboarding, Mass Onboarding (CSV), Centralized Backup, Troubleshooting Panel, Basic Monitoring |
| **P2 (Core)** | Template Framework, Grafana Integration, Alert & Notification |
| **P3 (Intelligence)** | AI Auto-Remediation, Topology Map, AI Chat Interface |

## Core Workflows

### Device Onboarding (Manual)
Multi-step wizard: Connection test → Identity/template → Hardening checklist → Review → Execute via Task Queue.
Auto-discovery via LLDP/CDP/Nmap scan. Zero-touch provisioning via DHCP Option 66 / TFTP.
Device fingerprinting auto-detects RouterOS version, hardware model, resource specs.

### Bulk Onboarding
CSV/Excel upload → Pre-validation (format, duplicates, reachability) → Parallel Celery provisioning with concurrency control per subnet → Real-time progress dashboard.
Failed devices: auto-retry 3x, then rollback to previous config.

### Centralized Backup
Dual format: binary `.backup` (`/system backup save`) + plaintext `.rsc` (`/export`).
30-day retention (configurable), config diff viewer, change detection alerts.
Restore with confirmation + auto-revert timer (reverts if device unreachable after X minutes).

### Troubleshooting Panel
Diagnostic tools: ping, traceroute, DNS lookup, bandwidth test, torch (traffic capture), port scan.
Config/log tools: log viewer (WebSocket stream), ARP table, routing table, active connections, interface snapshot, script executor with approval flow for production.
AI integration: paste error/symptom → Hermes suggests root cause + commands → one-click execute with approval.

### Template Framework
Jinja2 templates with variable substitution: `{{ hostname }}`, `{{ wan_ip }}`, `{{ wan_prefix }}`, `{{ gateway }}`, `{{ customer_id }}`.
Templates support inheritance, versioning, dry-run validation, and push to single device or group/site/tag.
Default template can be auto-applied during onboarding per device type.

### AI Auto-Remediation
Flow: Alert trigger → AI collects context (log, metrics, config snapshot) → Proposes fix with confidence score → Human approval (or auto-execute above threshold) → Execute via RouterOS API → Verify → Auto-document to incident log.

## MikroTik API Reference

```python
# RouterOS REST API (v7+)
GET  /rest/system/resource          # CPU, RAM, uptime
GET  /rest/interface                # Interface list + stats
GET  /rest/ip/address               # IP assignments
GET  /rest/routing/bgp/session      # BGP sessions
POST /rest/tool/ping                # Ping tool
POST /rest/tool/traceroute          # Traceroute
GET  /rest/log                      # System log

# SSH via Paramiko (v6 compatible)
/system backup save name=backup
/export file=config
/tool torch interface=ether1
```

## Frontend Pages (18 total)

1. **Dashboard** — Stat cards (device count, alerts, backup status), recent device list, task queue summary, Hermes AI widget, Grafana embed panel
2. **Topology Map** — Interactive graph (L2/L3/BGP toggle), node status colors, edge bandwidth overlay, cluster by site, export PNG/PDF/CSV
3. **Device Inventory** — Searchable/filterable device table, bulk actions (template assign, tag, backup, delete)
4. **Device Detail** — Device info, resource gauges, interface list, backup history, changelog, tabs: Overview/Interfaces/Backup/Alerts/Changelog/Settings
5. **Device Onboarding** — 5-step wizard: Connection → Identity → Template → Hardening → Review
6. **Mass Import** — CSV/Excel upload, preview with inline error editing, pause/resume, retry failed, download report
7. **Backup Manager** — Scheduled/on-demand backup, diff viewer, restore with auto-rollback, download .backup/.rsc
8. **Troubleshoot Panel** — Diagnostic tools, log viewer, script executor, AI integration
9. **Template Framework** — Create/edit/clone templates, variable editor, preview render, push to device/group, version history
10. **Task Queue** — Monitor Celery jobs, retry/cancel/prioritize, worker status
11. **Live Metrics** — Time-series charts (CPU, RAM, traffic, wireless, BGP, PPPoE), threshold overlay, compare mode
12. **Alerts** — Active/history tabs, acknowledge/resolve/snooze, alert rules, notification channels (Telegram, email, Slack, PagerDuty)
13. **Grafana Dashboards** — Embedded Grafana panels with variable/time sync
14. **AI Agent (Hermes)** — Chat interface, remediation suggestions with confidence score, runbook automation, auto-approve threshold config
15. **Incidents** — Timeline per incident, AI-generated root cause summary, post-mortem template, export PDF
16. **Users & Roles** — Invite/edit/deactivate, permission matrix, site scope, MFA management, API key generation
17. **Audit Log** — Append-only immutable log, full-text search, CSV export, filter by user/action/device/date
18. **Settings** — General, credential vault, backup policy, notification channels, API & integrations (Zabbix/Prometheus/Grafana), change freeze config, system/worker management

## RBAC Roles

| Role | Access |
|---|---|
| Super Admin | Full access all sites |
| NOC Engineer | View + troubleshoot + execute approved commands |
| Network Engineer | Full config + template push |
| Read-Only | View monitoring & report only |
| Customer | View own devices only |

## Security Constraints

- Device credentials encrypted at-rest (AES-256, Fernet), never exposed to frontend
- Audit log is append-only (immutable) for compliance
- Rate limiting on command execution to prevent accidental mass config push
- Change freeze windows block config pushes during production hours (configurable per time window, with user whitelist bypass)
- MFA support for admin role
- Credential vault supports rotation (update password in vault + push to device simultaneously)

## Monitoring & Alerting

Zabbix templates for MikroTik integration:
- MikroTik RouterOS by SNMP (official)
- MikroTik Wireless by SNMP
- BGP Peer Monitoring
- PPPoE Session Counter

Alert notification channels: Email (SMTP), Telegram Bot, Slack webhook, PagerDuty integration key.

Historical metric storage: minimum 90 days.

## Development Roadmap

- **Phase 1 (MVP, 4-6 weeks):** Device CRUD + credentials vault, manual & CSV bulk onboarding, centralized backup (binary + export), basic troubleshooting panel (ping, trace, log viewer), SNMP/API basic monitoring, JWT auth + RBAC
- **Phase 2 (Core, 6-8 weeks):** Template framework with Jinja2, Zabbix/Prometheus integration, Grafana dashboard embed, config diff viewer, alert & notification system, audit log
- **Phase 3 (Intelligence, 4-6 weeks):** Hermes AI agent integration, auto-remediation workflow, network topology auto-map, anomaly detection, AI chat interface, incident reporting
