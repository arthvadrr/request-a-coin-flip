# Request-a-Coin-Flip

**Request-a-Coin-Flip** is a lightweight web app that lets you request a coin flip from someone else using a unique sharable link. It’s designed to be dead simple, secure, and free.

## How It Works

1. A user visits the site and clicks **“Request a Coin Flip.”**
2. This creates a unique link they can share with someone else.
3. The recipient clicks the link and sees a **“Flip the Coin”** button.
4. They flip the coin, and the result (Heads or Tails) is recorded.
5. That result can be revisited via the same link — but it expires after 24 hours.

## Tech Stack

- **Frontend:** Vanilla JavaScript + SCSS
- **Bundler:** Rollup
- **Styling:** Normalize.css + Roboto via @font-face
- **Hosting:** GitHub Pages
- **Backend:** (Pluggable) — Supabase

## Project Structure

```
request-a-coin-flip/
├── public/           # Static assets and built output
├── src/              # Source files
│   ├── styles/       # SCSS stylesheets
│   ├── views/        # JS view components
│   ├── fonts/        # Local fonts (Roboto)
│   └── main.js       # Entry point
├── rollup.config.js  # Rollup configuration
├── package.json      # Project metadata and dependencies
└── README.md         # You’re here
```

## Commands

```bash
npm install
npm run dev
npm run build
```
