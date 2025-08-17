# Bhrr Template

A modern full-stack monorepo starter template featuring:

- **Frontend**: React with Tailwind CSS and Rsbuild for frontend bundling
- **Backend**: Hono.js API

## Project Structure

```
├── app/              # React frontend application
│   ├── App.jsx       # Main application component
│   ├── main.jsx      # Application entry point
│   └── tailwind.css  # Tailwind CSS import
├── backend/          # Hono backend API
│   ├── index.js      # API routes
│   └── package.json  # Backend dependencies
├── dist/             # Built frontend assets (generated)
├── package.json      # Root dependencies and scripts
├── rsbuild.config.mjs # Rsbuild configuration
├── postcss.config.mjs # PostCSS configuration for Tailwind
├── wrangler.jsonc    # Cloudflare Workers configuration
```

## Features

- **Hot Module Replacement**: Development servers for both frontend and backend with live reloading

## Getting Started

### Prerequisites

- Bun
- Nodejs (required if developing for cloudflare workers)

### Installation

```bash
# Clone the template
git clone https://github.com/plabuwu/bhrr
cd bhrr

# Install dependencies
bun install
```

### Development

Start both frontend and backend development servers:

```bash
# Terminal 1: Start frontend development server
bun run dev:app

# Terminal 2: Start backend development server
bun run dev:backend # using bun runtime
bun run dev:worker # using cloudflare workers
```

- Frontend will be available at `http://localhost:3001`
- Backend API will be available at `http://localhost:3000`
- API requests to `/api` from frontend are automatically proxied to the backend

### Building for Production

```bash
# Build the frontend application
bun rsbuild build
```

This will generate optimized static assets in the `dist/` directory.

### Deployment

Deploy to Cloudflare Workers:

**You'll need to configure your Cloudflare credentials for deployment.**

```bash
# Set Cloudflare API Token as env variable
CLOUDFLARE_API_TOKEN = "<your_api_token>"
```

```bash
# Build and deploy
bun wrangler deploy --minify
```

This command will build and deploy the backend worker along with the frontend static assets to Cloudflare Workers