Frontend demo (Vite + React)

Install & run:

```bash
cd frontend
npm install
npm run dev
```

Dev server proxies `/api` to `http://localhost:8080` (see `vite.config.js`).

Components:
- `ProfileWithPhotos` (src/components/ProfileWithPhotos.jsx): fetches `/api/users/{id}/profile-with-photos` and displays primary photo + grid
- `PhotoUpload` (src/components/PhotoUpload.jsx): simple file input + FormData POST to `/api/users/{id}/photos`
