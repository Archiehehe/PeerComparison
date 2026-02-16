# Peer Comparison

Compare any company's valuation multiples against reliable peers from S&P 500 (Sector/Industry) for accuracy, with real metrics pulled from multiple APIs.

Live: https://peercomparison.vercel.app/ 

## Why This Exists

Most peer tools use inconsistent sector data or huge universes that dilute comparisons.  
This one lets you control the peer universe via CSV → match by sector/industry → fetch clean multiples → see premiums/discounts + simple rules-based explanations for differences.  
Built for quick, repeatable checks without the noise.

## Features

- Multiple peer matching modes: Sector only, Industry only, Industry (fallback to sector)
- Min/max market cap filters (sliders)
- Key valuation multiples: EV/EBITDA, EV/Sales, P/E, P/FCF, P/Sales, Gross Margin, Operating Margin, ROE, Revenue Growth, Debt/Equity
- Peer stats: P25 / Median / P75 + sample size (N)
- Company vs peers: Premium/Discount % vs median
- Rules-based "Why might valuation differ?" section (neutral, factual)
- Peer distribution charts (Recharts histograms)
- Custom Group mode: Paste tickers or upload CSV for ad-hoc baskets
- Multi-API fetching (yfinance primary + Alpha Vantage/Finnhub/FMP fallbacks)
- Optional AI narrative summaries (opt-in, aggregated data only)
- Export tables/stats as CSV/JSON
- Dark, spacious, professional UI (shadcn/ui + Tailwind)

## How It Works

1. Enter a ticker (e.g., NOW) + select matching mode + mcap range
2. App filters peers from CSV → fetches metrics via APIs → computes medians, percentiles, premiums/discounts
3. View tables, charts, and "why differ" explanations
4. Switch to Custom Group tab for manual ticker lists

All processing is client-side where possible. Metrics are fetched live (cached in localStorage for 1 hour).

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui (dark theme)
- PapaParse (CSV parsing)
- Recharts (distribution charts)
- Zustand (state management)
- yfinance + Alpha Vantage / Finnhub / FMP API fallbacks
- Deployed on Vercel

## Quick Start (Local)

```bash
git clone https://github.com/Archiehehe/peer-comparison.git
cd peer-comparison
npm install
npm run dev
