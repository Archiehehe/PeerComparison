# Peer Comparison

Compare any company's valuation multiples against reliable peers from S&P 500 (Sector/Industry) for accuracy, with real metrics pulled from multiple APIs.

Live: https://peercomparison.vercel.app/

## Why This Exists

Most peer tools use inconsistent sector data or huge universes that dilute comparisons.  
This one lets you match by sector/industry → fetch clean multiples → see premiums/discounts + simple rules-based explanations for differences.  
Built for quick, repeatable checks without the noise.

## Features

- Multiple peer matching modes: Sector only, Industry only, Industry (fallback to sector)
- Min/max market cap filters (sliders)
- Key valuation multiples: EV/EBITDA, EV/Sales, P/E, P/FCF, P/Sales, Gross Margin, Operating Margin, ROE, Revenue Growth, Debt/Equity
- Peer stats: P25 / Median / P75 + sample size (N)
- Company vs peers: Premium/Discount % vs median
- Rules-based "Why might valuation differ?" section (neutral, factual)
- Peer distribution charts (Recharts histograms)
- Live metrics from Financial Modeling Prep & Alpha Vantage (cached in localStorage for 1 hour)
- Fallback to hardcoded snapshot S&P 500 data when APIs are unavailable
- Export tables/stats as CSV
- Dark, spacious, professional UI (shadcn/ui + Tailwind)

## How It Works

1. App loads → fetches the full S&P 500 constituent list from FMP (cached for 24h)
2. Enter a ticker (e.g., NOW) + select matching mode + mcap range
3. App fetches live metrics for your company + all industry/sector peers
4. Computes medians, percentiles, premiums/discounts
5. View tables, charts, and "why differ" explanations

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui (dark theme)
- Recharts (distribution charts)
- Financial Modeling Prep (primary metrics API)
- Alpha Vantage (fallback metrics API)
- Deployed on Vercel

## Quick Start (Local)

```bash
git clone https://github.com/Archiehehe/PeerComparison.git
cd PeerComparison
cp .env.example .env  # fill in your API keys
npm install
npm run dev
## API Keys

Set these in `.env`:

- `VITE_FMP_KEY` — Financial Modeling Prep (primary)
- `VITE_ALPHA_VANTAGE_KEY` — Alpha Vantage (fallback)
- `VITE_FINNHUB_KEY` — Finnhub (reserved)
- `VITE_TWELVE_DATA_KEY` — Twelve Data (reserved)
