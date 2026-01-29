# Andys Calculator

A Next.js web application for calculating routes, travel time, and fuel consumption between UK ambulance stations.

## Features

- **Route Calculator**: Calculate distance and travel time between stations using OpenRouteService API
- **Fuel Calculator**: Calculate fuel consumption based on vehicle MPG
- **Station Management**: Add, edit, and remove ambulance stations
- **Vehicle Management**: Add, edit, and remove vehicles with their MPG ratings
- **Notes**: Save and review all calculations

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Deployment

This project is ready for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository on Vercel
3. Deploy (no additional configuration needed)

## Data Storage

All data (stations, vehicles, and notes) is stored in browser localStorage. This means:
- Data persists across browser sessions
- Data is specific to each browser/device
- For production with multiple users, consider implementing a database

## API

Uses OpenRouteService API for route calculations. **An API key is required:**

1. Get a free API key at https://openrouteservice.org/dev/#/signup
2. Create a `.env.local` file in the project root
3. Add: `NEXT_PUBLIC_ORS_API_KEY=your_api_key_here`
4. For Vercel deployment, add the environment variable in Vercel project settings

**Security Note:** Never commit API keys to git. Always use environment variables.
