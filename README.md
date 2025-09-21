# AgilityFeat Underwriting Frontend

React + Vite single-page application that consumes the AgilityFeat underwriting API. It lets credit analysts submit borrower data, review the automated decision, and inspect the historical evaluations stored by the backend for a given `user_id`.

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set the backend URL (optional)**
   The UI targets `/api` by default, so with the provided Vite proxy it will forward requests to `http://localhost:8080`. If your backend lives elsewhere, create a `.env` file and override the base URL:
   ```bash
   echo 'VITE_API_BASE_URL=https://your-backend-host' > .env
   ```

3. **Run the app in development mode**
   ```bash
   npm run dev
   ```
   The Vite dev server runs on [http://localhost:5173](http://localhost:5173) and proxies API calls to the Go backend running on port `8080`.

4. **Production build**
   ```bash
   npm run build
   npm run preview
   ```

## UI features

- Complete underwriting form with validation, occupancy type choices, and disabled states when the API is unreachable.
- Calls `POST /api/v1/underwriting` to submit borrower data and surfaces the returned decision, DTI, LTV, and loan context.
- Renders the borrower history from `GET /api/v1/underwriting/history/{user_id}` with refresh capability, loading states, and graceful fallbacks when the API responds with different payload shapes.
- Health indicator fed by `GET /api/v1/ping` so the user knows whether the backend is reachable.
- Responsive layout with cards, table overflow handling, and accessible focus styles.

## Environment variables

| Variable             | Purpose                                                | Default                |
| -------------------- | ------------------------------------------------------ | ---------------------- |
| `VITE_API_BASE_URL`  | Explicit backend base URL for API calls                | `''` (same origin)     |
| `VITE_PROXY_TARGET`  | Alternate backend target for the Vite dev server proxy | `http://localhost:8080` |

When both variables are left untouched, running the Go backend on `localhost:8080` will work out of the box in development.

## Scripts

- `npm run dev` – start the Vite dev server with HMR and proxy configured for `/api`.
- `npm run build` – type-check and produce an optimized production bundle.
- `npm run preview` – locally preview the production build output.
- `npm run lint` – run ESLint against the TypeScript sources.
