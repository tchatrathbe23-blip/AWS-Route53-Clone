# AWS Route 53 Clone

A pixel-perfect, production-grade clone of the **AWS Route 53** DNS Management Web Application built with **Next.js (TypeScript)** on the frontend, **FastAPI** on the backend, and persistent storage with **SQLite**.

---

## 🎯 Architecture & Design Overview

```
                                  +------------------------------+
                                  |   Next.js 14 Frontend        |
                                  |   (Cloudscape UX / Theme)    |
                                  +---------------+--------------+
                                                  | REST API
                                                  v
                                  +------------------------------+
                                  |       FastAPI Backend        |
                                  |    (JWT / CORS / Validation) |
                                  +---------------+--------------+
                                                  | SQLAlchemy 2.0
                                                  v
                                  +------------------------------+
                                  |       SQLite Database        |
                                  |    (Persistent Storage)      |
                                  +------------------------------+
```

### 1. Frontend Engineering
- **Next.js 14 (App Router)** with strictly typed TypeScript interfaces.
- **AWS Cloudscape UI Styling**: Authentic AWS top navigation bar, collapsible resource menus, AWS orange action buttons, Cloudscape data tables, status badges, and breadcrumb trails.
- **Dark Mode**: Fully supported dark/light theme switch with persistence.
- **Keyboard Shortcuts**:
  - `/` &rarr; Quick-focus global or table search bar.
  - `c` / `C` &rarr; Instantly open the creation modal (Hosted Zone / Record).
  - `Escape` &rarr; Close any open modal dialog.
- **Bulk Operations**: Bulk selection and deletion of records and hosted zones with confirmation prompts.
- **Zone File Operations**: One-click RFC 1035 BIND zone file import, BIND export, and JSON export.

### 2. Backend Engineering
- **FastAPI**: Clean layered modular architecture (`core/`, `api/`, `models/`, `schemas/`, `services/`).
- **RFC DNS Validation**: Strict IP and format validation for `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `SRV`, `CAA`, `NS`, and `SOA` records.
- **BIND Zone Parser & Generator**: Custom RFC-compliant zone parser supporting `$ORIGIN`, `$TTL`, comments, and multi-line record grouping.
- **Authentication**: AWS IAM User & Root User sign-in flows with persistent token sessions.

---

## 🗄️ Database Schema

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | String (UUID, PK) | User unique identifier |
| `username` | String (Unique) | IAM username or root email |
| `email` | String (Unique) | Contact email |
| `account_id` | String | 12-digit AWS Account ID |
| `hashed_password` | String | Secure password hash |
| `created_at` | DateTime | Timestamp of user creation |

### `hosted_zones`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Route 53 zone ID (`Z` + 13 hex characters) |
| `name` | String (Indexed) | Domain name (e.g. `example.com.`) |
| `type` | String | `Public hosted zone` or `Private hosted zone` |
| `comment` | Text | Description or notes |
| `vpc_id` | String (Nullable) | Associated VPC for private hosted zones |
| `record_count` | Integer | Dynamic count of records |
| `created_at` | DateTime | Zone creation timestamp |
| `updated_at` | DateTime | Last updated timestamp |

### `dns_records`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Record unique ID |
| `hosted_zone_id` | String (FK &rarr; `hosted_zones.id`) | Cascade-deleted parent zone |
| `name` | String (Indexed) | Fully qualified record name (e.g., `api.example.com.`) |
| `type` | String | Record type: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `PTR`, `SRV`, `CAA`, `SOA` |
| `ttl` | Integer | Time To Live in seconds |
| `routing_policy` | String | Simple, Weighted, Latency, Failover, Geolocation |
| `records` | Text (JSON array) | Stringified array of target routing values / IPs |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last updated timestamp |

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.10+
- **npm** or **pnpm**

---

### Step 1: Run the Backend (FastAPI + SQLite)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
3. (Optional) Re-seed sample data:
   ```bash
   python seed_data.py
   ```
4. Start the FastAPI server with live reload:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
5. Interactive OpenAPI Documentation will be live at:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Step 2: Run the Frontend (Next.js)

1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the backend Pytest suite verifying endpoints, RFC DNS record validations, and database integrity:
```bash
cd backend
$env:PYTHONPATH="."; .\venv\Scripts\pytest
```

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Mock authentication session |
| `GET` | `/api/v1/auth/me` | Fetch active user credentials |
| `GET` | `/api/v1/hosted-zones` | Search, filter & list hosted zones |
| `POST` | `/api/v1/hosted-zones` | Create a new hosted zone (auto-attaches NS & SOA) |
| `GET` | `/api/v1/hosted-zones/{id}` | Get hosted zone details with records |
| `PUT` | `/api/v1/hosted-zones/{id}` | Edit description/comment of a hosted zone |
| `DELETE` | `/api/v1/hosted-zones/{id}` | Delete hosted zone |
| `POST` | `/api/v1/hosted-zones/bulk-delete` | Bulk delete multiple hosted zones |
| `GET` | `/api/v1/hosted-zones/{id}/export?format={json\|bind}` | Export hosted zone to JSON or BIND format |
| `GET` | `/api/v1/records/zone/{zone_id}` | Query & filter records in a hosted zone |
| `POST` | `/api/v1/records/zone/{zone_id}` | Create DNS record with syntax validation |
| `PUT` | `/api/v1/records/{id}` | Update existing DNS record |
| `DELETE` | `/api/v1/records/{id}` | Delete a DNS record |
| `POST` | `/api/v1/records/bulk-delete` | Bulk delete DNS records |
| `POST` | `/api/v1/records/zone/{zone_id}/import-bind` | Upload and parse BIND zone file |
