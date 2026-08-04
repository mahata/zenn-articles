---
title: "Initial Setup for a React + Hono Project"
description: This article provides a step-by-step guide to setting up a web application using React (frontend) with Vite and Hono (backend) for Cloudflare Workers. It covers project structure, testing with Vitest, and configuring API endpoints with CORS support. Additionally, it explains how to deploy both frontend and backend together on Cloudflare Workers.
tags: ["React", "Hono", "Vite", "TypeScript"]
cover_image: https://postimage.me/images/2025/03/06/hono-react.png
published: true
---

## What is this article about?

This is a memo about the initial setup when building a new web application using React (frontend) and Hono (backend). In this article, we will set up React using [Vite](https://vitejs.dev/).

By following this guide, you will get the following directory structure. The `frontend/` directory contains the React application, while the `backend/` directory contains the Hono application.

```
$ tree .
.
├── README.md
├── backend
│   ├──...
│   ...
└── frontend
    ├── ...
    ...
```

We assume that [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io) are already installed. The setup was performed on macOS, but it should work in any modern shell environment.

As an appendix, this article also includes instructions on deploying the setup to Cloudflare Workers.

## Creating `frontend/`

Create a `frontend/` directory for the React project.

### Generating a project template with Vite

```
$ pnpm create vite frontend --template react-swc-ts
$ cd frontend
$ pnpm i
```

The `--template` option can be `react-ts` as well. The difference is whether Babel or SWC (Speedy Web Compiler) is used for TypeScript transpilation. Since SWC is generally faster, we use `react-swc-ts` here.

### Running tests with Vitest (Browser Mode)

Install [Vitest](https://vitest.dev/) and related packages:

```
$ pnpm install -D vitest @vitest/browser playwright vitest-browser-react @vitejs/plugin-react @testing-library/jest-dom
```

Add a `"test"` script to `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run --browser=chromium"   <-- Added
},
```

Create the Vitest configuration file `frontend/vitest.config.ts` with the following content:

```typescript
/// <reference types="vitest" />
/// <reference types="@vitest/browser/providers/playwright" />

import react from "@vitejs/plugin-react";
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/setupTests.ts'],
    browser: {
      name: 'chromium',
      provider: 'playwright',
      enabled: true,
    },
  }
})
```

Create `frontend/src/setupTests.ts` and add the following content:

```typescript
import "vitest-browser-react";
import "@testing-library/jest-dom/vitest";
```

Modify `tsconfig.app.json` by adding the following line under `compilerOptions`:

```
"types": ["@vitest/browser/providers/playwright", "vitest/globals"]
```

Now you can run `pnpm test`, and Vitest should start. Since no tests exist yet, it will fail.

Here is a sample test for the default "Vite + React" screen:

```typescript
import { render } from 'vitest-browser-react'
import { expect, test } from 'vitest'
import App from './App'

test('loads and displays greeting', async () => {
  const screen = render(<App />)

  await expect.element(screen.getByText("Vite + React")).toBeInTheDocument()
})
```

Save this as `frontend/src/App.test.tsx` and run the test:

```
$ pnpm test
```

It should pass successfully.

## Creating `backend/`

Navigate back to the project root and run the following commands:

```
$ pnpm create hono@latest ./backend --template cloudflare-workers --pm pnpm --install
$ cd backend
$ pnpm i  # Note: `pnpm i` might be required despite `--install`
```

### Creating an API endpoint

Add the following endpoint to `backend/src/index.ts`:

```typescript
app.get('/api/v1/books', (c) => {
  return c.json([
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  ])
})
```

### Writing tests

Install testing dependencies:

```
$ pnpm i -D vitest @cloudflare/vitest-pool-workers
```

Add the following script to `backend/package.json`:

```json
"scripts": {
  "dev": "wrangler dev",
  "deploy": "wrangler deploy --minify",
  "test": "vitest --run"
},
```

Now, create a test file `backend/src/index.test.ts`:

```typescript
import { expect, test } from 'vitest'
import app from './index'

test('should return JSON', async () => {
  const res = await app.request('http://localhost/api/v1/books');
  expect(res.status).toBe(200);

  const data = await res.json();
  expect(data).toEqual([
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  ]);
})
```

Modify `backend/src/index.ts`::

```typescript
import { cors } from 'hono/cors';

app.use('/api/*', cors({
  origin: 'http://localhost:5173',
}));
```

This is so that the development environment can receive API requests from React. Without this, due to CORS restrictions, HTTP requests will not go through.

## (Appendix) Deploying to Cloudflare Workers

Hono apps can be easily deployed to Cloudflare Workers. Simply go to the `backend/` directory and do `pnpm run deploy`. That's it. This will deploy your **Hono app only** to Cloudflare Workers.

But this article consists of a service with React and Hono, so how do we deploy React with it? [Static Assets in Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) is an option. It uses Cloudflare Workers, but serves files under a specific directory statically. You can output the build results from `frontend/` under `backend/` and use it as Static Assets to deploy React and Hono together.

To deploy both React and Hono together, first modify `frontend/package.json` so that the build artifact is output under `backend/dist`:

```json
"build": "tsc -b && vite build --outDir=../backend/dist",
```

Then add the following `assets` setting to `backend/wrangler.jsonc`:

```json
"assets": {
  "directory": "./dist",
  "binding": "ASSETS"
},
```

Now, run:

```
$ pnpm build  # Run in frontend/
$ pnpm run deploy  # Run in backend/
```

Practically speaking, we do not want to move directories and run lots of commands every time, so it'd be better to prepare small scripts for them.

## Other Options

### Hono + JSX Middleware

Hono has a [JSX middleware](https://hono.dev/docs/guides/jsx), which can be useful if you don't need full React.

### Hono + HonoX

[HonoX](https://github.com/honojs/honox) is another option for combining React and Hono, but it is in alpha at the time of writing.
