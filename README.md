
# FitLog 健身记录网页

This project is based on a Figma design and implemented with Vite + React.

## Local development

1. Install dependencies

```bash
npm install
```

2. Start dev server

```bash
npm run dev
```

3. Production build (same as Cloudflare build step)

```bash
npm run build
```

4. Preview production bundle locally

```bash
npm run preview
```

## Deploy to Cloudflare Pages

### Option A: Deploy from Git (recommended)

In Cloudflare Pages dashboard:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `18` or `20` (project requires `>=18.18.0`)

Then connect your repository and deploy.

### Option B: Deploy via Wrangler CLI

1. Install Wrangler globally:

```bash
npm install -g wrangler
```

2. Login:

```bash
wrangler login
```

3. Build and deploy:

```bash
npm run build
wrangler pages deploy dist
```

## Cloudflare compatibility notes

- `wrangler.toml` is included with `pages_build_output_dir = "dist"`.
- `public/_redirects` is included (`/* /index.html 200`) to support SPA-style refresh/deep links.
  