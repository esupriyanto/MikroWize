# 🛡️ MikroWize — AI-Powered MikroTik Network Management Platform

> Centralized, intelligent management platform for MikroTik devices — inspired by OptiWize, dibangun khusus untuk ekosistem RouterOS.

---

## 📌 Overview

**MikroWize** adalah web application untuk manajemen fleet MikroTik router dan switch secara terpusat. Platform ini menggabungkan onboarding otomatis, backup, monitoring, troubleshooting panel dengan kemampuan spesifik MikroTik seperti Winbox API, RouterOS scripting, dan integrasi AI agent untuk auto-remediation.

Target pengguna: ISP lokal, NOC engineer, IT infrastruktur perusahaan yang punya puluhan hingga ribuan device MikroTik.

---

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

---

## 🗓️ Development Roadmap

### Phase 1 — MVP (4-6 minggu)
- [ ] Device CRUD + credentials vault
- [ ] Manual & CSV bulk onboarding
- [ ] Centralized backup (binary + export)
- [ ] Basic troubleshooting panel (ping, trace, log viewer)
- [ ] SNMP/API basic monitoring
- [ ] JWT auth + RBAC dasar

### Phase 2 — Core Features (6-8 minggu)
- [ ] Template framework dengan Jinja2
- [ ] Zabbix/Prometheus integration
- [ ] Grafana dashboard embed
- [ ] Config diff viewer
- [ ] Alert & notification system
- [ ] Audit log

### Phase 3 — Intelligence (4-6 minggu)
- [ ] Hermes AI agent integration
- [ ] Auto-remediation workflow
- [ ] Network topology auto-map
- [ ] Anomaly detection
- [ ] AI chat interface
- [ ] Incident reporting

---

## 🔌 MikroTik API Methods Used

```python
# RouterOS REST API (RouterOS v7+)
GET  /rest/system/resource          # CPU, RAM, uptime
GET  /rest/interface                # Interface list + stats
GET  /rest/ip/address               # IP assignments
GET  /rest/routing/bgp/session      # BGP sessions
POST /rest/tool/ping                # Ping tool
POST /rest/tool/traceroute          # Traceroute
GET  /rest/log                      # System log

# SSH via Paramiko (RouterOS v6 compatible)
/system backup save name=backup
/export file=config
/tool torch interface=ether1
```

---

## 📦 Project Structure

```
mikrowize/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Config, security, deps
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

---

## 🔒 Security Considerations

- Semua credentials device dienkripsi at-rest (AES-256, Fernet)
- API key vault — tidak pernah expose credential ke frontend
- Audit log immutable — append-only untuk compliance
- Rate limiting pada command execution (prevent accidental mass config push)
- Change freeze window — blokir push config di jam tertentu (production freeze)
- MFA support untuk admin role

---

## 📊 Feature Priority Matrix

| Feature | Effort | Impact | Priority |
|---|---|---|---|
| Device Onboarding | Medium | High | 🔴 P1 |
| Mass Onboarding (CSV) | Medium | High | 🔴 P1 |
| Centralized Backup | Low | High | 🔴 P1 |
| Troubleshooting Panel | Medium | High | 🔴 P1 |
| Basic Monitoring | High | High | 🔴 P1 |
| Template Framework | Medium | Medium | 🟡 P2 |
| Grafana Integration | Low | Medium | 🟡 P2 |
| Alert & Notification | Medium | High | 🟡 P2 |
| AI Auto-Remediation | High | High | 🟢 P3 |
| Topology Map | High | Medium | 🟢 P3 |
| AI Chat Interface | Medium | High | 🟢 P3 |

---

> Built with ❤️ for MikroTik engineers. Inspired by OptiWize, powered by RouterOS API + Hermes AI Agent.

Detail Menu dan Feature

# MikroWize — Page Reference Guide

---

## 1. Dashboard

Halaman landing utama setelah login. Memberikan overview kondisi seluruh fleet sekaligus entry point ke semua fitur.

### Informasi yang ditampilkan
- Stat cards: total device, device online/offline, active alerts, backup status
- Recent device list dengan status real-time
- Active alerts terbaru (5 teratas, sorted by severity)
- Task queue summary (running, pending, failed jobs)
- Hermes AI widget: suggestion remediation aktif, shortcut chat, incident summary
- Grafana embed panel (traffic overview, CPU trend fleet)

### Menu & fungsi
- **Add Device** — shortcut ke form onboarding manual
- **Ask Hermes** — buka AI chat interface
- **View all devices** — link ke Device Inventory
- **Manage alerts** — link ke halaman Alerts
- **View all tasks** — link ke Task Queue
- Klik stat card → navigasi ke halaman terkait
- Klik device di recent list → buka device detail
- Klik alert → buka alert detail + suggested action

---

## 2. Topology Map

Visualisasi interaktif seluruh jaringan berdasarkan data LLDP dan routing.

### Informasi yang ditampilkan
- Canvas graph: node (device) + edge (link antar device)
- Status warna per node: hijau (up), merah (down), kuning (degraded), abu-abu (unmanaged)
- Ketebalan & warna edge: bandwidth capacity + utilization real-time
- Mini-map navigasi di pojok kanan bawah
- Legend: device type, status color, link type

### Menu & fungsi
- **Layer toggle** — switch antara L2 view, L3 view, BGP view
- **Filter** — filter by site, device type, status, tag
- **Search** — cari device by hostname atau IP, highlight di canvas
- **Group by site** — collapse device per lokasi jadi cluster
- **Expand cluster** — klik cluster untuk lihat node individual
- **Refresh** — manual refresh topologi data
- **Export PNG/PDF** — export canvas sebagai gambar atau dokumen
- **Export CSV** — export daftar node dan edge
- Klik node → side panel muncul: hostname, IP, CPU/RAM, interface list, last backup, active alerts, shortcut ke Troubleshoot & Backup
- Hover edge → tooltip: interface name, speed, tx/rx utilization, error count
- Klik "Onboard device" di node unmanaged → redirect ke form onboarding

---

## 3. Device Inventory

Daftar semua device MikroTik yang sudah di-onboard beserta statusnya.

### Informasi yang ditampilkan
- Tabel device: hostname, IP, model, RouterOS version, site, status, last seen, last backup
- Badge status per device: online / offline / degraded / unreachable
- Alert count per device
- Total device count, online count, offline count di bagian atas

### Menu & fungsi
- **Search** — cari by hostname, IP, model, tag
- **Filter** — filter by status, site, device type, RouterOS version
- **Sort** — sort by kolom mana saja
- **Add Device** — buka form manual onboarding
- **Import CSV** — shortcut ke Mass Import
- **Export** — export list device ke CSV/Excel
- Klik device → buka Device Detail page
- Klik ikon troubleshoot pada row → langsung buka Troubleshoot Panel device tersebut
- Klik ikon backup pada row → trigger on-demand backup
- **Bulk select** → aksi massal: assign template, assign tag, trigger backup, delete

---

## 4. Device Detail

Halaman detail per device — hub dari semua operasi terhadap satu device.

### Informasi yang ditampilkan
- Info umum: hostname, IP, model, serial number, RouterOS version, uptime
- Resource: CPU usage, RAM usage, storage usage (gauge chart)
- Interface list: nama, status up/down, IP, tx/rx traffic, error count
- Active alerts untuk device ini
- Backup history (5 terbaru)
- Changelog: perubahan config terakhir via platform
- Tags & site assignment

### Menu & fungsi
- **Edit** — ubah hostname, credential, site, tag
- **Ping test** — trigger ping dari device ke target IP
- **Open Troubleshoot** — shortcut ke Troubleshoot Panel
- **Backup now** — trigger on-demand backup
- **Push template** — pilih & apply template ke device ini
- **Open in Terminal** — web SSH terminal ke device (jika diaktifkan)
- **View on topology** — highlight device ini di Topology Map
- **Delete device** — hapus device dari inventory (dengan konfirmasi)
- Tab navigasi: Overview / Interfaces / Backup / Alerts / Changelog / Settings

---

## 5. Device Onboarding

Form untuk onboarding device MikroTik baru secara manual satu per satu.

### Informasi yang ditampilkan
- Form input step-by-step dengan progress indicator
- Preview hasil koneksi (connection test result)
- Checklist hardening yang akan diaplikasikan
- Summary sebelum submit

### Menu & fungsi
- **Step 1 — Connection**: input IP address, port API (default 8728/8729), SSH port, credentials (username/password atau SSH key)
- **Test Connection** — validasi konektivitas dan credentials sebelum lanjut
- **Step 2 — Identity**: hostname, site/lokasi, device type, tag
- **Step 3 — Template**: pilih template awal yang akan di-push saat onboarding (opsional)
- **Step 4 — Hardening**: centang checklist hardening — disable Telnet, ubah default port, set NTP, set DNS, disable unused services
- **Step 5 — Review**: tampilkan summary semua input sebelum eksekusi
- **Submit** — eksekusi onboarding, masuk ke Task Queue, redirect ke progress view

---

## 6. Mass Import

Onboarding ratusan hingga ribuan device sekaligus via file CSV atau Excel.

### Informasi yang ditampilkan
- Template file CSV yang bisa didownload
- Preview tabel hasil parse file yang diupload
- Validation result: baris valid, baris error, warning (duplikat, format salah)
- Progress bar per device saat proses berjalan
- Summary hasil: berhasil / gagal / skip

### Menu & fungsi
- **Download template CSV** — download contoh format file yang benar
- **Upload file** — drag & drop atau browse CSV/Excel
- **Validate** — parse dan validasi file sebelum dieksekusi (cek format, duplikat IP, credential kosong)
- **Preview** — tampilkan tabel hasil parsing dengan highlight error per baris
- **Fix errors** — edit inline di preview table atau re-upload file yang sudah diperbaiki
- **Start import** — mulai proses onboarding secara parallel via Celery
- **Pause / Resume** — pause proses yang sedang berjalan
- **Retry failed** — re-run hanya untuk device yang gagal
- **Download report** — export hasil import (success/failed/skipped) ke CSV
- Klik device yang gagal → lihat error detail dan opsi retry manual

---

## 7. Backup Manager

Manajemen backup terpusat semua device — scheduled maupun on-demand.

### Informasi yang ditampilkan
- Stat: total backup hari ini, backup sukses, backup gagal, total storage dipakai
- Tabel backup: device, waktu backup, tipe (scheduled/manual), format (binary/.rsc), ukuran, status
- Backup policy aktif per device atau group
- Storage usage timeline chart

### Menu & fungsi
- **Backup now** — trigger on-demand backup untuk satu device atau group
- **Schedule config** — atur jadwal backup: frekuensi (daily/weekly), waktu, retensi (default 30 hari)
- **Download** — download file backup (.backup atau .rsc) langsung dari UI
- **View diff** — bandingkan dua backup dari tanggal berbeda, tampilkan perubahan config (diff viewer)
- **Restore** — push backup ke device dengan konfirmasi + auto-rollback timer (device akan revert jika tidak reachable dalam X menit setelah restore)
- **Delete** — hapus backup tertentu manual
- **Filter** — filter by device, tanggal, tipe backup, status
- **Export log** — export history backup ke CSV
- Klik baris backup → lihat detail: isi config (untuk format .rsc), metadata, checksum

---

## 8. Troubleshoot Panel

Panel diagnostik untuk debug masalah device langsung dari browser tanpa perlu Winbox atau SSH manual.

### Informasi yang ditampilkan
- Status koneksi ke device (reachable / unreachable)
- Hasil tool yang dijalankan: output ping, traceroute, log stream
- Interface error counter real-time
- Active IP connections table

### Menu & fungsi

**Diagnostic tools:**
- **Ping** — trigger `/tool/ping` dari device ke target IP, tampilkan RTT dan packet loss
- **Traceroute** — trigger `/tool/traceroute`, tampilkan hop-by-hop
- **DNS lookup** — resolve hostname dari perspektif device
- **Bandwidth test** — trigger `/tool/bandwidth-test` ke device target lain di jaringan
- **Torch** — trigger `/tool/torch` pada interface tertentu, tampilkan traffic breakdown real-time (src/dst IP, protocol, rate)
- **Port scan** — cek port yang terbuka dari device ke target

**Config & log tools:**
- **Log viewer** — stream log RouterOS real-time via WebSocket, filter by topic (firewall, bgp, dhcp, system, dll)
- **ARP table** — tampilkan ARP table device saat ini
- **Routing table** — snapshot routing table, filter by prefix
- **Active connections** — tampilkan IP connections table
- **Script executor** — ketik dan run RouterOS command atau script langsung. Untuk production device, command masuk approval queue dulu sebelum dieksekusi
- **Interface snapshot** — tampilkan semua interface + error counter + status sekarang

**AI integration:**
- **Ask Hermes** — paste error log atau describe symptom, Hermes suggest root cause + command untuk fix, bisa langsung execute dari sini dengan satu klik (dengan approval jika diaktifkan)

---

## 9. Template Framework

Library template konfigurasi RouterOS berbasis Jinja2 untuk standarisasi dan push massal.

### Informasi yang ditampilkan
- Daftar template: nama, kategori, versi, terakhir diupdate, jumlah device yang pakai template ini
- Preview rendered template (dengan sample variable values)
- Variable list yang dibutuhkan per template
- History push: kapan, ke device mana, siapa yang trigger, status

### Menu & fungsi
- **Create template** — editor dengan syntax highlighting untuk tulis template baru (format Jinja2 + RouterOS script)
- **Import template** — upload file template `.j2` dari lokal
- **Edit template** — ubah isi template, auto-increment version
- **Clone template** — duplikat template yang sudah ada sebagai base template baru
- **Delete template** — hapus template (dengan cek apakah masih dipakai device)
- **Variable editor** — define variable yang dibutuhkan template beserta default value dan tipe data
- **Preview render** — test render template dengan sample atau actual variable dari device tertentu, lihat output akhir sebelum push
- **Validate** — dry-run syntax check template sebelum disimpan
- **Push to device** — pilih satu device, render template dengan variable device tersebut, push ke device
- **Push to group** — push template ke semua device dalam satu group/site/tag sekaligus, masuk Task Queue
- **Version history** — lihat dan compare antar versi template, rollback ke versi sebelumnya
- **Assign default template** — set template default untuk device type tertentu (auto-apply saat onboarding)

---

## 10. Task Queue

Monitor dan kelola semua background job yang berjalan di platform.

### Informasi yang ditampilkan
- Stat: running tasks, pending tasks, completed today, failed today
- Tabel task: nama job, device target, status, waktu mulai, durasi, triggered by (user/scheduler/AI)
- Detail output per task (log eksekusi)
- Worker status: jumlah Celery worker aktif, queue depth

### Menu & fungsi
- **Filter** — filter by status (running/pending/done/failed), tipe task, device, triggered by, tanggal
- **Search** — cari task by nama job atau device target
- **View detail** — klik task → lihat full log output eksekusi
- **Retry** — re-run task yang failed
- **Cancel** — batalkan task yang masih pending atau sedang running
- **Retry all failed** — bulk retry semua task yang failed
- **Prioritize** — naikkan prioritas task yang masih pending
- **Download log** — export log output task ke file `.txt`
- **Worker monitor** — lihat jumlah Celery worker aktif, queue depth per worker, restart worker jika stuck

---

## 11. Live Metrics

Monitoring real-time semua metric device MikroTik via Zabbix/Prometheus.

### Informasi yang ditampilkan
- Chart time-series: CPU, RAM, interface traffic (tx/rx bps) per device
- Interface error rate dan packet drop
- Wireless metrics: RSSI, CCQ, noise floor, connected client count
- BGP session state dan prefix count
- PPPoE active session count
- Queue utilization (Simple Queue & Queue Tree)
- DHCP lease count

### Menu & fungsi
- **Device selector** — pilih satu atau beberapa device untuk ditampilkan metricnya
- **Time range** — pilih rentang waktu: last 1h / 6h / 24h / 7d / 30d / custom
- **Refresh interval** — set auto-refresh: 30s / 1m / 5m / manual
- **Interface selector** — pilih interface spesifik untuk drill-down traffic chart
- **Threshold overlay** — tampilkan garis threshold warning dan critical di atas chart
- **Compare mode** — overlay metric dua device berbeda dalam satu chart untuk perbandingan
- **Export chart** — download chart sebagai PNG
- **Export data** — export raw metric data ke CSV
- **Pin to dashboard** — pin chart tertentu ke halaman Dashboard

---

## 12. Alerts

Manajemen semua alert aktif dan history alert.

### Informasi yang ditampilkan
- Tab: Active alerts / Alert history
- Tabel alert: severity (critical/warning/info), device, message, waktu trigger, status (open/acknowledged/resolved)
- Alert count by severity di bagian atas
- MTTR (mean time to resolve) summary

### Menu & fungsi
- **Acknowledge** — tandai alert sudah dilihat dan sedang dihandle
- **Resolve** — tutup alert dengan catatan resolusi
- **Assign to** — assign alert ke user/engineer tertentu
- **Snooze** — suppress alert untuk X menit/jam (untuk maintenance window)
- **Filter** — filter by severity, device, site, status, tanggal
- **Search** — cari by pesan alert atau device
- **Create alert rule** — define threshold baru: metric + kondisi + severity + channel notifikasi
- **Edit alert rule** — ubah threshold atau channel existing rule
- **Notification channels** — konfigurasi Telegram bot, email SMTP, Slack webhook, PagerDuty
- **Bulk resolve** — resolve multiple alert sekaligus
- Klik alert → detail: timeline event, device info, suggested fix dari Hermes, link ke Troubleshoot Panel

---

## 13. Grafana Dashboards

Embed Grafana dashboard langsung di dalam MikroWize tanpa harus buka Grafana terpisah.

### Informasi yang ditampilkan
- List dashboard yang tersedia (pre-built dan custom)
- Panel Grafana ter-embed langsung di halaman
- Filter variable Grafana bisa dikontrol dari UI MikroWize

### Menu & fungsi
- **Dashboard selector** — pilih dashboard yang mau ditampilkan
- **Variable sync** — filter device/site di MikroWize otomatis apply ke Grafana variable
- **Add dashboard** — daftarkan URL Grafana dashboard baru ke dalam platform
- **Open in Grafana** — buka dashboard di tab baru di Grafana langsung
- **Time range sync** — sinkronkan time range MikroWize dengan Grafana

---

## 14. AI Agent — Hermes

Interface utama untuk interaksi dengan AI agent Hermes untuk troubleshooting, diagnosis, dan auto-remediation.

### Informasi yang ditampilkan
- Chat interface: history conversation dengan Hermes
- Pending remediation suggestions (menunggu approval)
- Active auto-remediation workflow yang sedang berjalan
- Incident list yang di-handle AI
- Confidence score per suggestion

### Menu & fungsi
- **Chat** — ketik pertanyaan atau paste log/error, Hermes analisis dan jawab dengan context jaringan yang ada (misal: "kenapa BGP ke AS12345 drop sejak tadi malam?")
- **Attach log** — paste atau upload log file sebagai context untuk analisis
- **Attach device** — pin device tertentu sebagai context aktif conversation
- **Run suggestion** — execute remediation command yang Hermes sarankan, dengan approval step
- **Auto-approve threshold** — set level confidence minimum untuk Hermes auto-execute tanpa minta approval manual
- **View runbook** — lihat runbook yang tersedia dan bisa dijalankan Hermes
- **Create runbook** — define runbook baru: trigger condition + steps + rollback procedure
- **Approve / Reject** — review dan approve atau reject pending remediation suggestion
- **View execution log** — lihat detail langkah yang dieksekusi Hermes beserta hasilnya
- **Export conversation** — export chat history sebagai dokumentasi incident

---

## 15. Incidents

Manajemen incident jaringan dengan timeline lengkap dan dokumentasi otomatis.

### Informasi yang ditampilkan
- Daftar incident: status (open/investigating/resolved), severity, device terdampak, waktu mulai, durasi
- Timeline per incident: kapan alert masuk, kapan AI analisis, kapan remediation dieksekusi, kapan resolved
- Root cause summary yang di-generate AI
- Metrics saat incident terjadi (snapshot)

### Menu & fungsi
- **Create incident manual** — buka incident baru secara manual (bukan dari alert otomatis)
- **Link alerts** — hubungkan alert yang related ke satu incident
- **Assign** — assign incident ke engineer tertentu
- **Update status** — update status: open → investigating → resolved
- **Add note** — tambah catatan investigasi ke timeline
- **Generate report** — AI generate ringkasan incident (root cause, impact, resolusi, rekomendasi) siap untuk dikirim ke manajemen
- **Export PDF** — export incident report ke PDF
- **Post-mortem template** — buka template post-mortem yang sudah diisi sebagian oleh AI

---

## 16. Users & Roles

Manajemen user, role, dan permission di dalam platform.

### Informasi yang ditampilkan
- Daftar user: nama, email, role, site access, last login, status (active/inactive)
- Daftar role yang ada beserta permission matrix
- Pending invitations

### Menu & fungsi
- **Invite user** — kirim email invitation dengan role yang sudah dipilih
- **Edit user** — ubah role, site access scope, status aktif/nonaktif
- **Deactivate** — nonaktifkan akun user tanpa hapus history
- **Delete** — hapus user permanen
- **Create role** — buat role baru dengan permission granular
- **Edit role** — ubah permission per role
- **Permission matrix** — tampilan tabel lengkap: role vs permission apa saja yang boleh
- **Site scope** — batasi user hanya bisa lihat/manage device di site tertentu
- **MFA management** — enforce MFA untuk role tertentu
- **API key** — generate API key per user untuk akses programmatic ke MikroWize API

---

## 17. Audit Log

Catatan immutable semua aksi yang pernah dilakukan melalui platform.

### Informasi yang ditampilkan
- Tabel audit: timestamp, user, aksi, target (device/template/user/dll), IP address, hasil (success/fail)
- Filter aktif yang sedang dipakai
- Export status

### Menu & fungsi
- **Filter** — filter by user, tipe aksi, device target, tanggal range, hasil (success/fail)
- **Search** — full-text search di log
- **Export CSV** — export filtered log ke CSV untuk compliance atau audit eksternal
- **View detail** — klik entry → lihat payload lengkap aksi (command yang dieksekusi, config sebelum/sesudah, dsb)
- Audit log bersifat append-only, tidak ada tombol edit atau delete

---

## 18. Settings

Konfigurasi global platform MikroWize.

### Informasi yang ditampilkan
- Status koneksi ke service external (Zabbix, Prometheus, Grafana, SMTP, Telegram)
- Credential vault summary (jumlah credential tersimpan)
- Backup policy global
- System info: versi platform, uptime, worker count

### Sub-halaman settings

**General**
- Nama platform, timezone, bahasa
- Session timeout, MFA policy global

**Credential vault**
- Lihat daftar credential tersimpan (tanpa expose value)
- Add / edit / delete credential
- Rotate credential (update password di vault dan push ke device sekaligus)

**Backup policy**
- Default jadwal backup (jam berapa, frekuensi)
- Default retensi (berapa hari)
- Storage backend: local / S3 / NFS

**Notification channels**
- Konfigurasi SMTP untuk email alert
- Telegram bot token + chat ID
- Slack webhook URL
- PagerDuty integration key
- Test kirim notifikasi

**API & integrations**
- Zabbix API endpoint + credentials
- Prometheus scrape endpoint
- Grafana URL + API key
- Webhook outbound (kirim event MikroWize ke sistem lain)

**Change freeze**
- Konfigurasi window waktu dimana semua push config diblokir (production freeze hours)
- Whitelist user yang boleh bypass freeze

**System**
- Celery worker management: lihat status, restart worker
- Database maintenance: vacuum, backup database MikroWize sendiri
- Platform update: cek versi terbaru, apply update
