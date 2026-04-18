# ArthaGraph 📊

> **"Artha"** (अर्थ) — Sanskrit for *wealth*, *meaning*, and *purpose*. **ArthaGraph** turns raw financials into visual, rigorous, and actionable valuation models.

ArthaGraph is a **professional-grade, interactive Discounted Cash Flow (DCF) valuation and financial modelling platform** designed for investment analysts, portfolio managers, and finance teams. It replaces spreadsheet-based workflows with a structured, visually powerful, and rigorous analysis environment — with first-class support for **Indian markets (NSE & BSE)** alongside global exchanges.

---

## 🌐 Live Demo / Repository

- **GitHub:** [github.com/kshirsagarhans/DCF](https://github.com/kshirsagarhans/DCF)
- **Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase · FMP API

---

## ✨ Features

### 📐 Valuation Engine
| Module | Description |
|---|---|
| **DCF Model** | Multi-year free cash flow projections using WACC and the Gordon Growth Model for Terminal Value |
| **Sensitivity Analysis** | D3-powered WACC × Growth Rate heatmap + Tornado chart showing impact of each parameter |
| **Equity Bridge** | Bridges EV → Equity Value → Intrinsic Share Price with Margin of Safety visualiser |
| **IRR / Returns** | Internal Rate of Return (IRR) and MOIC calculator for LBO / private equity returns |
| **Monte Carlo Simulation** | 10k–50k stochastic paths run in a Web Worker; outputs P10/P50/P90 distribution histogram |
| **Comparable Analysis (Comps)** | Fetches live peer multiples (EV/EBITDA, P/E) from FMP API; scatter chart for implied valuation |

### 🇮🇳 Indian Market Support
- **NSE & BSE** exchange selectors with ticker auto-completion
- One-click **Nifty 50 Quick-Pick** panel (Reliance, TCS, HDFC, Infosys, and more)
- **Indian market defaults:** WACC ~12%, Terminal Growth ~7%, Corporate Tax 25.17% (India effective rate)
- **CAPM calibrated for India:** Risk-free rate based on 10-year G-Sec (7%) + India Equity Risk Premium
- **EBITDA displayed in ₹ Crores** (INR stocks) vs **$ Millions** (USD stocks)
- Supports both `.NS` (NSE) and `.BO` (BSE) ticker formats via FMP API

### 📊 Data & Integrations
- **Financial Modeling Prep (FMP) API** — live company profiles, key metrics, and income statements
- **Supabase** — authentication, row-level security, and scenario persistence
- **Auto-CAPM** — estimates WACC from real-time beta, risk-free rate, and equity risk premium

### 📤 Exports
- **PDF Report** — full-page valuation report with `jsPDF` + `html2canvas`
- **Excel Workbook** — multi-sheet model (Parameters, DCF Build, Equity Bridge) via `SheetJS`

### 🔐 Authentication
- Email/Password sign-in & **Sign Up** with confirmation email
- **Google OAuth** (one-click)
- **Forgot Password** reset flow
- Password strength indicator + confirm-password validation

---

## 🏗 Architecture

ArthaGraph follows a **Feature-Sliced Design (FSD)** pattern:

```
src/
├── app/               # Router, global providers
├── features/
│   ├── auth/          # Login, Sign-Up, AuthGuard
│   ├── dcf/           # DCF results, inputs, sensitivity, equity bridge, IRR, Monte Carlo, comps
│   ├── scenarios/     # Scenario list, creation modal, shared view
│   ├── export/        # PDF + Excel export utilities
│   └── settings/      # User settings page
├── shared/
│   ├── components/    # MetricCard, DataTable, CurrencyInput, Modal, Toast, Sidebar, TopBar
│   └── utils/         # Currency formatter, number helpers
├── services/
│   ├── marketData.ts  # FMP API wrapper (profile, metrics, income statement, search)
│   └── supabase.ts    # Supabase client with graceful fallback
├── store/             # Zustand global state (scenarios, auth, theme)
├── styles/            # CSS design tokens (tokens.css, typography.css)
└── types/             # dcf.ts, market.ts — shared TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Financial Modeling Prep** API key — [get one free](https://financialmodelingprep.com/developer/docs/)
- **Supabase** account — [supabase.com](https://supabase.com) *(optional for local-only use)*

### 1. Clone & Install
```bash
git clone https://github.com/kshirsagarhans/DCF.git
cd DCF
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
# Required — Financial Modeling Prep API
VITE_FMP_API_KEY=your_fmp_api_key_here

# Optional — Supabase (for cloud auth & persistence)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** Without Supabase credentials the app still runs fully in local mode — scenarios are stored in memory (Zustand).

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔑 Supported Exchanges

| Exchange | Ticker Format | Currency | Example |
|---|---|---|---|
| NSE (India) | `TICKER.NS` | INR | `RELIANCE.NS` |
| BSE (India) | `TICKER.BO` | INR | `RELIANCE.BO` |
| NASDAQ (US) | `TICKER` | USD | `AAPL` |
| NYSE (US) | `TICKER` | USD | `JPM` |
| LSE (UK) | `TICKER.L` | GBP | `HSBA.L` |

---

## 💹 Financial Methodology

### DCF Engine
- **Free Cash Flow:** `EBIT × (1 − Tax) + D&A − CapEx − ΔNWC`
- **EBIT:** `EBITDA − D&A`
- **NOPAT:** Tax is applied only when EBIT > 0
- **Terminal Value:** Gordon Growth Model — `TV = FCF_final × (1 + g) / (WACC − g)`
- **Discount Rate:** All FCFs and TV discounted using the same WACC
- **Validation:** Enforces `WACC > g` (Gordon constraint) and WACC ∈ [1%, 100%]

### CAPM for WACC Estimation
```
WACC = Risk-Free Rate + Beta × Equity Risk Premium

India:  RFR = 7.0% (10-year G-Sec),  ERP = 7.0%
USA:    RFR = 4.5% (10-year T-Bill),  ERP = 5.5%
```

### Monte Carlo
- Samples `N` paths (10k–50k) using Normal distributions for WACC, Growth, and EBITDA margin
- Runs in a **Web Worker** to keep the UI responsive
- Outputs Enterprise Value distribution + P10, P50, P90 percentiles

---

## 🧪 Testing

```bash
npm test
```

Unit tests (Vitest) cover:
- `calculateFCF` — discount factors, NOPAT logic, CapEx guards
- `calculateDCF` — terminal value math, parameter validation, edge cases
- `formatCurrency` — currency code guards, INR Crore formatting

---

## 📁 Project Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server at `localhost:5173` |
| `npm run build` | TypeScript check + Vite production build |
| `npm test` | Run Vitest test suite |
| `npm run lint` | ESLint on `src/` |

---

## 🎨 Design System

ArthaGraph uses a **dark-mode first** design with a Bloomberg Terminal-inspired aesthetic:
- CSS custom properties (design tokens) for all colors, spacing, and shadows
- Google Fonts: **Space Grotesk** (display) + **Inter** (body) + **JetBrains Mono** (data)
- Tailwind CSS for utility-first layout
- Micro-animations on all transitions for a premium feel

---

## 📄 License

MIT © 2025 — Built with ♥ for the finance and investment community.
