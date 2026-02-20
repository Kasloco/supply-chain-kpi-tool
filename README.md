# Supply Chain KPI Analytics Tool

A capstone project developed for the University of Miami Master's in Business Technology program. This tool provides an interactive analytics dashboard for supply chain performance monitoring, built around a prototype dataset modeled after Tory Burch's logistics operations.

## Overview

The application enables supply chain analysts and business stakeholders to explore KPIs across inbound, outbound, and inventory datasets through both visual dashboards and a natural language query interface powered by the Claude API. Instead of navigating complex spreadsheets, users can ask plain-English questions and receive data-driven answers in real time.

## Features

- **Multi-dataset support** — Processes separate Inbound, Outbound, and Inventory CSV datasets simultaneously
- **KPI dashboards** — Visualizes key metrics including vendor performance, inventory turnover, and customer fulfillment rates
- **Natural language querying** — Integrated Claude API backend allows users to ask questions like *"Which vendor has the highest on-time delivery rate?"* and receive contextual answers
- **University of Miami branded UI** — Clean interface built with Tailwind CSS

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend / API proxy:** Node.js (in `/api`)
- **AI integration:** Anthropic Claude API
- **Data:** Synthetic prototype CSV datasets (Inbound, Outbound, Inventory)

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key

### Installation

```bash
git clone https://github.com/Kasloco/supply-chain-kpi-tool.git
cd supply-chain-kpi-tool
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
supply-chain-kpi-tool/
├── api/                    # Backend API proxy for Claude integration
├── src/
│   ├── App.jsx             # Main application component
│   ├── App.css             # Component styles
│   └── main.jsx            # React entry point
├── public/
├── *.csv                   # Prototype supply chain datasets
└── vite.config.js
```

## Dataset

The included CSV files are synthetic datasets designed to simulate real-world supply chain data:

- **Inbound.csv** — Vendor shipments, lead times, and delivery performance
- **Outbound.csv** — Order fulfillment, shipping status, and customer delivery metrics
- **Inventory.csv** — Stock levels, turnover rates, and warehouse data

## Academic Context

This project was developed as a capstone for the Business Technology program at the University of Miami. It demonstrates the practical application of AI-powered analytics to real-world business operations, combining data engineering, API integration, and product thinking.

## Author

Jonathan Kasloco — [GitHub](https://github.com/Kasloco)
