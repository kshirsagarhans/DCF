# Antigravity Valuation Suite (AVS)

An enterprise-grade, professional discounted cash flow (DCF) valuation and financial modeling web application. Built for investment analysts, portfolio managers, and finance teams, AVS replaces spreadsheet-based workflows with a structured, visually powerful, and rigorous valuation platform.

## 🌟 Key Features

The Antigravity Valuation Suite includes several dedicated financial modules, all integrated into a cohesive "Bloomberg-Terminal" style dark-mode interface:

- **DCF Results Engine:** Robust present value (PV) engine utilizing weighted average cost of capital (WACC) and the Gordon Growth Model for terminal value. Features interactive Value Bridge waterfall charts and valuation composition breakdown.
- **Financial Inputs:** Dynamic, direct-entry data grids for historical and forecasted EBITDA, D&A, CapEx, and Net Working Capital.
- **Sensitivity Analysis:** D3-powered interactive heatmap for visualizing Enterprise Value across WACC vs. Growth Rate matrices. Includes a Recharts-based Tornado chart for parameter sensitivity.
- **Equity Bridge:** Bridges Enterprise Value to Intrinsic Share Price. Includes inputs for Gross Debt, Cash, Preferred Equity, and Minority Interest, paired with a dynamic Margin of Safety visualizer.
- **LBO / Returns (IRR):** Calculates Internal Rate of Return (IRR) and Multiple on Invested Capital (MOIC) based on entry equity, holding period, and exit EV/EBITDA multiples.
- **Monte Carlo Simulation:** A stochastic simulation engine offloaded to a Web Worker. Runs 10k-50k simulated paths using normal distributions for WACC, Growth, and EBITDA margins, outputting an interactive distribution histogram and percentiles (P10, P50, P90).
- **Comparable Analysis (Comps):** Live integration with the Financial Modeling Prep (FMP) API. Auto-fetches peer group multiples (EV/EBITDA, P/E) and plots them on a Margin vs. Multiple scatter chart to establish an implied target valuation.
- **Data Export:** Built-in PDF report generation (`jsPDF` + `html2canvas`) and Excel workbook generation (`SheetJS`).

## 🛠 Tech Stack

- **Frontend Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom CSS Variables (Tokens)
- **State Management:** Zustand (global state) & React Query (server state)
- **Data Visualization:** Recharts (Charts) & D3.js (Heatmaps)
- **Testing:** Vitest
- **Performance:** Web Workers (for Monte Carlo simulations)
- **Database/Auth:** Supabase (PostgreSQL)

## 🏗 Architecture

The codebase follows a **Feature-Sliced Design** architecture, organized by domain:

- `/src/features`: Domain-specific logic, components, and libraries (`auth`, `dcf`, `montecarlo`, `scenarios`, `settings`, `export`).
- `/src/shared`: Reusable UI components (`ParameterSlider`, `MetricCard`, `DataTable`), utilities, and formatters.
- `/src/app`: Application shell, global routing (`react-router-dom`), and context providers.
- `/src/services`: API wrappers (Financial Modeling Prep, Supabase).
- `/src/store`: Zustand stores for scenarios, auth, and theme management.
- `/src/styles`: CSS design tokens (`tokens.css`, `typography.css`) defining the custom design system.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Financial Modeling Prep (FMP) API Key

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/kshirsagarhans/DCF.git
cd DCF
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and add your API keys:

```env
VITE_FMP_API_KEY=your_fmp_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*(Note: The FMP API key is required for the Comparable Analysis module to function.)*

### 3. Running the App

Start the Vite development server:

```bash
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

### 4. Building for Production

Compile TypeScript and build the production bundle:

```bash
npm run build
```

## 🧪 Testing

The valuation math engines (FCF projection, Equity Bridge, IRR, Terminal Value) are heavily unit-tested.

Run the test suite via Vitest:

```bash
npm test
```

## 🔐 Authentication & Data

- The application uses **Supabase** for user authentication and scenario persistence. 
- A fully protected routing setup ensures models are isolated per user.
- The platform also supports a `/share/:token` route for generating read-only public views of specific scenarios.
