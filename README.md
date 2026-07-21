# ExpAnz — Automated Bank Statement Analyzer

Turn raw bank statement PDFs into an interactive spending dashboard — with zero manual data entry.

Upload a statement, and ExpAnz extracts every transaction, categorizes it, deduplicates overlapping uploads, and visualizes exactly where your money goes.

---

## Why

Every budgeting app dies on the same hill: manual data entry. Typing in every transaction is the friction that makes people give up. ExpAnz removes it — you drag in a PDF, and the system does the rest.

## Demo

<!-- Add a screenshot or GIF of the dashboard here -->
<!-- ![Dashboard](docs/dashboard.png) -->

---

## Architecture

Three independent services, each doing one job, communicating over HTTP.

```
  React Dashboard  ──PDF──►  .NET Core API  ──PDF──►  Python Parser
   (Vite,              ◄──JSON──   (EF Core,   ◄─parsed─  (FastAPI,
    Recharts)                       dedup)                 pdfplumber)
                                       │
                                       ▼
                                  SQL Server
```

| Layer | Tech | Responsibility |
|-------|------|----------------|
| Frontend | React + Vite, Recharts | Dashboard, charts, drill-down, upload UI |
| Backend | .NET Core Web API, EF Core | Persistence, aggregation, deduplication, orchestration |
| Parser | Python, pdfplumber, FastAPI | PDF extraction, categorization, reconciliation |
| Database | SQL Server (LocalDB) | Transaction and category storage |

The React app talks only to the .NET API. The API is the single gateway to the database and the only caller of the Python service — one place where every rule (validation, deduplication, what counts as income) is enforced.

---

## Key Engineering Challenges

**Bank statements aren't really tables.** HSBC's layout has no gridlines — structure is conveyed purely by spatial alignment. Instead of reading flat text (which scrambles columns), the parser uses `pdfplumber` to read the x/y coordinates of every word and rebuild the columns. It also handles two-line transactions, dates that appear once and are inherited by the rows beneath them, and direction (money in vs out) determined purely by column position.

**Trusting the parser.** A parser that silently drops one transaction is worse than none. Every statement prints its own summary (opening balance, total in, total out), so after parsing, ExpAnz sums its extracted transactions and reconciles them against those printed totals — to the penny. This caught a real bug where incoming payments without a standard type code were being silently skipped.

**Deduplication.** Overlapping statements (March–April, then April–May) would double-count shared days. Each transaction gets a SHA-256 fingerprint of `date | description | amount`; the API skips any that already exist, making uploads idempotent.

**Honest numbers.** Summary endpoints return `totalOut`, `totalIn`, and `net` separately rather than a single netted figure. The dashboard charts spending (`totalOut`), and income means only the Income category — money returning (refunds, returns) is never counted as income. Amounts are stored as `decimal(18,2)`, never `float`, to avoid drift.

---

## Features

- Drag-and-drop PDF upload with live parse feedback and auto-refresh
- Automatic categorization (broad category + merchant subcategory)
- Two-level drill-down: category → merchant
- Doughnut chart with stable per-category colors
- Date-range filtering
- Month-over-month comparison with trend chart, % change, and biggest-mover callouts
- Category management — add, delete, and reassign transactions, persisted to the database
- Uncategorized review view
- Exclude-internal-transfers toggle (separates true spending from money moving between your own accounts)
- Deduplicated, idempotent uploads

---

## Tech Stack

- **Frontend:** React, Vite, Recharts
- **Backend:** .NET Core Web API, Entity Framework Core, SQL Server
- **Parser:** Python, pdfplumber, FastAPI
- **Testing:** Postman (API), FastAPI `/docs` (parser)

---

## Getting Started

### Prerequisites

- .NET SDK (LTS)
- Node.js 18+
- Python 3.10+
- SQL Server LocalDB (ships with Visual Studio)

### 1. Backend (.NET API)

```bash
cd BudgetAnalyzer.Api
dotnet restore
dotnet ef database update      # creates the database via migrations
dotnet run                     # runs on https://localhost:7131
```

### 2. Parser service (Python)

```bash
cd budget-parser
python -m venv venv
venv\Scripts\activate           # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn parse_service:app --reload --port 8000
```

### 3. Frontend (React)

```bash
cd budget-analyzer-web
npm install
npm run dev                     # runs on http://localhost:5173
```

Open **http://localhost:5173**. To browse the dashboard you need the API + frontend; the parser service is only required for uploading statements.

> **Note:** On first load, if you get a "failed to fetch" error, open `https://localhost:7131/api/transactions` directly in your browser once and accept the self-signed dev certificate, then reload.

---

## API Overview

| Endpoint | Purpose |
|----------|---------|
| `GET /api/transactions` | All transactions |
| `POST /api/transactions/bulk` | Batch insert with deduplication |
| `PUT /api/transactions/{id}/category` | Reassign a transaction's category |
| `GET /api/summary?startDate=&endDate=` | Spending by category over a range |
| `GET /api/summary/monthly?startDate=&endDate=` | Spending by category per month |
| `GET /api/categories` · `POST` · `DELETE` | Manage categories |
| `POST /api/upload` | Upload a PDF → parse → dedup → save |
| `POST /parse` *(Python service)* | PDF in, categorized transactions + reconciliation totals out |

---

## Design Principles

- **Reconciliation as ground truth** — correctness in financial software must be verifiable, not merely plausible.
- **Test bottom-up** — each layer verified in isolation (Postman before UI, parser standalone before integration).
- **Rules over ML** — for a small, known set of banks and merchants, keyword rules are more accurate and fully debuggable. ML becomes worth it only with a corpus of corrected labels.
- **Don't let the presentation flatter the numbers** — chart gross spending, keep income honest, never silently net money-in against money-out.

---

## Roadmap

- [ ] Monzo parser (second bank, same downstream pipeline)
- [ ] Rule learning — recategorize a merchant once in the UI and have it persist for future statements
- [ ] Per-category budgets with progress tracking
- [ ] AI insights over aggregated data (code computes, model narrates)

---

## Note on Data

Bank statements contain highly sensitive information. This is a personal project; if you run it, keep your data local and never commit real statements to the repo. Screenshots in this README use redacted or sample data.

---

## License

<!-- Add your license, e.g. MIT -->
