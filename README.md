# 🛡️ MikroWize — AI-Powered MikroTik Network Management Platform

> Centralized, intelligent management platform for MikroTik devices — inspired by OptiWize, dibangun khusus untuk ekosistem RouterOS.

---

## 📌 Overview

**MikroWize** adalah web application untuk manajemen fleet MikroTik router dan switch secara terpusat. Platform ini menggabungkan onboarding otomatis, backup, monitoring, troubleshooting panel dengan kemampuan spesifik MikroTik seperti Winbox API, RouterOS scripting, dan integrasi AI agent untuk auto-remediation.

Target pengguna: ISP lokal, NOC engineer, IT infrastruktur perusahaan yang punya puluhan hingga ribuan device MikroTik.

---

## 🚀 Installation

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) v18+ (for local frontend development)
- [Python](https://www.python.org/) 3.11+ (for local backend development)
- Git

### Quick Start (Docker Compose)

```bash
# Clone repository
git clone https://github.com/esupriyanto/MikroWize.git
cd MikroWize

# Start all services
docker compose -f infra/docker-compose.yml up -d

# Access the app
# Frontend:  http://localhost (nginx)
# Frontend:  http://localhost:5173 (Vite dev server)
# Backend:   http://localhost:8001
# API Docs:  http://localhost:8001/docs
```

### Default Login

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@mikrowize.io | admin123 |
| NOC Engineer | noc@mikrowize.io | noc123 |
| Network Engineer | neteng@mikrowize.io | neteng123 |
| Read-Only | readonly@mikrowize.io | readonly123 |
| Customer | customer@mikrowize.io | customer123 |

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # Edit with your config
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### Service Architecture

| Service | Port | Description |
|---|---|---|
| Nginx | 80 | Reverse proxy |
| Frontend | 5173 | React + Vite + TailwindCSS |
| Backend | 8001 | FastAPI (use port 8000 for local dev) |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache + Celery broker |
| Celery Worker | - | Background task runner |

### Environment Variables

Backend `.env` file:

```env
DATABASE_URL=postgresql://mikrowize:secret@localhost:5432/mikrowize
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### Stop & Clean Up

```bash
# Stop all services
docker compose -f infra/docker-compose.yml down

# Stop and remove volumes (WARNING: deletes all data)
docker compose -f infra/docker-compose.yml down -v
```

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React + Vite + TailwindCSS |
| AI Agent | Hermes / Claude via OpenRouter |
| Device Comm | MikroTik RouterOS REST API / SSH (Paramiko) |
| Database | PostgreSQL + Redis (cache & task queue) |
| Task Queue | Celery + Redis |
| Monitoring | Zabbix / Prometheus + Grafana |
| Auth | JWT + RBAC |
| Deployment | Docker Compose / K8s |

---

## 🚀 Features

### 1. 📥 Device Onboarding (Manual & Auto)

**Applicable: ✅ High Priority**

Onboarding MikroTik device baru atau device yang baru di-reset ke factory default, tanpa perlu akses fisik ke device setelah initial IP setup.

**Fitur detail:**
- **Auto-discovery** via LLDP/CDP sweep atau scan subnet (Nmap integration)
- **Zero-touch provisioning** — device baru auto-fetch config dari server via DHCP Option 66 atau TFTP trigger
- **Manual onboarding form** — input IP, credentials, device type, site/location tagging
- **Credential vault** — enkripsi credentials per device, support multiple auth method (SSH key, password)
- **Initial hardening** — auto-apply template keamanan dasar (disable unused services, change default port, set NTP, DNS)
- **Device fingerprinting** — auto-detect RouterOS version, hardware model, resource specs

**MikroTik specific:**
```
RouterOS REST API → GET /rest/system/resource
RouterOS REST API → POST /rest/ip/address
SSH → /system identity set name=...
```

---

### 2. 🗂️ Mass Onboarding (Bulk Import)

**Applicable: ✅ High Priority**

Onboarding ribuan device sekaligus tanpa harus satu-satu.

**Fitur detail:**
- **CSV/Excel import** — upload file berisi list IP, credential, site, role, template yang diassign
- **Pre-validation** — cek format, duplikat, reachability sebelum proses dimulai
- **Parallel provisioning** — Celery task queue dengan concurrency control (rate limiting per subnet)
- **Progress dashboard** — real-time status per device: pending → connecting → configuring → done / failed
- **Retry & rollback** — device yang gagal otomatis retry 3x, failed state bisa di-rollback ke previous config
- **Bulk tag assignment** — assign site, group, template, monitoring policy sekaligus

**Workflow:**
```
Upload CSV → Validate → Queue Tasks → Celery Workers → RouterOS API → Report
```

---

### 3. 💾 Centralized Backup

**Applicable: ✅ High Priority**

Backup konfigurasi semua MikroTik secara terpusat dengan retention policy.

**Fitur detail:**
- **Scheduled backup** — cron-based, configurable per device atau group (daily/weekly)
- **On-demand backup** — trigger manual dari UI atau via API
- **Dual format backup:**
  - `/system backup save` → binary `.backup` file (full restore)
  - `/export` → plaintext `.rsc` script (human-readable, diff-able)
- **30-day retention** — auto-purge backup lama, configurable per policy
- **Config diff viewer** — bandingkan backup antar tanggal, highlight perubahan
- **Change detection alert** — notifikasi jika config berubah tanpa scheduled change (deteksi perubahan unauthorized)
- **Restore one-click** — push backup ke device dengan konfirmasi dan rollback timer (auto-revert jika device tidak reachable setelah X menit)
- **Export/Download** — download backup file langsung dari UI

**MikroTik specific:**
```bash
# Binary backup
/system backup save name=backup-$(date)

# Export plaintext
/export file=config-export

# Download via FTP/SCP/SFTP dari RouterOS
```

---

### 4. 🔧 Troubleshooting Panel

**Applicable: ✅ High Priority — Killer Feature**

Panel diagnostik terpusat untuk verifikasi kondisi device tanpa perlu Winbox atau SSH manual.

**Fitur detail:**
- **Quick diagnostics dashboard** per device:
  - Ping test (dari device ke target)
  - Traceroute visual
  - DNS resolution test
  - Interface status & error counters
  - ARP table lookup
  - Routing table snapshot
  - Active connections (IP Connections)
- **Log viewer** — stream RouterOS log real-time via WebSocket
- **Script executor** — run RouterOS command atau custom script dari UI (dengan approval flow untuk production)
- **Port scanner** — cek open port dari perspektif device
- **Bandwidth test** — trigger `/tool bandwidth-test` antar device
- **Torch (traffic capture)** — remote trigger `/tool torch` dan tampilkan hasilnya
- **AI Troubleshooter (Hermes Integration)** — paste symptom atau error log, AI suggest root cause dan remediation steps

**Flow AI Troubleshooter:**
```
User describe issue → AI analyze log context → Suggest commands → 
One-click execute with approval → Verify fix → Auto-document
```

---

### 5. 📊 Complete Monitoring

**Applicable: ✅ High Priority**

Monitoring komprehensif semua aspek device MikroTik via Zabbix/Prometheus.

**Fitur detail:**
- **Resource monitoring** — CPU, RAM, storage usage dengan threshold alert
- **Interface monitoring:**
  - Traffic (bps in/out per interface)
  - Error rate, packet drop
  - Interface up/down status dengan alert
  - Wireless signal strength (RSSI, CCQ, noise floor)
- **BGP/OSPF/MPLS monitoring** — session state, prefix count, flap detection
- **Queue monitoring** — Simple Queue & Queue Tree utilization
- **Client monitoring** — DHCP leases, hotspot user sessions, PPPoE active sessions
- **Uptime & availability** — SLA report per device/site
- **Custom metric** — SNMP custom OID support, RouterOS script-based custom check
- **Alert channels** — Email, Telegram Bot, Slack, PagerDuty webhook
- **Grafana dashboard** — pre-built dashboard untuk ISP & enterprise use case
- **Historical data** — time-series storage minimum 90 hari

**Zabbix Template MikroTik:**
```yaml
Templates:
  - MikroTik RouterOS by SNMP (official)
  - MikroTik Wireless by SNMP
  - BGP Peer Monitoring
  - PPPoE Session Counter
```

---

### 6. 📋 Template Framework

**Applicable: ✅ Medium-High Priority**

Sistem template untuk standarisasi konfigurasi dan push ke banyak device sekaligus.

**Fitur detail:**
- **Template library** — kumpulan template pre-built untuk use case umum:
  - ISP CPE (PPPoE client, firewall basic, QoS)
  - Hotspot gateway
  - BGP edge router
  - Core/distribution switch (MikroTik CRS)
  - Office router (site-to-site VPN, firewall policy)
- **Variable substitution** — template dengan placeholder: `{hostname}`, `{wan_ip}`, `{gateway}`, `{customer_id}`
- **Template versioning** — track perubahan template, rollback ke versi sebelumnya
- **Jinja2 rendering** — template engine yang familiar untuk engineer
- **Template validation** — dry-run render sebelum push, cek syntax RouterOS
- **Push to device(s)** — apply template ke satu device atau group sekaligus
- **Inheritance** — template bisa inherit dari base template
- **Custom template builder** — UI visual untuk build template tanpa perlu tulis script dari nol

**Contoh template variable:**
```jinja2
/ip address add address={{ wan_ip }}/{{ wan_prefix }} interface=ether1
/ip route add dst-address=0.0.0.0/0 gateway={{ gateway }}
/system identity set name={{ hostname }}
```

---

### 7. 🤖 AI Auto-Remediation (Hermes Agent — Unique Feature)

**Applicable: ✅ Differentiator Feature**

Integrasi AI agent untuk otomasi diagnosis dan remediasi masalah jaringan.

**Fitur detail:**
- **Anomaly detection** — AI monitor metrics dan deteksi pola abnormal
- **Root cause analysis** — AI correlate events lintas device untuk identifikasi penyebab
- **Auto-remediation workflow:**
  1. Alert trigger
  2. AI collect context (log, metrics, config snapshot)
  3. AI propose fix dengan confidence score
  4. Human approval (atau auto-execute jika confidence > threshold)
  5. Execute via RouterOS API
  6. Verify fix berhasil
  7. Auto-document ke incident log
- **Chat interface** — tanya langsung ke AI: "kenapa traffic ke AS12345 drop sejak jam 3?"
- **Runbook automation** — AI bisa jalankan runbook yang sudah didefinisikan
- **Incident timeline** — AI generate ringkasan incident untuk reporting

---

### 8. 🗺️ Network Topology Map (Bonus Feature)

**Applicable: ✅ Medium Priority**

Auto-generate visual topology dari device yang sudah di-onboard.

**Fitur detail:**
- **Auto-discovery topology** — LLDP neighbor data dari semua device
- **Visual map** — D3.js atau Cytoscape.js interactive graph
- **Layer 2 & Layer 3 view** — toggle antara L2 (MAC/switch) dan L3 (IP/routing) view
- **Real-time status overlay** — warna node berdasarkan status (green/yellow/red)
- **Click-to-inspect** — klik node → langsung ke device detail page
- **Export** — export topology sebagai PNG atau PDF untuk dokumentasi

---

### 9. 👥 Multi-User & RBAC

**Applicable: ✅ Required**

Multi-tenant dengan role-based access control untuk tim dan customer.

**Roles:**
| Role | Akses |
|---|---|
| Super Admin | Full access semua site |
| NOC Engineer | View + troubleshoot + execute approved commands |
| Network Engineer | Full config + template push |
| Read-Only | View monitoring & report only |
| Customer | View device mereka sendiri only |

---

### 10. 📄 Audit Log & Reporting

**Applicable: ✅ Required**

Track semua aksi yang dilakukan melalui platform.

**Fitur detail:**
- **Audit trail** — siapa, kapan, apa yang dieksekusi di device mana
- **Change log** — history perubahan config per device
- **Scheduled report** — weekly/monthly report dikirim via email
- **Export** — CSV/PDF report untuk compliance

---

## 📐 Architecture Overview

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

