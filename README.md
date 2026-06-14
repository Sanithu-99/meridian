# Diagram Viewer

A lightweight Next.js app for browsing and exploring Mermaid diagrams. Features zoom/pan, dark mode, mobile sidebar, and graceful error handling for broken diagrams.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Drop any `.mmd` files into the `diagrams/` folder — they appear in the sidebar automatically.

## Adding diagrams

1. Place `.mmd` files in `diagrams/` at the repo root.
2. Name them with a numeric prefix for sidebar ordering, e.g. `01-auth-flow.mmd`.
3. The title shown in the sidebar is derived from the filename: the numeric prefix and hyphens are stripped, words are title-cased.

## Deploying to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel                 # follow prompts; framework auto-detected as Next.js
```

### Option B — Vercel dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Leave all defaults. Click **Deploy**.

No environment variables are required.

> **Note:** The `diagrams/` folder is committed to the repo and read at build time. To update diagrams on a deployed instance, commit new `.mmd` files and redeploy (or trigger a rebuild via the Vercel dashboard).

## Keyboard / interaction

| Action | How |
|---|---|
| Pan | Click and drag |
| Zoom | Scroll wheel or `−` / `+` buttons |
| Reset zoom | Click the `100%` percentage button |
| Dark mode | Moon / sun button (top-right) |
| Mobile sidebar | Hamburger button (top-left on narrow screens) |
