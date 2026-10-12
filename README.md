# API Export — US Home Décor Buyer Discovery & Email Automation

A full-stack B2B lead-generation and personalized outreach dashboard built for discovering genuine US-based home décor retail stores, boutiques, and interior design studios through live APIs, discovering verified business contacts via company domains, and delivering compliant, personalized wholesale outreach.

---

## 1. Executive Summary & Architecture

- **Product Name**: API Export
- **Frontend**: React 19, Vite 8, Modern CSS Design System (Glassmorphic dark theme, responsive flex/grid layouts, Lucide icons, accessible modal overlays).
- **Backend**: Node.js v24, Express 4, native ES modules.
- **Local Persistence**: Zero-dependency SQLite database utilizing Node.js 24's built-in `node:sqlite` (`DatabaseSync`), storing leads, contact rosters, and immutable outreach audit logs.
- **Live Provider Integrations**:
  - **Google Places API (New)** (`POST https://places.googleapis.com/v1/places:searchText`): Searches genuine US home décor businesses with explicit field masks and deduplication.
  - **Hunter.io API** (`GET https://api.hunter.io/v2/domain-search`): Discovers verified business email contacts from company domains with confidence scores and web source citations.
  - **Resend API** (`POST https://api.resend.com/emails`): Dispatches diagnostic test emails and authorized B2B outreach with delivery receipt tracking.
- **Strict Anti-Fabrication Guarantee**: No mock data is ever substituted for failed live API calls. Unconfigured credentials display clear setup instructions. An isolated **Sandbox Fixture Mode** is provided for offline UI testing and is explicitly flagged.
- **Email Safety & Compliance**: Bulk automated sending is prohibited; explicit user confirmation (`confirmed: true`) is required before sending; includes CAN-SPAM compliant opt-out language and sender physical address notices.

---

## 2. Windows PowerShell Setup & Installation

### Step 1: Clone or Navigate to the Project Root

```powershell
cd "c:\Users\Dell\Desktop\API project"
```

### Step 2: Install Dependencies

```powershell
# Install root, backend, and frontend dependencies
npm --prefix server install
npm --prefix client install
```

### Step 3: Configure Environment Variables

Copy `server/.env.example` to `server/.env`:

```powershell
Copy-Item "server\.env.example" "server\.env"
```

Open `server\.env` in your text editor and add your API keys:

```ini
PORT=5000

# 1. Google Places API (New)
# Enable 'Places API (New)' in Google Cloud Console
# https://console.cloud.google.com/apis/credentials
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# 2. Hunter.io API
# https://hunter.io/api_keys
HUNTER_API_KEY=your_hunter_api_key_here

# 3. Resend API
# https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here

# 4. Verified Sender Address in Resend (e.g. onboarding@resend.dev or your custom domain)
EMAIL_FROM=onboarding@resend.dev

# 5. Diagnostic Test Recipient Address
TEST_EMAIL_TO=your_email@example.com
```

> **Security Note**: `server/.env` is strictly excluded in `.gitignore` and keys are never transmitted to browser bundles or client responses.

---

## 3. Running the Application

### Option A: Unified Production Mode (Recommended)

Build the React frontend and run the Express backend on `http://localhost:5000`:

```powershell
# 1. Build client bundle
npm --prefix client run build

# 2. Start unified server
npm --prefix server start
```

Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### Option B: Development Mode (Vite Hot-Reload)

Run the backend and frontend dev server simultaneously in two PowerShell terminals:

**Terminal 1 (Backend API on Port 5000):**
```powershell
npm --prefix server run dev
```

**Terminal 2 (Vite Dev Server on Port 3000):**
```powershell
npm --prefix client run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser (all `/api/*` calls automatically proxy to port 5000).

---

## 4. Automated Testing

The backend includes 23 automated tests running on Node's native test runner (`node:test` and `node:assert`):

```powershell
npm --prefix server test
```

### Test Suite Coverage:
1. **API Route Validation & Safety Behavior** (`test/api.test.js`):
   - Health check endpoint and provider configuration flags.
   - Rejection of missing search keywords or location parameters.
   - Clean 503 response and setup guidance when Google Places key is unconfigured (no fabricated data).
   - Domain validation and 503 handling when Hunter.io key is unconfigured.
   - Strict enforcement of user confirmation (`confirmed: true`) on cold outreach.
   - Recipient email format and CAN-SPAM compliance validation.
   - Diagnostic test email validation and error handling.
   - Email audit history retrieval.
   - Email personalization template preview generator.
2. **SQLite Persistence Layer** (`test/db.test.js`):
   - Lead saving and deduplication by Google `place_id`.
   - Contact association with foreign key constraints.
   - Email audit log recording and historical querying.
3. **Domain Extractor Utility** (`test/domain.test.js`):
   - Parsing full URLs, protocols, ports, subpaths, and domain sanitization.
   - Rejection of generic search engines and social platforms.
4. **Email Template Engine** (`test/emailTemplate.test.js`):
   - Personalized copy generation, dynamic placeholders, physical address placeholders, and opt-out clauses.

---

## 5. API Routes Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns backend health, SQLite database metrics, and provider configuration status. |
| `GET` | `/api/buyers/search?q=...&location=...` | Searches live US businesses via Google Places API (New). Persists leads to SQLite. |
| `GET` | `/api/buyers/:id/emails?domain=...` | Discovers verified business emails from company domain via Hunter.io. |
| `GET` | `/api/buyers` | Returns all previously discovered leads persisted in SQLite. |
| `GET` | `/api/buyers/:id` | Returns lead details and its cached discovered contacts. |
| `POST` | `/api/emails/test` | Dispatches a diagnostic verification email to `TEST_EMAIL_TO` via Resend API. |
| `POST` | `/api/emails/send` | Dispatches a personalized outreach email to a contact via Resend (Requires `confirmed: true`). |
| `POST` | `/api/emails/preview` | Generates personalized copy preview without sending. |
| `GET` | `/api/emails/history` | Returns the audit log of all test and outreach emails with Resend message IDs. |

---

## 6. Integration Status Overview

| Provider | Purpose | Status in Local Environment | Notes |
|---|---|---|---|
| **Google Places (New)** | Business Discovery | Ready for live key (Unconfigured by default) | Returns live US businesses with addresses, ratings, and domains when key is supplied in `.env`. Returns clean 503 error if unconfigured. |
| **Hunter.io** | Email Discovery | Ready for live key (Unconfigured by default) | Returns verified emails with confidence score and source URLs. Returns clean 503 error if unconfigured. |
| **Resend** | Email Delivery | Ready for live key (Unconfigured by default) | Requires `RESEND_API_KEY`, `EMAIL_FROM`, and `TEST_EMAIL_TO`. Dispatches live messages only with explicit approval. |
| **SQLite (node:sqlite)** | Local Persistence | **Fully Verified & Operational** | Uses Node 24 native `DatabaseSync` with zero external C++ build dependencies. Persists leads, contacts, and email history. |

---

## 7. Recruiter Demonstration Script

Follow this 5-minute walkthrough to evaluate all features:

1. **Verify Health & Environment Detection**:
   - Open `http://localhost:5000`.
   - Observe the top status bar: Status pills reflect whether Google Places, Hunter.io, and Resend keys are configured.
   - Click the **"Setup"** button in the header: Review the setup instructions for `server/.env`.
2. **Explore Sandbox Fixture Mode (Offline UI Evaluation)**:
   - Click the **"Sandbox Fixture Mode"** button in the header (or click **"Preview with Sandbox Fixtures"** in the banner).
   - Notice the purple banner indicating synthetic preview fixtures.
   - Explore the discovered leads table: notice company names, addresses, star ratings, categories, website domains, and Google Maps source links.
3. **Inspect Contact Discovery**:
   - Click **"2 Contacts Found"** on *Dallas Artisanal Living*.
   - In the modal, examine the verified contact (*Jessica Miller, Head of Merchandising*), her 94% confidence score bar, and the clickable verified source URLs.
4. **Test the Personalized Outreach Composer & Two-Stage Safety Confirmation**:
   - Click **"Compose Outreach"**.
   - Notice the pre-filled, personalized wholesale pitch tailored for US home décor boutiques, with low MOQs, retail markup margins, physical address, and opt-out instructions.
   - Edit the subject line or body text as desired.
   - Click **"Review & Send Outreach"**.
   - Notice the safety confirmation prompt: *"Explicit User Confirmation Required — You are about to deliver a real B2B email to buyer@dallasartisanal.example via Resend API."*
   - Click **"Back to Editing"** or **"Cancel"** to demonstrate email safety.
5. **Inspect the Local SQLite Database & Audit Logs**:
   - Switch to the **"SQLite Database"** tab to see previously stored records.
   - Switch to the **"Outreach Audit History"** tab to see the immutable log of sent test messages and outreach records, complete with timestamps and provider IDs.
6. **Live Mode Search (When Keys Configured)**:
   - Click **"Live API Mode"**.
   - Enter a category (e.g. `Home Décor Boutique`) and a US location (e.g. `Dallas, Texas` or `High Point, NC`).
   - Click **"Discover Leads"** to trigger live Google Places API queries.

---

## 8. Remaining Limitations

1. **Third-Party API Credit Limits**:
   - Google Places API (New) requires a Google Cloud project with Places API (New) enabled.
   - Hunter.io free tier provides 25 monthly domain searches.
   - Resend free tier allows testing to the account owner's email (`onboarding@resend.dev`) until a custom domain is DNS-verified.
2. **Domain Discovery Fallback**:
   - If a home décor business on Google Places does not have an official website listed (e.g. only a Facebook page or phone number), Hunter.io domain search cannot be executed for that individual business.
3. **Email Delivery vs Acceptance**:
   - Resend API returns HTTP 200 upon successfully accepting and queuing the message (`accepted_by_provider`). Final inbox delivery depends on the recipient mail server's spam filters and DNS MX records.
